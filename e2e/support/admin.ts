import { requireDevTarget, requireEnv } from './env'

const API_VERSION = '2026-01'
let cached: { token: string; expiresAt: number } | null = null

async function accessToken(domain: string): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: requireEnv('E2E_SHOPIFY_CLIENT_ID'),
      client_secret: requireEnv('E2E_SHOPIFY_CLIENT_SECRET'),
    }),
  })
  if (!res.ok) throw new Error(`Admin token request failed: HTTP ${res.status}`)
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new Error('Admin token response had no access_token')
  cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 }
  return cached.token
}

/** Admin GraphQL with a cached client-credentials token. Throws on GraphQL errors. */
export async function adminGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  requireDevTarget()
  const domain = requireEnv('E2E_SHOPIFY_STORE_DOMAIN')
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': await accessToken(domain),
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Admin GraphQL failed: HTTP ${res.status}`)
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) throw new Error(`Admin GraphQL errors: ${JSON.stringify(json.errors)}`)
  return json.data as T
}
