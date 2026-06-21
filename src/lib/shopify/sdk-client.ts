// Shopify Storefront API SDK client wrapper
// Uses @shopify/storefront-api-client for all Storefront API calls

import { createStorefrontApiClient } from '@shopify/storefront-api-client'

const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const storefrontToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
const API_VERSION = '2026-01'

const PLACEHOLDER_DOMAINS = new Set(['your-store.myshopify.com', 'CHANGE_ME'])

/**
 * Create the Storefront API client instance.
 * Returns undefined if credentials are not configured (demo mode or tokenless).
 */
function createClient() {
  const hasDomain = !!domain && !PLACEHOLDER_DOMAINS.has(domain)
  const hasToken = !!storefrontToken

  if (!hasDomain || !hasToken) {
    return undefined
  }

  return createStorefrontApiClient({
    storeDomain: domain as string,
    apiVersion: API_VERSION as any,
    publicAccessToken: storefrontToken as string,
  })
}

/** Singleton Storefront API client instance. */
export const storefrontClient = createClient()

/** True when the SDK client is configured (token mode). */
export const IS_SDK_CONFIGURED = storefrontClient !== undefined
