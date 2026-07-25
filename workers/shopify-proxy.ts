// workers/shopify-proxy.ts — Cloudflare Worker for secure Admin API proxy
//
// This worker holds the Shopify Admin Access Token server-side and forwards
// authenticated requests to Shopify. The token never reaches the browser.
//
// Usage:
//   POST /api/shopify/admin  → Forward to Shopify Admin API
//   OPTIONS /api/shopify/admin → CORS preflight

interface ProxyRequest {
  query: string
  variables?: Record<string, unknown>
}

// H3: CORS origin allowlist. Never reflect an arbitrary Origin header back —
// only echo it when it matches a known-good origin, otherwise fall back to the
// primary production origin. Override via env.ALLOWED_ORIGIN (comma-separated)
// in the Worker/Pages project settings if additional origins are needed
// (e.g. preview deployments), without editing this file.
const DEFAULT_ALLOWED_ORIGINS = ['https://houseofmornii.com']

function resolveAllowedOrigins(env: { [key: string]: string }): string[] {
  if (env.ALLOWED_ORIGIN) {
    return env.ALLOWED_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  }
  return DEFAULT_ALLOWED_ORIGINS
}

// H4: Reject mutations sent to this read-oriented proxy. Matches the `mutation`
// keyword as a GraphQL operation type (word boundary, case-insensitive) so
// legitimate queries that merely mention the word in a string literal aren't
// falsely blocked in edge cases, while blocking actual mutation operations.
const MUTATION_PATTERN = /\bmutation\b/i

// TODO(rate-limiting): This Worker does not implement full request-rate limiting
// itself — Cloudflare Rate Limiting rules (dashboard/wrangler.toml `[[rate_limiting]]`
// or a Rules-based WAF rate limit) should be configured on the
// /api/shopify/admin route to throttle abusive per-IP traffic. The mutation
// rejection below IS implementable in-worker today and is enforced here.

export default {
  async fetch(request: Request, env: { [key: string]: string }): Promise<Response> {
    // CORS handling — allowlist only, never reflect arbitrary Origin headers (H3)
    const allowedOrigins = resolveAllowedOrigins(env)
    const requestOrigin = request.headers.get('Origin')
    const allowOrigin =
      requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedOrigins[0]

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours preflight cache
      'Vary': 'Origin',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    const adminToken = env.SHOPIFY_ADMIN_ACCESS_TOKEN
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Only allow POST to /api/shopify/admin
    const url = new URL(request.url)
    if (url.pathname !== '/api/shopify/admin' || request.method !== 'POST') {
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
    const API_VERSION = '2026-01'
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
  },
}
