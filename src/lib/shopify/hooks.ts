// React Query hooks for Shopify Storefront API data fetching
// Falls back to demo data when Shopify credentials are not configured.

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch, IS_CONFIGURED } from './client'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
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

export function useCollection(handle: string, first = 12, sortKey?: string) {
  return useQuery({
    queryKey: ['collection', handle, first, sortKey],
    queryFn: async () => {
      if (!IS_CONFIGURED) {
        const col = getDemoCollection(handle)
        if (!col) return null
        // Respect sortKey for demo data
        if (sortKey === 'PRICE') {
          col.products.edges.sort(
            (a, b) =>
              parseFloat(a.node.priceRange.minVariantPrice.amount) -
              parseFloat(b.node.priceRange.minVariantPrice.amount),
          )
        } else if (sortKey === 'TITLE') {
          col.products.edges.sort((a, b) =>
            a.node.title.localeCompare(b.node.title),
          )
        }
        return col
      }
      const data = await shopifyFetch<CollectionByHandleResponse>(
        COLLECTION_BY_HANDLE_QUERY,
        { handle, first, sortKey },
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
        PRODUCT_BY_HANDLE_QUERY,
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
) {
  return useQuery({
    queryKey: ['products', sortKey, reverse, query, first],
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
              p.tags.some((t) => t.toLowerCase().includes(q)),
          )
        }
        return {
          edges: items.slice(0, first).map((p) => ({ node: p, cursor: btoa(p.id) })),
          pageInfo: { hasNextPage: items.length > first, endCursor: null },
        }
      }
      const data = await shopifyFetch<ProductsResponse>(PRODUCTS_QUERY, {
        first,
        sortKey,
        reverse,
        query: query || undefined,
      })
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
