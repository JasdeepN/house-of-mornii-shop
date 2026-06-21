// src/lib/shopify/admin-proxy.ts — Browser client for Admin API via Cloudflare Worker proxy
//
// This module executes GraphQL queries against the Shopify Admin API through a
// secure Cloudflare Worker proxy. The Admin token is held server-side in the
// Worker and never exposed to the browser.
//
// Per Shopify best practices:
// https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api
// "Use the Storefront API for all client-side operations. The Admin API should
// never be called from the browser."

import { logger, type LogContext } from '@/lib/logger'

export interface AdminFetchOptions {
  query: string
  variables?: Record<string, unknown>
  context?: LogContext
}

/**
 * Execute a GraphQL query/mutation against the Shopify Admin API via Cloudflare Worker proxy.
 * The Admin token is held server-side in the Worker — never exposed to the browser.
 */
export async function adminProxyFetch<T = unknown>(options: AdminFetchOptions): Promise<T> {
  const { query, variables = {}, context } = options

  const endpoint = '/api/shopify/admin'

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch (error) {
    logger.error('Admin proxy network error', {
      ...context,
      action: 'adminProxyFetch',
      endpoint,
    })
    throw new Error('Network request to Admin API proxy failed')
  }

  if (!response.ok) {
    let category: string
    if (response.status === 404) category = 'not_found'
    else if (response.status === 401 || response.status === 403) category = 'unauthorized'
    else if (response.status >= 500) category = 'upstream_unavailable'
    else category = 'proxy_error'

    logger.error('Admin proxy HTTP error', {
      ...context,
      action: 'adminProxyFetch',
      category,
      statusCode: response.status,
    })

    throw new Error(`Admin API proxy error: ${response.status} ${response.statusText}`)
  }

  const json: { data: T; errors?: { message: string; extensions?: Record<string, unknown> }[] } =
    await response.json()

  if (json.errors?.length) {
    const messages = json.errors.map((e) => e.message).join(', ')
    const code = json.errors[0]?.extensions?.code as string | undefined
    const category = code === 'NOT_FOUND' ? 'not_found' : 'query_error'

    logger.error('Admin proxy GraphQL error', {
      ...context,
      action: 'adminProxyFetch',
      category,
      graphqlErrors: messages,
    })

    throw new Error(`Admin API GraphQL errors: ${messages}`)
  }

  return json.data
}

/** True when the Admin API proxy endpoint is reachable (dev or prod). */
export const HAS_ADMIN_PROXY = true // Always true — proxy endpoint exists in all environments
