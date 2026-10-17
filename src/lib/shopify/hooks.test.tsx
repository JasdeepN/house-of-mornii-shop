import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { fixtureCollectionSummaries, fixtureProduct } from '@/test/fixtures/catalog-fixtures'
import { getFixtureCollections, getFixtureProduct, getFixtureProducts } from '@/test/fixtures/shopify-fixtures'
import type { ShopifyProduct } from './types'

const shopifyFetch = vi.fn()

vi.mock('./client', () => ({
  IS_CONFIGURED: true,
  STOREFRONT_MODE: 'token',
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))

// Import after the mock is set up
const { useCollections, useProduct, useProductListing, useRelatedProducts } = await import('./hooks')

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function connection(nodes: ShopifyProduct[], endCursor: string | null, hasNextPage: boolean) {
  return { edges: nodes.map((node) => ({ node, cursor: `c-${node.id}` })), pageInfo: { hasNextPage, endCursor } }
}

const products = getFixtureProducts()
const [p1, p2, p3, p4] = products

beforeEach(() => {
  shopifyFetch.mockReset()
})

describe('useCollections', () => {
  it('maps raw Collections to summaries', async () => {
    shopifyFetch.mockResolvedValue({ collections: { edges: getFixtureCollections().map((node) => ({ node })) } })
    const { result } = renderHook(() => useCollections(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixtureCollectionSummaries())
    expect(result.current.data![0]).not.toHaveProperty('products')
  })
})

describe('useProduct', () => {
  it('maps a Product with Variants', async () => {
    const raw = getFixtureProduct(p1.handle)!
    shopifyFetch.mockResolvedValue({ product: raw })
    const { result } = renderHook(() => useProduct(p1.handle), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fixtureProduct(p1.handle))
    expect(shopifyFetch).toHaveBeenCalledWith(expect.any(String), { handle: p1.handle })
  })

  it('returns null for a missing handle', async () => {
    shopifyFetch.mockResolvedValue({ product: null })
    const { result } = renderHook(() => useProduct('nope'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('does not fetch for an empty handle', () => {
    renderHook(() => useProduct(''), { wrapper: createWrapper() })
    expect(shopifyFetch).not.toHaveBeenCalled()
  })
})

describe('useProductListing', () => {
  it('loads a first page, then appends the next on loadMore using the end cursor', async () => {
    shopifyFetch
      .mockResolvedValueOnce({ products: connection([p1, p2], 'cur-1', true) })
      .mockResolvedValueOnce({ products: connection([p3], 'cur-2', false) })
    const { result } = renderHook(() => useProductListing({ pageSize: 2 }), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.products.map((p) => p.id)).toEqual([p1.id, p2.id])
    expect(result.current.hasMore).toBe(true)
    expect(result.current.collection).toBeNull()
    expect(result.current.notFound).toBe(false)
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ first: 2, sortKey: 'BEST_SELLING', reverse: false, after: undefined })

    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.products).toHaveLength(3))
    expect(shopifyFetch.mock.calls[1][1]).toMatchObject({ after: 'cur-1' })
    expect(result.current.products.map((p) => p.id)).toEqual([p1.id, p2.id, p3.id])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.isLoadingMore).toBe(false)

    act(() => result.current.loadMore())
    expect(shopifyFetch).toHaveBeenCalledTimes(2)
  })

  it('with all: true fetches every page, staying loading until the last arrives', async () => {
    let release: (v: unknown) => void = () => {}
    shopifyFetch
      .mockResolvedValueOnce({ products: connection([p1, p2], 'cur-1', true) })
      .mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    const { result } = renderHook(() => useProductListing({ all: true }), { wrapper: createWrapper() })
    await waitFor(() => expect(shopifyFetch).toHaveBeenCalledTimes(2))
    expect(result.current.isLoading).toBe(true)
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ first: 250 })
    expect(shopifyFetch.mock.calls[1][1]).toMatchObject({ after: 'cur-1' })
    act(() => release({ products: connection([p3], null, false) }))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.products.map((p) => p.id)).toEqual([p1.id, p2.id, p3.id])
    expect(result.current.hasMore).toBe(false)
  })

  it('with all: true honours an explicit pageSize and stops on an error', async () => {
    shopifyFetch
      .mockResolvedValueOnce({ products: connection([p1], 'cur-1', true) })
      .mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useProductListing({ all: true, pageSize: 1 }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ first: 1 })
    expect(shopifyFetch).toHaveBeenCalledTimes(2)
    expect(result.current.isLoading).toBe(false)
  })

  it('drops duplicate ids across pages', async () => {
    shopifyFetch
      .mockResolvedValueOnce({ products: connection([p1, p2], 'cur-1', true) })
      .mockResolvedValueOnce({ products: connection([p2, p4], null, false) })
    const { result } = renderHook(() => useProductListing(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.hasMore).toBe(true))
    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.products).toHaveLength(3))
    expect(result.current.products.map((p) => p.id)).toEqual([p1.id, p2.id, p4.id])
  })

  it('defaults to the recommended sort', async () => {
    shopifyFetch.mockResolvedValue({ products: connection([p1], null, false) })
    const { result } = renderHook(() => useProductListing(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'BEST_SELLING', reverse: false })
  })

  it('sends CREATED_AT reverse for newest across all Products', async () => {
    shopifyFetch.mockResolvedValue({ products: connection([p1], null, false) })
    const { result } = renderHook(() => useProductListing({ sort: 'newest' }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'CREATED_AT', reverse: true })
  })

  it('lists a Collection: sends CREATED reverse for newest and returns the Collection', async () => {
    const [raw] = getFixtureCollections()
    shopifyFetch.mockResolvedValue({ collection: { ...raw, products: connection([p1], null, false) } })
    const { result } = renderHook(() => useProductListing({ collection: raw.handle, sort: 'newest' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ handle: raw.handle, sortKey: 'CREATED', reverse: true })
    expect(result.current.collection).toEqual(fixtureCollectionSummaries()[0])
    expect(result.current.products.map((p) => p.id)).toEqual([p1.id])
    expect(result.current.notFound).toBe(false)
  })

  it('uses COLLECTION_DEFAULT for a Collection with no sort', async () => {
    const [raw] = getFixtureCollections()
    shopifyFetch.mockResolvedValue({ collection: { ...raw, products: connection([p1], null, false) } })
    const { result } = renderHook(() => useProductListing({ collection: raw.handle }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'COLLECTION_DEFAULT', reverse: false })
  })

  it('sends the search query only without a Collection', async () => {
    shopifyFetch.mockResolvedValue({ products: connection([p1], null, false) })
    const all = renderHook(() => useProductListing({ query: 'ring' }), { wrapper: createWrapper() })
    await waitFor(() => expect(all.result.current.isLoading).toBe(false))
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ query: 'ring' })

    shopifyFetch.mockClear()
    const [raw] = getFixtureCollections()
    shopifyFetch.mockResolvedValue({ collection: { ...raw, products: connection([p1], null, false) } })
    const inCollection = renderHook(() => useProductListing({ collection: raw.handle, query: 'ring' }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(inCollection.result.current.isLoading).toBe(false))
    expect(shopifyFetch.mock.calls[0][1]).not.toHaveProperty('query')
  })

  it('reports notFound for a missing Collection', async () => {
    shopifyFetch.mockResolvedValue({ collection: null })
    const { result } = renderHook(() => useProductListing({ collection: 'nope' }), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notFound).toBe(true)
    expect(result.current.collection).toBeNull()
    expect(result.current.products).toEqual([])
    expect(result.current.hasMore).toBe(false)
  })

  it('keeps the products array identity across a rerender with no new data', async () => {
    shopifyFetch.mockResolvedValue({ products: connection([p1, p2], null, false) })
    const { result, rerender } = renderHook(() => useProductListing(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const before = result.current.products
    rerender()
    expect(result.current.products).toBe(before)
  })

  it('fetches nothing when disabled', () => {
    renderHook(() => useProductListing({ enabled: false }), { wrapper: createWrapper() })
    expect(shopifyFetch).not.toHaveBeenCalled()
  })

  it('surfaces a fetch error', async () => {
    shopifyFetch.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useProductListing(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useRelatedProducts', () => {
  it('drops the Product itself and respects the limit', async () => {
    const [raw] = getFixtureCollections()
    const product = { ...fixtureProduct(p1.handle), primaryCollection: { handle: raw.handle, title: raw.title } }
    shopifyFetch.mockResolvedValue({ collection: { ...raw, products: connection([p1, p2, p3, p4], null, false) } })
    const { result } = renderHook(() => useRelatedProducts(product, 2), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.products).toHaveLength(2))
    expect(result.current.products.map((p) => p.id)).toEqual([p2.id, p3.id])
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ handle: raw.handle, first: 6 })
    expect(result.current.isLoading).toBe(false)
  })

  it('makes no call without a primary Collection', () => {
    const product = { ...fixtureProduct(p1.handle), primaryCollection: null }
    const { result } = renderHook(() => useRelatedProducts(product), { wrapper: createWrapper() })
    expect(shopifyFetch).not.toHaveBeenCalled()
    expect(result.current).toEqual({ products: [], isLoading: false })
    renderHook(() => useRelatedProducts(undefined), { wrapper: createWrapper() })
    expect(shopifyFetch).not.toHaveBeenCalled()
  })
})
