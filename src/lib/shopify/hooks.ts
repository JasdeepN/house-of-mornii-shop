// React Query hooks for Shopify data fetching
// Uses Storefront API for all operations (Admin API proxied through Cloudflare Worker).
// Cart operations always use Storefront API.

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch } from './client'
import { adminProxyFetch, ADMIN_PROXY_ENABLED } from './admin-proxy'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
} from './queries'

// Admin API query variants (proxied through Cloudflare Worker for security)
const ADMIN_COLLECTIONS_QUERY = `
  query Collections {
    collections(first: 20) {
      edges {
        node {
          id
          handle
          title
          description
          image { url altText width height }
          products(first: 1) {
            edges { node { id } }
            pageInfo { hasNextPage }
          }
        }
      }
    }
  }
`

const ADMIN_COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image { url altText width height }
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            id
            handle
            title
            description
            availableForSale
            featuredImage { url altText width height }
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            tags
            vendor
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

const ADMIN_PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      edges {
        node {
          id
          handle
          title
          description
          availableForSale
          featuredImage { url altText width height }
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          tags
          vendor
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const ADMIN_PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      availableForSale
      featuredImage { url altText width height }
      images(first: 20) {
        edges { node { url altText width height } }
      }
      options { id name values }
      variants(first: 100) {
        edges { node {
          id
          title
          availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          selectedOptions { name value }
          image { url altText width height }
        }}
      }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      tags
      vendor
      collections(first: 1) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  }
`
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
      // Use Admin API proxy when available (Admin token held server-side in Worker)
      if (ADMIN_PROXY_ENABLED) {
        const data = await adminProxyFetch<{ collections: { edges: { node: ShopifyCollection }[] } }>({
          query: ADMIN_COLLECTIONS_QUERY,
        })
        return data.collections.edges.map((e) => e.node)
      }
      
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
      // Use Admin API proxy when available (Admin token held server-side in Worker)
      if (ADMIN_PROXY_ENABLED) {
        const data = await adminProxyFetch<CollectionByHandleResponse>({
          query: ADMIN_COLLECTION_BY_HANDLE_QUERY,
          variables: { handle, first, sortKey: collectionSortKey, reverse, after: after || undefined },
        })
        return data.collection
      }

      // Token mode only — tokenless removed per Shopify best practices
      const data = await shopifyFetch<CollectionByHandleResponse>(
        COLLECTION_BY_HANDLE_QUERY,
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
      // Use Admin API proxy when available (Admin token held server-side in Worker)
      if (ADMIN_PROXY_ENABLED) {
        const data = await adminProxyFetch<ProductByHandleResponse>({
          query: ADMIN_PRODUCT_BY_HANDLE_QUERY,
          variables: { handle },
        })
        return data.product
      }

      // Token mode only — tokenless removed per Shopify best practices
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
  after?: string,
) {
  return useQuery({
    queryKey: ['products', sortKey, reverse, query, first, after],
    queryFn: async () => {
      // Use Admin API proxy when available (Admin token held server-side in Worker)
      if (ADMIN_PROXY_ENABLED) {
        const data = await adminProxyFetch<ProductsResponse>({
          query: ADMIN_PRODUCTS_QUERY,
          variables: {
            first,
            sortKey,
            reverse,
            query: query || undefined,
            after: after || undefined,
          },
        })
        return data.products
      }

      // Token mode only — tokenless removed per Shopify best practices
      const data = await shopifyFetch<ProductsResponse>(
        PRODUCTS_QUERY,
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
