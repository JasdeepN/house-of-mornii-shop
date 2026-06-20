// Tokenless mode validation tests
// These tests verify that tokenless queries exclude token-gated fields

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock tokenless mode
const mockShopifyFetch = vi.fn()

vi.mock('./client', async () => {
  const actual = await vi.importActual('./client')
  return {
    ...(actual as Record<string, unknown>),
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'tokenless' as const,
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

describe('tokenless query validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses TOKENLESS query variants that exclude tags', async () => {
    const { COLLECTION_BY_HANDLE_QUERY_TOKENLESS, PRODUCT_BY_HANDLE_QUERY_TOKENLESS, PRODUCTS_QUERY_TOKENLESS } = await import('./queries')
    
    // Tokenless queries should NOT contain token-gated fields
    expect(COLLECTION_BY_HANDLE_QUERY_TOKENLESS).not.toContain('tags')
    expect(PRODUCT_BY_HANDLE_QUERY_TOKENLESS).not.toContain('tags')
    expect(PRODUCTS_QUERY_TOKENLESS).not.toContain('tags')
  })

  it('token queries DO include tags', async () => {
    const { COLLECTION_BY_HANDLE_QUERY, PRODUCT_BY_HANDLE_QUERY, PRODUCTS_QUERY } = await import('./queries')
    
    // Token queries SHOULD contain tags
    expect(COLLECTION_BY_HANDLE_QUERY).toContain('tags')
    expect(PRODUCT_BY_HANDLE_QUERY).toContain('tags')
    expect(PRODUCTS_QUERY).toContain('tags')
  })

  it('uses tokenless query in useCollection when mode is tokenless', async () => {
    const mockData = {
      collection: {
        id: 'gid://shopify/Collection/123',
        handle: 'everyday',
        title: 'Everyday',
        description: '',
        image: null,
        products: {
          edges: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }

    mockShopifyFetch.mockResolvedValueOnce(mockData)

    const { useCollection } = await import('./hooks')
    const { result } = renderHook(() => useCollection('everyday'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    // Verify the query used was the tokenless variant (no tags)
    const calledQuery = mockShopifyFetch.mock.calls[0][0] as string
    expect(calledQuery).not.toContain('tags')
  })

  it('uses tokenless query in useProduct when mode is tokenless', async () => {
    const mockData = {
      product: {
        id: 'gid://shopify/Product/1',
        handle: 'aria-pendant',
        title: 'Aria Pendant',
        description: '',
        descriptionHtml: '',
        availableForSale: true,
        featuredImage: null,
        images: { edges: [] },
        options: [],
        variants: { edges: [] },
        priceRange: { minVariantPrice: { amount: '89.00', currencyCode: 'CAD' }, maxVariantPrice: { amount: '89.00', currencyCode: 'CAD' } },
        vendor: 'House of Mornii',
      },
    }

    mockShopifyFetch.mockResolvedValueOnce(mockData)

    const { useProduct } = await import('./hooks')
    const { result } = renderHook(() => useProduct('aria-pendant'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    // Verify the query used was the tokenless variant (no tags)
    const calledQuery = mockShopifyFetch.mock.calls[0][0] as string
    expect(calledQuery).not.toContain('tags')
  })
})

describe('token requirements registry', () => {
  it('identifies token-gated fields correctly', async () => {
    const { TOKEN_GATED_FIELDS, hasTokenGatedFields, getRequiredModeForFields } = await import('./token-requirements')
    
    expect(TOKEN_GATED_FIELDS).toHaveLength(4)
    expect(TOKEN_GATED_FIELDS.map(f => f.field)).toEqual(['tags', 'metafields', 'customer', 'customerAccessToken'])
    
    // hasTokenGatedFields should detect token-gated patterns
    expect(hasTokenGatedFields('query { product { tags } }')).toBe(true)
    expect(hasTokenGatedFields('query { product { vendor } }')).toBe(false)
    expect(hasTokenGatedFields('query { product { metafields } }')).toBe(true)
    
    // getRequiredModeForFields should return 'token' when any token-gated field is present
    expect(getRequiredModeForFields(['tags', 'vendor'])).toBe('token')
    expect(getRequiredModeForFields(['vendor', 'title'])).toBe('tokenless')
  })
})
