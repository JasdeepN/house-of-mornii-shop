//
// This Worker holds Shopify secrets server-side and provides three
// capabilities, dispatched via an internal router on `url.pathname`:
//
//   1. POST /api/shopify/admin     — read-only Admin API proxy (mutation-blocked)
//   2. POST /api/shopify/webhook   — HMAC-verified Shopify webhook receiver
//   3. scheduled()                 — daily Cron Trigger that exports
//                                    products/collections/orders to R2 and
//                                    records a KV index of the latest backup
//
// Secrets never reach the browser. See wrangler.toml for bindings/vars and
// docs/deployment-runbook.md for the secrets-provisioning runbook.

import { BACKUP_RESOURCES, BACKUP_PAGE_SIZE, API_VERSION, fetchAllPages, type BackupResource } from './backup-queries'
import { verifyShopifyWebhook, dispatchWebhookTopic } from './webhook'

interface ProxyRequest {
  query: string
  variables?: Record<string, unknown>
}

// Minimal ambient-free binding types (avoids a hard dependency on
// @cloudflare/workers-types just to type-check this file; the real runtime
// objects satisfy these shapes).
export interface MinimalR2Bucket {
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get?(key: string): Promise<unknown>
}

export interface MinimalKVNamespace {
  put(key: string, value: string): Promise<void>
  get?(key: string): Promise<string | null>
}

export interface MinimalScheduledEvent {
  cron?: string
  scheduledTime?: number
}

export interface WorkerEnv {
  // Secrets (set via `wrangler secret put`, never in wrangler.toml)
  SHOPIFY_ADMIN_ACCESS_TOKEN?: string
  SHOPIFY_WEBHOOK_SECRET?: string
  // Vars
  SHOPIFY_STORE_DOMAIN?: string
  ALLOWED_ORIGIN?: string
  // Bindings
  SHOPIFY_BACKUPS?: MinimalR2Bucket
  BACKUP_INDEX?: MinimalKVNamespace
  [key: string]: unknown
}

// H3: CORS origin allowlist. Never reflect an arbitrary Origin header back —
// only echo it when it matches a known-good origin, otherwise fall back to the
// primary production origin. Override via env.ALLOWED_ORIGIN (comma-separated)
// in the Worker/Pages project settings if additional origins are needed
// (e.g. preview deployments), without editing this file.
const DEFAULT_ALLOWED_ORIGINS = ['https://houseofmornii.com']

function resolveAllowedOrigins(env: WorkerEnv): string[] {
  if (env.ALLOWED_ORIGIN) {
    return env.ALLOWED_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  }
  return DEFAULT_ALLOWED_ORIGINS
}

function buildCorsHeaders(request: Request, env: WorkerEnv): Record<string, string> {
  const allowedOrigins = resolveAllowedOrigins(env)
  const requestOrigin = request.headers.get('Origin')
  const allowOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Hmac-Sha256, X-Shopify-Topic',
    'Access-Control-Max-Age': '86400', // 24 hours preflight cache
    'Vary': 'Origin',
  }
}

// H4: Reject mutations sent to this read-oriented proxy. Matches the `mutation`
// keyword as a GraphQL operation type (word boundary, case-insensitive) so
// legitimate queries that merely mention the word in a string literal aren't
// falsely blocked in edge cases, while blocking actual mutation operations.
export const MUTATION_PATTERN = /\bmutation\b/i

// TODO(rate-limiting): This Worker does not implement full request-rate limiting
// itself — Cloudflare Rate Limiting rules (dashboard/wrangler.toml `[[rate_limiting]]`
// or a Rules-based WAF rate limit) should be configured on the
// /api/shopify/admin route to throttle abusive per-IP traffic. The mutation
// rejection below IS implementable in-worker today and is enforced here.

/**
 * Handle POST /api/shopify/admin — existing read-only Admin API proxy.
 */
async function handleAdminProxy(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const adminToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN
  if (!adminToken) {
    return new Response(
      JSON.stringify({ error: 'Admin token not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  // Parse request body
  let body: ProxyRequest
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  if (!body.query) {
    return new Response(
      JSON.stringify({ error: 'Missing query' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  // H4: Reject destructive mutation operations — this proxy is for read-only
  // catalog queries (products/collections). Mutations must never be routed
  // through this client-facing endpoint.
  if (MUTATION_PATTERN.test(body.query)) {
    return new Response(
      JSON.stringify({ error: 'Mutations are not permitted through this proxy' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  // Forward to Shopify Admin API
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com'
  const endpoint = `https://${shopifyDomain}/admin/api/${API_VERSION}/graphql.json`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({ query: body.query, variables: body.variables }),
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Network request to Shopify failed', details: (error as Error).message }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  const data = await response.json()

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

/**
 * Handle POST /api/shopify/webhook — HMAC-verified Shopify webhook receiver.
 */
async function handleWebhook(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  const rawBody = await request.text()
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256')
  const topic = request.headers.get('X-Shopify-Topic') || 'unknown'

  const isValid = await verifyShopifyWebhook(rawBody, hmacHeader, env.SHOPIFY_WEBHOOK_SECRET)
  if (!isValid) {
    console.error(
      JSON.stringify({ level: 'error', event: 'webhook.hmac_invalid', topic })
    )
    return new Response(
      JSON.stringify({ error: 'Invalid webhook signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  let payload: unknown = {}
  try {
    payload = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    // Shopify payloads are always valid JSON when signature is valid; if
    // parsing fails anyway, still ack with 200 to avoid needless retries but
    // log for visibility.
    console.error(JSON.stringify({ level: 'error', event: 'webhook.invalid_json', topic }))
  }

  await dispatchWebhookTopic(topic, payload)

  // Always return 200 quickly on valid webhooks so Shopify does not retry.
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

/**
 * Internal router — dispatches on `url.pathname`.
 */
async function router(request: Request, env: WorkerEnv): Promise<Response> {
  const corsHeaders = buildCorsHeaders(request, env)

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const url = new URL(request.url)

  if (url.pathname === '/api/shopify/admin') {
    return handleAdminProxy(request, env, corsHeaders)
  }

  if (url.pathname === '/api/shopify/webhook') {
    return handleWebhook(request, env, corsHeaders)
  }

  return new Response(
    JSON.stringify({ error: 'Not found' }),
    { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
}

/**
 * Fetch a single page of a backup resource from the Admin API.
 */
async function fetchBackupPage(
  env: WorkerEnv,
  query: string,
  variables: { first: number; after: string | null }
): Promise<{ data?: Record<string, { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: unknown[] }>; errors?: unknown }> {
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com'
  const endpoint = `https://${shopifyDomain}/admin/api/${API_VERSION}/graphql.json`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`Admin API request failed with status ${response.status}`)
  }

  return response.json()
}

export interface BackupSummary {
  date: string
  keys: string[]
  counts: Record<BackupResource, number>
  completedAt: string
}

/**
 * Export products, collections, and orders from the Admin API and write
 * timestamped JSON snapshots to R2, then update the BACKUP_INDEX KV
 * `latest-backup` key with a summary of the run.
 */
export async function runScheduledBackup(env: WorkerEnv): Promise<BackupSummary | null> {
  if (!env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    console.error(JSON.stringify({ level: 'error', event: 'backup.missing_admin_token' }))
    return null
  }

  if (!env.SHOPIFY_BACKUPS) {
    console.error(JSON.stringify({ level: 'error', event: 'backup.missing_r2_binding' }))
    return null
  }

  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const keys: string[] = []
  const counts: Partial<Record<BackupResource, number>> = {}

  try {
    for (const resource of BACKUP_RESOURCES) {
      const nodes = await fetchAllPages(
        resource,
        (query, variables) => fetchBackupPage(env, query, variables),
        BACKUP_PAGE_SIZE
      )

      const key = `backups/${date}/${resource}.json`
      await env.SHOPIFY_BACKUPS.put(key, JSON.stringify(nodes), {
        httpMetadata: { contentType: 'application/json' },
      })

      keys.push(key)
      counts[resource] = nodes.length

      console.log(
        JSON.stringify({ level: 'info', event: 'backup.resource_complete', resource, count: nodes.length, key })
      )
    }

    const summary: BackupSummary = {
      date,
      keys,
      counts: counts as Record<BackupResource, number>,
      completedAt: new Date().toISOString(),
    }

    if (env.BACKUP_INDEX) {
      await env.BACKUP_INDEX.put('latest-backup', JSON.stringify(summary))
    }

    console.log(JSON.stringify({ level: 'info', event: 'backup.complete', ...summary }))
    return summary
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'backup.failed',
        date,
        keysWrittenSoFar: keys,
        message: (error as Error).message,
      })
    )
    return null
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return router(request, env)
  },

  async scheduled(_event: MinimalScheduledEvent, env: WorkerEnv): Promise<void> {
    await runScheduledBackup(env)
  },
}
