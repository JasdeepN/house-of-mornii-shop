// Catalog hooks: React Query over the Storefront API, mapped to the Catalog module's domain shapes.

import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { shopifyFetch } from './client'
import {
  shopifySortFor,
  toCollectionSummary,
  toProduct,
  toProductSummary,
  type CollectionSummary,
  type Product,
  type ProductSort,
  type ProductSummary,
} from './catalog'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
} from './queries'
import type { ShopifyCollection, ShopifyProduct } from './types'

const FIVE_MINUTES = 5 * 60 * 1000
const TWO_MINUTES = 2 * 60 * 1000

interface Connection {
  edges: { node: ShopifyProduct }[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}

// ─── Collections ─────────────────────────────────────────────────────────────

export function useCollections(): UseQueryResult<CollectionSummary[], Error> {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const data = await shopifyFetch<{ collections: { edges: { node: ShopifyCollection }[] } }>(COLLECTIONS_QUERY)
      return data.collections.edges.map((e) => toCollectionSummary(e.node))
    },
    staleTime: FIVE_MINUTES,
  })
}

// ─── Single Product ──────────────────────────────────────────────────────────

export function useProduct(handle: string): UseQueryResult<Product | null, Error> {
  return useQuery({
    queryKey: ['product', handle],
    queryFn: async () => {
      const data = await shopifyFetch<{ product: ShopifyProduct | null }>(PRODUCT_BY_HANDLE_QUERY, { handle })
      return data.product ? toProduct(data.product) : null
    },
    enabled: !!handle,
    staleTime: TWO_MINUTES,
  })
}

// ─── Product listings ────────────────────────────────────────────────────────

export interface ProductListingOptions {
  /** A Collection handle; omit (or '') to list every Product. */
  collection?: string
  /** Default 'recommended': best-selling for all Products, the Collection's order for a Collection. */
  sort?: ProductSort
  /** Search text; applies only when `collection` is omitted. */
  query?: string
  /** Products per page; default 12, or 250 (Shopify's maximum) when `all` is true. */
  pageSize?: number
  /**
   * Load the whole listing: keep fetching the next page until there is none. `isLoading` stays true
   * until the last page has arrived and `hasMore` is false once done. Fetching stops on an error.
   */
  all?: boolean
  /** Default true; false fetches nothing. */
  enabled?: boolean
}

export interface ProductListing {
  /** Every page loaded so far, in order, without duplicate ids. The same array until the data changes. */
  products: ProductSummary[]
  /** The Collection being listed, once loaded; null for all Products or when not found. */
  collection: CollectionSummary | null
  /** True when `collection` was given, the first page loaded, and Shopify has no such Collection. */
  notFound: boolean
  /** True while the first page loads. */
  isLoading: boolean
  error: Error | null
  hasMore: boolean
  isLoadingMore: boolean
  /** Loads the next page; does nothing while a page is loading or when there is none. */
  loadMore: () => void
}

interface ListingPage {
  collection: CollectionSummary | null
  products: ProductSummary[]
  hasNextPage: boolean
  endCursor: string | null
}

function toPage(collection: CollectionSummary | null, connection: Connection | null): ListingPage {
  return {
    collection,
    products: connection ? connection.edges.map((e) => toProductSummary(e.node)) : [],
    hasNextPage: connection?.pageInfo.hasNextPage ?? false,
    endCursor: connection?.pageInfo.endCursor ?? null,
  }
}

export function useProductListing(options: ProductListingOptions = {}): ProductListing {
  const { collection, sort = 'recommended', query, all = false, enabled = true } = options
  const pageSize = options.pageSize ?? (all ? 250 : 12)

  const result = useInfiniteQuery({
    queryKey: ['product-listing', collection || null, sort, collection ? null : query || null, pageSize],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }): Promise<ListingPage> => {
      if (collection) {
        const data = await shopifyFetch<{
          collection: (Omit<ShopifyCollection, 'products'> & { products: Connection }) | null
        }>(COLLECTION_BY_HANDLE_QUERY, {
          handle: collection,
          first: pageSize,
          ...shopifySortFor(sort, 'collection'),
          after: pageParam,
        })
        const c = data.collection
        return toPage(c ? toCollectionSummary(c) : null, c ? c.products : null)
      }
      const data = await shopifyFetch<{ products: Connection }>(PRODUCTS_QUERY, {
        first: pageSize,
        ...shopifySortFor(sort, 'products'),
        query: query || undefined,
        after: pageParam,
      })
      return toPage(null, data.products)
    },
    getNextPageParam: (last) => (last.hasNextPage ? (last.endCursor ?? undefined) : undefined),
    staleTime: FIVE_MINUTES,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = result

  const products = useMemo(() => {
    const seen = new Set<string>()
    const all: ProductSummary[] = []
    for (const page of data?.pages ?? []) {
      for (const p of page.products) {
        if (!seen.has(p.id)) {
          seen.add(p.id)
          all.push(p)
        }
      }
    }
    return all
  }, [data])

  const loadingAll = all && enabled && !result.error && (result.isLoading || !!hasNextPage)

  useEffect(() => {
    if (loadingAll && hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [loadingAll, hasNextPage, isFetchingNextPage, fetchNextPage])

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const firstPage = data?.pages[0]
  return {
    products,
    collection: firstPage?.collection ?? null,
    notFound: !!collection && !!firstPage && firstPage.collection === null,
    isLoading: result.isLoading || loadingAll,
    error: result.error,
    hasMore: !!hasNextPage,
    isLoadingMore: isFetchingNextPage,
    loadMore,
  }
}

// ─── Related Products ────────────────────────────────────────────────────────

export function useRelatedProducts(
  product: Product | null | undefined,
  limit = 4,
): { products: ProductSummary[]; isLoading: boolean } {
  const listing = useProductListing({
    collection: product?.primaryCollection?.handle,
    pageSize: limit + 4,
    enabled: !!product?.primaryCollection,
  })
  const products = useMemo(
    () => listing.products.filter((p) => p.id !== product?.id).slice(0, limit),
    [listing.products, product?.id, limit],
  )
  return { products, isLoading: listing.isLoading }
}
