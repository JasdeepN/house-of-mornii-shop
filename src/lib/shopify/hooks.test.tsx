import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  getFixtureCollections,
  getFixtureCollection,
  getFixtureProduct,
  getFixtureProducts,
} from '@/test/fixtures/shopify-fixtures'

const shopifyFetch = vi.fn()

// Token mode — shopifyFetch is mocked to return fixture-shaped responses.
vi.mock('./client', () => ({
  IS_CONFIGURED: true,
  STOREFRONT_MODE: 'token',
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))

vi.mock('./admin-proxy', () => ({
  adminProxyFetch: vi.fn(),
  ADMIN_PROXY_ENABLED: false,
}))

// Must import AFTER mock setup
const { useCollections, useCollection, useProduct, useProducts, useRelatedProducts } = await import('./hooks')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

beforeEach(() => {
  shopifyFetch.mockReset()
})

describe('useCollections', () => {
  it('returns 3 fixture collections', async () => {
    shopifyFetch.mockResolvedValueOnce({
      collections: { edges: getFixtureCollections().map((c) => ({ node: c })) },
    })

    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
    expect(result.current.data![0].handle).toBe('everyday')
  })
})

describe('useCollection', () => {
  it('returns collection by handle', async () => {
    shopifyFetch.mockResolvedValueOnce({ collection: getFixtureCollection('festive') })

    const { result } = renderHook(() => useCollection('festive'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.title).toBe('Festive')
    expect(result.current.data!.products.edges.length).toBeGreaterThan(0)
  })

  it('returns null for unknown handle', async () => {
    shopifyFetch.mockResolvedValueOnce({ collection: null })

    const { result } = renderHook(() => useCollection('unknown'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('passes PRICE sortKey through to shopifyFetch', async () => {
    const collection = getFixtureCollection('everyday')!
    shopifyFetch.mockResolvedValueOnce({ collection })

    const { result } = renderHook(
      () => useCollection('everyday', 12, 'PRICE'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(shopifyFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ handle: 'everyday', sortKey: 'PRICE' }),
    )
  })

  it('passes TITLE sortKey through to shopifyFetch', async () => {
    const collection = getFixtureCollection('everyday')!
    shopifyFetch.mockResolvedValueOnce({ collection })

    const { result } = renderHook(
      () => useCollection('everyday', 12, 'TITLE'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(shopifyFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ handle: 'everyday', sortKey: 'TITLE' }),
    )
  })
})

describe('useProduct', () => {
  it('returns product by handle', async () => {
    shopifyFetch.mockResolvedValueOnce({ product: getFixtureProduct('aria-pendant') })

    const { result } = renderHook(() => useProduct('aria-pendant'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const product = result.current.data!
    expect(product.title).toBe('Aria Pendant')
  })

  it('returns null for unknown handle', async () => {
    shopifyFetch.mockResolvedValueOnce({ product: null })

    const { result } = renderHook(() => useProduct('nonexistent'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})

describe('useProducts', () => {
  it('returns all fixture products', async () => {
    const products = getFixtureProducts()
    shopifyFetch.mockResolvedValueOnce({
      products: {
        edges: products.map((p) => ({ node: p, cursor: btoa(p.id) })),
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    })

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.edges).toHaveLength(products.length)
  })

  it('passes query filter through to shopifyFetch', async () => {
    shopifyFetch.mockResolvedValueOnce({
      products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
    })

    renderHook(
      () => useProducts('BEST_SELLING', false, 'pendant'),
      { wrapper: createWrapper() },
    )

    await waitFor(() =>
      expect(shopifyFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ query: 'pendant' }),
      ),
    )
  })

  it('passes first limit through to shopifyFetch', async () => {
    shopifyFetch.mockResolvedValueOnce({
      products: { edges: [], pageInfo: { hasNextPage: true, endCursor: null } },
    })

    const { result } = renderHook(
      () => useProducts('BEST_SELLING', false, undefined, 4),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(shopifyFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ first: 4 }),
    )
  })
})

describe('useRelatedProducts', () => {
  it('returns products from same collection excluding current', async () => {
    const collection = getFixtureCollection('everyday')!
    const product = getFixtureProduct('aria-pendant')!

    shopifyFetch.mockImplementation((query: string) => {
      if (query.includes('ProductByHandle') || query.includes('product(')) {
        return Promise.resolve({ product })
      }
      return Promise.resolve({ collection })
    })

    const { result } = renderHook(
      () => {
        const productResult = useProduct('aria-pendant')
        const related = useRelatedProducts('everyday', productResult.data?.id)
        return { product: productResult, related }
      },
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.related.products.length).toBeGreaterThan(0))
    const relatedHandles = result.current.related.products.map((p) => p.handle)
    expect(relatedHandles).not.toContain('aria-pendant')
  })
})
