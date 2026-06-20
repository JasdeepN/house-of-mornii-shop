// Token mode integration tests for Shopify hooks
// These tests verify that hooks correctly fetch data when STOREFRONT_MODE is 'token'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock token mode — shopifyFetch will be mocked per-test
const mockShopifyFetch = vi.fn()

vi.mock('./client', async () => {
  const actual = await vi.importActual('./client')
  return {
    ...(actual as Record<string, unknown>),
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'token' as const,
    shopifyFetch: mockShopifyFetch,
  }
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useCollections (token mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches collections from Shopify API', async () => {
    const mockData = {
      collections: {
        edges: [
          {
            node: {
              id: 'gid://shopify/Collection/123',
              handle: 'everyday',
              title: 'Everyday',
              description: 'Subtle luxury for daily rituals.',
              image: null,
              products: {
                edges: [{ node: { id: 'gid://shopify/Product/1' } }],
                pageInfo: { hasNextPage: true, endCursor: 'cursor1' },
              },
            },
          },
        ],
      },
    }

    mockShopifyFetch.mockResolvedValueOnce(mockData)

    const { useCollections } = await import('./hooks')
    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].handle).toBe('everyday')
    expect(mockShopifyFetch).toHaveBeenCalledWith(expect.stringContaining('collections'))
  })

  it('returns empty array when no collections exist', async () => {
    mockShopifyFetch.mockResolvedValueOnce({ collections: { edges: [] } })

    const { useCollections } = await import('./hooks')
    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

describe('useProduct (token mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches product by handle', async () => {
    const mockData = {
      product: {
        id: 'gid://shopify/Product/1',
        handle: 'aria-pendant',
        title: 'Aria Pendant',
        description: 'A delicate teardrop pendant.',
        descriptionHtml: '<p>A delicate teardrop pendant.</p>',
        availableForSale: true,
        featuredImage: { url: 'https://example.com/aria.jpg', altText: 'Aria Pendant', width: 800, height: 800 },
        images: { edges: [{ node: { url: 'https://example.com/aria.jpg', altText: 'Aria Pendant', width: 800, height: 800 } }] },
        options: [{ id: 'option1', name: 'Title', values: ['Default Title'] }],
        variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/1', title: 'Default Title', availableForSale: true, price: { amount: '89.00', currencyCode: 'CAD' }, compareAtPrice: null, selectedOptions: [{ name: 'Title', value: 'Default Title' }], image: null } }] },
        priceRange: { minVariantPrice: { amount: '89.00', currencyCode: 'CAD' }, maxVariantPrice: { amount: '89.00', currencyCode: 'CAD' } },
        tags: ['pendant', 'gold'],
        vendor: 'House of Mornii',
      },
    }

    mockShopifyFetch.mockResolvedValueOnce(mockData)

    const { useProduct } = await import('./hooks')
    const { result } = renderHook(() => useProduct('aria-pendant'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.handle).toBe('aria-pendant')
    expect(result.current.data?.title).toBe('Aria Pendant')
  })

  it('returns null for non-existent product', async () => {
    mockShopifyFetch.mockRejectedValueOnce(new Error('GraphQL error: Product cannot be found'))

    const { useProduct } = await import('./hooks')
    const { result } = renderHook(() => useProduct('non-existent-product'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useProducts (token mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches paginated products', async () => {
    const mockData = {
      products: {
        edges: [
          { node: { id: 'gid://shopify/Product/1', handle: 'aria-pendant', title: 'Aria Pendant', description: '', descriptionHtml: '', availableForSale: true, featuredImage: null, images: { edges: [] }, options: [], variants: { edges: [] }, priceRange: { minVariantPrice: { amount: '89.00', currencyCode: 'CAD' }, maxVariantPrice: { amount: '89.00', currencyCode: 'CAD' } }, vendor: 'House of Mornii' }, cursor: 'cursor1' },
          { node: { id: 'gid://shopify/Product/2', handle: 'seren-studs', title: 'Seren Studs', description: '', descriptionHtml: '', availableForSale: true, featuredImage: null, images: { edges: [] }, options: [], variants: { edges: [] }, priceRange: { minVariantPrice: { amount: '59.00', currencyCode: 'CAD' }, maxVariantPrice: { amount: '59.00', currencyCode: 'CAD' } }, vendor: 'House of Mornii' }, cursor: 'cursor2' },
        ],
        pageInfo: { hasNextPage: true, endCursor: 'cursor2' },
      },
    }

    mockShopifyFetch.mockResolvedValueOnce(mockData)

    const { useProducts } = await import('./hooks')
    const { result } = renderHook(() => useProducts('BEST_SELLING', false, undefined, 12), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.edges).toHaveLength(2)
    expect(result.current.data?.pageInfo.hasNextPage).toBe(true)
  })
})
