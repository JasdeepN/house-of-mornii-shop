// workers/backup-queries.ts — Paginated Admin API GraphQL queries used by the
// scheduled backup exporter in workers/shopify-proxy.ts.
//
// Each query uses cursor-based pagination (`pageInfo.hasNextPage` /
// `pageInfo.endCursor`) so the caller can page through the full resource set
// regardless of store size. Field selections are intentionally minimal —
// enough for a useful backup/audit snapshot without pulling every possible
// field (keeps payload size and API cost down).

export const API_VERSION = '2026-01'

export type BackupResource = 'products' | 'collections' | 'orders'

export const BACKUP_RESOURCES: BackupResource[] = ['products', 'collections', 'orders']

/** Default page size for each paginated Admin API request. */
export const BACKUP_PAGE_SIZE = 100

export const PRODUCTS_QUERY = /* GraphQL */ `
  query BackupProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        vendor
        productType
        status
        tags
        createdAt
        updatedAt
        variants(first: 50) {
          nodes {
            id
            title
            sku
            price
            inventoryQuantity
          }
        }
      }
    }
  }
`

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query BackupCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        updatedAt
        productsCount {
          count
        }
      }
    }
  }
`

export const ORDERS_QUERY = /* GraphQL */ `
  query BackupOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        createdAt
        updatedAt
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          id
          email
        }
      }
    }
  }
`

export const BACKUP_QUERIES: Record<BackupResource, string> = {
  products: PRODUCTS_QUERY,
  collections: COLLECTIONS_QUERY,
  orders: ORDERS_QUERY,
}

/**
 * Given a GraphQL "connection" response shape (`{ <resource>: { pageInfo, nodes } }`),
 * extract the pagination info and node list generically.
 */
export interface ConnectionPage<TNode> {
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
  nodes: TNode[]
}

/**
 * Page through an Admin API GraphQL connection for a given resource, calling
 * `fetchPage` for each page and accumulating all nodes.
 *
 * @param resource - one of 'products' | 'collections' | 'orders'
 * @param fetchPage - performs a single paginated GraphQL request and returns
 *                    the raw JSON response body.
 */
export async function fetchAllPages<TNode = Record<string, unknown>>(
  resource: BackupResource,
  fetchPage: (query: string, variables: { first: number; after: string | null }) => Promise<{
    data?: Record<string, ConnectionPage<TNode>>
    errors?: unknown
  }>,
  pageSize: number = BACKUP_PAGE_SIZE
): Promise<TNode[]> {
  const query = BACKUP_QUERIES[resource]
  const allNodes: TNode[] = []
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const result = await fetchPage(query, { first: pageSize, after })

    if (result.errors) {
      throw new Error(`Admin API errors while backing up ${resource}: ${JSON.stringify(result.errors)}`)
    }

    const connection = result.data?.[resource]
    if (!connection) {
      throw new Error(`Admin API response missing "${resource}" connection`)
    }

    allNodes.push(...connection.nodes)
    hasNextPage = connection.pageInfo.hasNextPage
    after = connection.pageInfo.endCursor
  }

  return allNodes
}
