// Thin GraphQL client for Shopify Storefront API
// No SDK dependency — just fetch against a single POST endpoint

import { logger, type LogContext } from '@/lib/logger'

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
 * - 'network_error'        Unhandled network failure (fetch rejected, DNS error, etc.).
 */
export type StorefrontErrorCategory =
  | 'not_found'
  | 'misconfigured'
  | 'upstream_unavailable'
  | 'query_error'
  | 'network_error'

export class StorefrontError extends Error {
  readonly category: StorefrontErrorCategory
  readonly statusCode?: number
  readonly timestamp: Date
  readonly context?: LogContext

  constructor(
    message: string,
    category: StorefrontErrorCategory,
    statusCode?: number,
    context?: LogContext,
  ) {
    super(message)
    this.name = 'StorefrontError'
    this.category = category
    this.statusCode = statusCode
    this.timestamp = new Date()
    this.context = context
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
  variables: Record<string, unknown> = {},
  context?: LogContext,
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

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })
  } catch (error) {
    // Network error: fetch() rejects on DNS failure, connection refused, etc.
    const networkError = new StorefrontError(
      'Network request to Shopify API failed',
      'network_error',
      undefined,
      context,
    )
    logger.error('Shopify API network error', {
      ...context,
      action: 'shopifyFetch',
      endpoint,
    })
    throw networkError
  }

  if (!response.ok) {
    let category: StorefrontErrorCategory
    if (response.status === 404) category = 'not_found'
    else if (response.status === 401 || response.status === 403) category = 'misconfigured'
    else category = 'upstream_unavailable'

    const error = new StorefrontError(
      `Shopify API error: ${response.status} ${response.statusText}`,
      category,
      response.status,
      context,
    )
    logger.error('Shopify API HTTP error', {
      ...context,
      action: 'shopifyFetch',
      category,
      statusCode: response.status,
    })
    throw error
  }

  const json: ShopifyResponse<T> = await response.json()

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join(', ')
    const first = json.errors[0]
    const code = first.extensions?.code as string | undefined
    const category =
      code === 'NOT_FOUND' ? 'not_found' : 'query_error'

    const error = new StorefrontError(
      `Shopify GraphQL errors: ${messages}`,
      category,
      undefined,
      context,
    )
    logger.error('Shopify GraphQL error', {
      ...context,
      action: 'shopifyFetch',
      category,
      graphqlErrors: messages,
    })
    throw error
  }

  return json.data
}

/**
 * Validate that the current query mode matches the storefront mode
 * Logs warnings for potential token-gated field mismatches
 * In dev/staging mode, throws an error to prevent silent failures
 */
export function validateQueryMode(query: string, mode: StorefrontMode) {
  const tokenGatedPatterns = ['tags', 'metafields', 'customerAccessToken']
  const hasTokenGated = tokenGatedPatterns.some(pattern => query.includes(pattern))

  if (hasTokenGated && mode === 'tokenless') {
    const matchedFields = tokenGatedPatterns.filter(p => query.includes(p))
    
    logger.warn('Token-gated field requested in tokenless mode', {
      action: 'validateQueryMode',
      fields: matchedFields,
      mode,
    })

    // In dev/staging, throw to prevent silent GraphQL errors
    if (import.meta.env.DEV ||
        typeof window !== 'undefined' && (
          window.location.hostname.includes('staging') ||
          window.location.hostname.includes('preview') ||
          window.location.hostname.includes('test')
        )) {
      throw new StorefrontError(
        `Token-gated fields (${matchedFields.join(', ')}) requested in tokenless mode. ` +
        `Set VITE_SHOPIFY_STOREFRONT_TOKEN to enable token mode.`,
        'query_error',
        undefined,
        { action: 'validateQueryMode' },
      )
    }
  }
}
