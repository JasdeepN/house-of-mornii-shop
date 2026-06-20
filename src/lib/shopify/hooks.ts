// React Query hooks for Shopify data fetching
// Uses Admin API for products/collections when available, falls back to Storefront API.
// Cart operations always use Storefront API (not available in Admin API).
// Falls back to demo data when no credentials are configured.

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch, IS_CONFIGURED, STOREFRONT_MODE, HAS_ADMIN_CREDENTIALS, adminFetch } from './client'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTION_BY_HANDLE_QUERY_TOKENLESS,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY_TOKENLESS,
  PRODUCTS_QUERY,
  PRODUCTS_QUERY_TOKENLESS,
} from './queries'

// Admin API query variants (share same field structure for products/collections)
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
      
      // Use Admin API when available (simpler auth with single token)
      if (HAS_ADMIN_CREDENTIALS) {
        const data = await adminFetch<{ collections: { edges: { node: ShopifyCollection }[] } }>({
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
      if (!IS_CONFIGURED) {
        const col = getDemoCollection(handle)
        if (!col) return null
        const demoCollection = {
          ...col,
          products: {
            ...col.products,
            edges: [...col.products.edges],
          },
        }
        // Respect sortKey for demo data
        if (collectionSortKey === 'PRICE') {
          demoCollection.products.edges.sort(
            (a, b) =>
              parseFloat(a.node.priceRange.minVariantPrice.amount) -
              parseFloat(b.node.priceRange.minVariantPrice.amount),
          )
        } else if (collectionSortKey === 'TITLE') {
          demoCollection.products.edges.sort((a, b) =>
            a.node.title.localeCompare(b.node.title),
          )
        }
        if (reverse) demoCollection.products.edges.reverse()
        return demoCollection
      }

      // Use Admin API when available (simpler auth with single token)
      if (HAS_ADMIN_CREDENTIALS) {
        const data = await adminFetch<CollectionByHandleResponse>({
          query: ADMIN_COLLECTION_BY_HANDLE_QUERY,
          variables: { handle, first, sortKey: collectionSortKey, reverse, after: after || undefined },
        })
        return data.collection
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

      // Use Admin API when available (simpler auth with single token)
      if (HAS_ADMIN_CREDENTIALS) {
        const data = await adminFetch<ProductByHandleResponse>({
          query: ADMIN_PRODUCT_BY_HANDLE_QUERY,
          variables: { handle },
        })
        return data.product
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

      // Use Admin API when available (simpler auth with single token)
      if (HAS_ADMIN_CREDENTIALS) {
        const data = await adminFetch<ProductsResponse>({
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
