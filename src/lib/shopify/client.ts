// GraphQL client for Shopify Storefront API (using @shopify/storefront-api-client SDK)
// Admin API calls are proxied through Cloudflare Worker — see src/lib/shopify/admin-proxy.ts

import { logger, type LogContext } from '@/lib/logger'
import { storefrontClient } from './sdk-client'
import { withRetry } from './retry'

const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const storefrontToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
const API_VERSION = '2026-01'

const PLACEHOLDER_DOMAINS = new Set(['your-store.myshopify.com', 'CHANGE_ME'])

// ─── Storefront API helpers (unchanged) ────────────────────────────────────────

/**
 * Explicit storefront auth modes:
 * - 'demo'       No live credentials. App uses fixture data only.
 * - 'token'      Domain + public Storefront token present. Full token-gated fields
 *                (tags, metafields, customer APIs) are available.
 */
export type StorefrontMode = 'demo' | 'token'

function resolveStorefrontMode(): StorefrontMode {
  const hasToken = !!storefrontToken
  
  // Check for placeholder values first (before checking if empty)
  if (domain && PLACEHOLDER_DOMAINS.has(domain)) {
    throw new Error(
      `[House of Mornii] VITE_SHOPIFY_STORE_DOMAIN is still set to placeholder value: ${domain}\n` +
        'Update .env.local with your actual Shopify store domain (e.g., my-store.myshopify.com).',
    )
  }
  
  // Check if domain is missing entirely
  if (!domain) {
    throw new Error(
      '[House of Mornii] VITE_SHOPIFY_STORE_DOMAIN is not set.\n' +
        'Copy .env.example → .env.local and add your Shopify store domain.',
    )
  }
  
  // Tokenless mode removed — require storefront token per Shopify best practices.
  // See: https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api
  if (!hasToken) {
    throw new Error(
      '[House of Mornii] VITE_SHOPIFY_STOREFRONT_TOKEN is not set.\n' +
        'Copy .env.example → .env.local and add your Shopify Storefront API access token.',
    )
  }
  return 'token'
}

export const STOREFRONT_MODE: StorefrontMode = resolveStorefrontMode()

/**
 * True when valid live Shopify credentials are present (token mode).
 * Always true in production — the app throws on startup if credentials are missing.
 */
export const IS_CONFIGURED = STOREFRONT_MODE !== 'demo'

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

/**
 * Execute a GraphQL query/mutation against the Shopify Storefront API.
 * Uses @shopify/storefront-api-client SDK with retry logic.
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

  // Token mode only — SDK handles everything with retry logic
  if (STOREFRONT_MODE === 'token' && storefrontClient) {
    return await shopifyFetchWithSdk<T>(query, variables, context)
  }

  // Should never reach here if STOREFRONT_MODE is correctly resolved
  throw new Error('Unexpected storefront mode')
}

/** Execute query using the Shopify SDK with retry logic. */
async function shopifyFetchWithSdk<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
  context?: LogContext,
): Promise<T> {
  return withRetry(async () => {
    const response = await storefrontClient!.request(query, {
      variables,
    })

    // SDK returns ClientResponse: { data, errors, extensions, headers }
    if (response.errors) {
      const graphqlErrors = response.errors?.graphQLErrors ?? []
      const messages = graphqlErrors.map((e: any) => e.message).join(', ')
      
      const category: StorefrontErrorCategory =
        messages.toLowerCase().includes('not found') ? 'not_found' : 'query_error'

      // Non-retryable GraphQL errors thrown immediately (not caught by withRetry)
      throw new StorefrontError(
        `Shopify GraphQL errors: ${messages || JSON.stringify(response.errors)}`,
        category,
        response.errors?.networkStatusCode,
        context,
      )
    }

    return response.data as T
  })
}

/**
 * Validate that the current query mode matches the storefront mode.
 * In token mode all fields (tags, metafields, customer APIs) are available.
 */
export function validateQueryMode(query: string, mode: StorefrontMode) {
  // Tokenless mode no longer exists — only 'token' or 'demo' modes remain.
  // This function is kept for backward compatibility but always passes in token mode.
  if (mode === 'demo') {
    logger.warn('validateQueryMode called in demo mode', {
      action: 'validateQueryMode',
      mode,
    })
  }
}
