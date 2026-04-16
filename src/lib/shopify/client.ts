// Thin GraphQL client for Shopify Storefront API
// No SDK dependency — just fetch against a single POST endpoint

const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
const API_VERSION = '2026-01'

const PLACEHOLDER_DOMAINS = new Set(['your-store.myshopify.com', 'CHANGE_ME'])

/**
 * Explicit storefront auth modes:
 * - 'demo'       No live credentials. App uses fixture data only.
 * - 'tokenless'  Domain present but no Storefront token. Only tokenless-safe
 *                Storefront API fields may be requested (no tags, metafields, etc.).
 * - 'token'      Domain + public Storefront token present. Full token-gated fields
 *                (tags, metafields, customer APIs) are available.
 */
export type StorefrontMode = 'demo' | 'tokenless' | 'token'

function resolveStorefrontMode(): StorefrontMode {
  const hasDomain = !!domain && !PLACEHOLDER_DOMAINS.has(domain)
  const hasToken = !!token
  if (!hasDomain) return 'demo'
  if (!hasToken) return 'tokenless'
  return 'token'
}

export const STOREFRONT_MODE: StorefrontMode = resolveStorefrontMode()

/**
 * True when valid live Shopify credentials are present (tokenless or token mode).
 * When false the app falls back to demo data automatically.
 * @deprecated Prefer checking STOREFRONT_MODE directly for mode-specific logic.
 */
export const IS_CONFIGURED = STOREFRONT_MODE !== 'demo'

if (STOREFRONT_MODE === 'demo' && import.meta.env.DEV) {
  console.warn(
    '[House of Mornii] Shopify credentials not configured — running in demo mode.\n' +
      'Copy .env.example → .env.local and add your store domain + token.',
  )
}

if (STOREFRONT_MODE === 'tokenless' && import.meta.env.DEV) {
  console.warn(
    '[House of Mornii] Running in tokenless Storefront mode: only essential fields are available.\n' +
      'Set VITE_SHOPIFY_STOREFRONT_TOKEN to unlock tags, metafields, and customer APIs.',
  )
}

/**
 * Categories of Storefront errors for page-level error handling.
 * - 'not_found'            Resource does not exist (404 or confirmed null).
 * - 'misconfigured'        Credentials present but invalid (401/403).
 * - 'upstream_unavailable' Shopify service error (5xx) or network failure.
 * - 'query_error'          GraphQL-level error (malformed query, permission, etc.).
 */
export type StorefrontErrorCategory =
  | 'not_found'
  | 'misconfigured'
  | 'upstream_unavailable'
  | 'query_error'

export class StorefrontError extends Error {
  readonly category: StorefrontErrorCategory
  readonly statusCode?: number

  constructor(
    message: string,
    category: StorefrontErrorCategory,
    statusCode?: number,
  ) {
    super(message)
    this.name = 'StorefrontError'
    this.category = category
    this.statusCode = statusCode
  }
}

interface ShopifyResponse<T> {
  data: T
  errors?: { message: string; extensions?: Record<string, unknown> }[]
}

/**
 * Execute a GraphQL query/mutation against the Shopify Storefront API.
 * Throws on network errors or GraphQL-level errors.
 */
export async function shopifyFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (STOREFRONT_MODE === 'demo') {
    throw new Error(
      'Shopify is not configured. The app should be using demo data — this call should not happen.',
    )
  }

  const endpoint = `https://${domain}/api/${API_VERSION}/graphql.json`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (STOREFRONT_MODE === 'token') {
    headers['X-Shopify-Storefront-Access-Token'] = token as string
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    let category: StorefrontErrorCategory
    if (response.status === 404) category = 'not_found'
    else if (response.status === 401 || response.status === 403) category = 'misconfigured'
    else category = 'upstream_unavailable'
    throw new StorefrontError(
      `Shopify API error: ${response.status} ${response.statusText}`,
      category,
      response.status,
    )
  }

  const json: ShopifyResponse<T> = await response.json()

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join(', ')
    const first = json.errors[0]
    const code = first.extensions?.code as string | undefined
    const category =
      code === 'NOT_FOUND' ? 'not_found' : 'query_error'
    throw new StorefrontError(`Shopify GraphQL errors: ${messages}`, category)
  }

  return json.data
}
