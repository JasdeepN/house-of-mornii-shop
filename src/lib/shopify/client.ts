// Thin GraphQL client for Shopify Storefront API
// No SDK dependency — just fetch against a single POST endpoint

const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN
const API_VERSION = '2026-01'

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
  if (!domain) {
    throw new Error(
      'VITE_SHOPIFY_STORE_DOMAIN is not set. Add it to your .env file.'
    )
  }

  const endpoint = `https://${domain}/api/${API_VERSION}/graphql.json`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Token is optional — Storefront API supports tokenless access for
  // products, collections, cart. Token unlocks metafields, tags, customers.
  if (token) {
    headers['X-Shopify-Storefront-Access-Token'] = token
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText}`
    )
  }

  const json: ShopifyResponse<T> = await response.json()

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join(', ')
    throw new Error(`Shopify GraphQL errors: ${messages}`)
  }

  return json.data
}
