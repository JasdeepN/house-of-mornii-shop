// React Query hooks for Shopify Storefront API data fetching

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch } from './client'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
} from './queries'
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
      const data = await shopifyFetch<CollectionsResponse>(COLLECTIONS_QUERY)
      return data.collections.edges.map((e) => e.node)
    },
    staleTime: 5 * 60 * 1000, // 5 min — collections rarely change
  })
}

// ─── Single Collection with Products ─────────────────────────────────────────

interface CollectionByHandleResponse {
  collection: ShopifyCollection | null
}

export function useCollection(handle: string, first = 12) {
  return useQuery({
    queryKey: ['collection', handle, first],
    queryFn: async () => {
      const data = await shopifyFetch<CollectionByHandleResponse>(
        COLLECTION_BY_HANDLE_QUERY,
        { handle, first }
      )
      return data.collection
    },
    enabled: !!handle,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Single Product ──────────────────────────────────────────────────────────

interface ProductByHandleResponse {
  product: ShopifyProduct | null
}

export function useProduct(handle: string) {
  return useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      const data = await shopifyFetch<ProductByHandleResponse>(
        PRODUCT_BY_HANDLE_QUERY,
        { handle }
      )
      return data.product
    },
    enabled: !!handle,
    staleTime: 2 * 60 * 1000, // 2 min — product availability changes more often
  })
}
