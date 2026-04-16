// React Query hooks for Shopify Storefront API data fetching
// Falls back to demo data when Shopify credentials are not configured.

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch, IS_CONFIGURED, STOREFRONT_MODE } from './client'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTION_BY_HANDLE_QUERY_TOKENLESS,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY_TOKENLESS,
  PRODUCTS_QUERY,
  PRODUCTS_QUERY_TOKENLESS,
} from './queries'
import {
  getDemoCollections,
  getDemoCollection,
  getDemoProduct,
  getDemoProducts,
} from './demo-data'
import type { ShopifyCollection, ShopifyProduct } from './types'

// ─── Collections ─────────────────────────────────────────────────────────────

interface CollectionsResponse {
  collections: {
    edges: { node: ShopifyCollection }[]
  }
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      if (!IS_CONFIGURED) return getDemoCollections()
      const data = await shopifyFetch<CollectionsResponse>(COLLECTIONS_QUERY)
      return data.collections.edges.map((e) => e.node)
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Single Collection with Products ─────────────────────────────────────────

interface CollectionByHandleResponse {
  collection: ShopifyCollection | null
}

// Map ProductSortKeys → ProductCollectionSortKeys where they differ
const COLLECTION_SORT_KEY_MAP: Record<string, string> = {
  CREATED_AT: 'CREATED',
}

export function useCollection(handle: string, first = 12, sortKey?: string, reverse = false, after?: string) {
  // Translate sort keys that differ between Product and ProductCollection enums
  const collectionSortKey = sortKey
    ? COLLECTION_SORT_KEY_MAP[sortKey] ?? sortKey
    : undefined

  return useQuery({
    queryKey: ['collection', handle, first, collectionSortKey, reverse, after],
    queryFn: async () => {
      if (!IS_CONFIGURED) {
        const col = getDemoCollection(handle)
        if (!col) return null
        // Respect sortKey for demo data
        if (collectionSortKey === 'PRICE') {
          col.products.edges.sort(
            (a, b) =>
              parseFloat(a.node.priceRange.minVariantPrice.amount) -
              parseFloat(b.node.priceRange.minVariantPrice.amount),
          )
        } else if (collectionSortKey === 'TITLE') {
          col.products.edges.sort((a, b) =>
            a.node.title.localeCompare(b.node.title),
          )
        }
        if (reverse) col.products.edges.reverse()
        return col
      }
      const data = await shopifyFetch<CollectionByHandleResponse>(
        STOREFRONT_MODE === 'token' ? COLLECTION_BY_HANDLE_QUERY : COLLECTION_BY_HANDLE_QUERY_TOKENLESS,
        { handle, first, sortKey: collectionSortKey, reverse, after: after || undefined },
      )
      return data.collection
    },
    enabled: !!handle,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Single Product ──────────────────────────────────────────────────────────

interface ProductByHandleResponse {
  product:
    | (ShopifyProduct & {
        collections?: { edges: { node: { handle: string; title: string } }[] }
      })
    | null
}

export function useProduct(handle: string) {
  return useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      if (!IS_CONFIGURED) {
        const p = getDemoProduct(handle)
        if (!p) return null
        // Attach first matching collection for related-products lookup
        const cols = getDemoCollections()
        const match = cols.find((c) =>
          c.products.edges.some((e) => e.node.handle === handle),
        )
        return {
          ...p,
          collections: match
            ? { edges: [{ node: { handle: match.handle, title: match.title } }] }
            : undefined,
        }
      }
      const data = await shopifyFetch<ProductByHandleResponse>(
        STOREFRONT_MODE === 'token' ? PRODUCT_BY_HANDLE_QUERY : PRODUCT_BY_HANDLE_QUERY_TOKENLESS,
        { handle },
      )
      return data.product
    },
    enabled: !!handle,
    staleTime: 2 * 60 * 1000,
  })
}

// ─── All Products (for /shop page) ──────────────────────────────────────────

interface ProductsResponse {
  products: {
    edges: { node: ShopifyProduct; cursor: string }[]
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

export function useProducts(
  sortKey = 'BEST_SELLING',
  reverse = false,
  query?: string,
  first = 12,
  after?: string,
) {
  return useQuery({
    queryKey: ['products', sortKey, reverse, query, first, after],
    queryFn: async () => {
      if (!IS_CONFIGURED) {
        let items = getDemoProducts()
        // Basic sorting
        if (sortKey === 'PRICE') {
          items = [...items].sort(
            (a, b) =>
              parseFloat(a.priceRange.minVariantPrice.amount) -
              parseFloat(b.priceRange.minVariantPrice.amount),
          )
        } else if (sortKey === 'TITLE') {
          items = [...items].sort((a, b) => a.title.localeCompare(b.title))
        }
        if (reverse) items = [...items].reverse()
        if (query) {
          const q = query.toLowerCase()
          items = items.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.tags?.some((t) => t.toLowerCase().includes(q)),
          )
        }
        // Simulate cursor-based pagination for demo data
        let startIdx = 0
        if (after) {
          const afterId = atob(after)
          const idx = items.findIndex((p) => p.id === afterId)
          if (idx >= 0) startIdx = idx + 1
        }
        const page = items.slice(startIdx, startIdx + first)
        return {
          edges: page.map((p) => ({ node: p, cursor: btoa(p.id) })),
          pageInfo: { hasNextPage: startIdx + first < items.length, endCursor: page.length > 0 ? btoa(page[page.length - 1].id) : null },
        }
      }
      const data = await shopifyFetch<ProductsResponse>(
        STOREFRONT_MODE === 'token' ? PRODUCTS_QUERY : PRODUCTS_QUERY_TOKENLESS,
        {
          first,
          sortKey,
          reverse,
          query: query || undefined,
          after: after || undefined,
        },
      )
      return data.products
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Related Products ────────────────────────────────────────────────────────

export function useRelatedProducts(
  collectionHandle: string | undefined,
  excludeProductId?: string,
) {
  const { data: collection } = useCollection(collectionHandle ?? '', 8)

  const products = collection
    ? collection.products.edges
        .map((e) => e.node)
        .filter((p) => p.id !== excludeProductId)
        .slice(0, 4)
    : []

  return {
    products,
    isLoading: !collection && !!collectionHandle,
  }
}
