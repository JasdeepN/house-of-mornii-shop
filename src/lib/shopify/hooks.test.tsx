import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Always force demo mode for hook tests
vi.mock('./client', () => ({
  IS_CONFIGURED: false,
  shopifyFetch: vi.fn(() => {
    throw new Error('shopifyFetch should not be called in demo mode')
  }),
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

describe('useCollections (demo mode)', () => {
  it('returns 3 demo collections', async () => {
    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
    expect(result.current.data![0].handle).toBe('everyday')
  })
})

describe('useCollection (demo mode)', () => {
  it('returns collection by handle', async () => {
    const { result } = renderHook(() => useCollection('festive'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.title).toBe('Festive')
    expect(result.current.data!.products.edges.length).toBeGreaterThan(0)
  })

  it('returns null for unknown handle', async () => {
    const { result } = renderHook(() => useCollection('unknown'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('sorts by PRICE when sortKey is PRICE', async () => {
    const { result } = renderHook(
      () => useCollection('everyday', 12, 'PRICE'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const prices = result.current.data!.products.edges.map((e) =>
      parseFloat(e.node.priceRange.minVariantPrice.amount),
    )
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  it('sorts by TITLE when sortKey is TITLE', async () => {
    const { result } = renderHook(
      () => useCollection('everyday', 12, 'TITLE'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const titles = result.current.data!.products.edges.map((e) => e.node.title)
    const sorted = [...titles].sort()
    expect(titles).toEqual(sorted)
  })

  it('does not mutate shared demo collection ordering when sorted', async () => {
    const { getDemoCollection } = await import('./demo-data')
    const originalOrder = getDemoCollection('everyday')!.products.edges.map((e) => e.node.handle)

    const { result: sortedResult } = renderHook(
      () => useCollection('everyday', 12, 'TITLE', true),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(sortedResult.current.isSuccess).toBe(true))

    expect(getDemoCollection('everyday')!.products.edges.map((e) => e.node.handle)).toEqual(originalOrder)

    const { result: unsortedResult } = renderHook(
      () => useCollection('everyday'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(unsortedResult.current.isSuccess).toBe(true))
    expect(unsortedResult.current.data!.products.edges.map((e) => e.node.handle)).toEqual(originalOrder)
  })
})

describe('useProduct (demo mode)', () => {
  it('returns product by handle with collection info', async () => {
    const { result } = renderHook(() => useProduct('aria-pendant'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const product = result.current.data!
    expect(product.title).toBe('Aria Pendant')
    expect(product.collections?.edges[0].node.handle).toBe('everyday')
  })

  it('returns null for unknown handle', async () => {
    const { result } = renderHook(() => useProduct('nonexistent'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})

describe('useProducts (demo mode)', () => {
  it('returns all 12 demo products', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.edges).toHaveLength(12)
  })

  it('filters by query string', async () => {
    const { result } = renderHook(
      () => useProducts('BEST_SELLING', false, 'pendant'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const products = result.current.data!.edges.map((e) => e.node)
    expect(products.length).toBeGreaterThan(0)
    for (const p of products) {
      expect(
        p.title.toLowerCase().includes('pendant') ||
          p.tags.some((t) => t.toLowerCase().includes('pendant')),
      ).toBe(true)
    }
  })

  it('sorts by PRICE', async () => {
    const { result } = renderHook(() => useProducts('PRICE'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const prices = result.current.data!.edges.map((e) =>
      parseFloat(e.node.priceRange.minVariantPrice.amount),
    )
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  it('respects reverse flag', async () => {
    const { result } = renderHook(() => useProducts('PRICE', true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const prices = result.current.data!.edges.map((e) =>
      parseFloat(e.node.priceRange.minVariantPrice.amount),
    )
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1])
    }
  })

  it('respects first limit', async () => {
    const { result } = renderHook(
      () => useProducts('BEST_SELLING', false, undefined, 4),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.edges).toHaveLength(4)
    expect(result.current.data!.pageInfo.hasNextPage).toBe(true)
  })
})

describe('useRelatedProducts (demo mode)', () => {
  it('returns products from same collection excluding current', async () => {
    const { result } = renderHook(
      () => {
        const product = useProduct('aria-pendant')
        const related = useRelatedProducts('everyday', product.data?.id)
        return { product, related }
      },
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.related.products.length).toBeGreaterThan(0))
    const relatedHandles = result.current.related.products.map((p) => p.handle)
    expect(relatedHandles).not.toContain('aria-pendant')
  })
})
