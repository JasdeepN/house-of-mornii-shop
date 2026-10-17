//
// This Worker holds Shopify secrets server-side and provides two
// capabilities, dispatched via an internal router on `url.pathname`:
//
//   1. POST /api/shopify/webhook   — HMAC-verified Shopify webhook receiver
//   2. scheduled()                 — daily Cron Trigger that exports
//                                    products/collections/orders to R2 and
//                                    records a KV index of the latest backup
//
// Secrets never reach the browser. See wrangler.toml for bindings/vars and
// docs/deployment-runbook.md for the secrets-provisioning runbook.

import { BACKUP_RESOURCES, BACKUP_PAGE_SIZE, API_VERSION, fetchAllPages, type BackupResource } from './backup-queries'
import { verifyShopifyWebhook, dispatchWebhookTopic } from './webhook'

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
  // Bindings
  SHOPIFY_BACKUPS?: MinimalR2Bucket
  BACKUP_INDEX?: MinimalKVNamespace
  [key: string]: unknown
}

/**
 * Handle POST /api/shopify/webhook — HMAC-verified Shopify webhook receiver.
 */
async function handleWebhook(
  request: Request,
  env: WorkerEnv
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
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
      { status: 401, headers: { 'Content-Type': 'application/json' } }
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
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Internal router — dispatches on `url.pathname`.
 */
async function router(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)

  if (url.pathname === '/api/shopify/webhook') {
    return handleWebhook(request, env)
  }

  return new Response(
    JSON.stringify({ error: 'Not found' }),
    { status: 404, headers: { 'Content-Type': 'application/json' } }
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
