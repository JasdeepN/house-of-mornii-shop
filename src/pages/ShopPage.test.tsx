import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { getFixtureCollection, getFixtureCollections, getFixtureProducts } from '@/test/fixtures/shopify-fixtures'
import { ShopPage } from './ShopPage'

const trackViewItemList = vi.fn()
const shopifyFetch = vi.fn()

vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}))

vi.mock('@/lib/analytics', () => ({
  trackViewItemList: (...args: unknown[]) => trackViewItemList(...args),
}))

vi.mock('@/lib/shopify/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shopify/client')>('@/lib/shopify/client')
  return {
    ...actual,
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'token',
    shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
  }
})

const products = getFixtureProducts()
const edges = (list: typeof products) => list.map((node) => ({ node, cursor: `cursor-${node.handle}` }))

function productsPage(list: typeof products, endCursor: string | null = null) {
  return { products: { edges: edges(list), pageInfo: { hasNextPage: endCursor !== null, endCursor } } }
}

function productsCalls() {
  return shopifyFetch.mock.calls.filter(([query]) => String(query).includes('query Products'))
}

describe('ShopPage', () => {
  beforeEach(() => {
    trackViewItemList.mockReset()
    shopifyFetch.mockReset()
    shopifyFetch.mockImplementation(async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('query Collections')) {
        return { collections: { edges: getFixtureCollections().map((node) => ({ node })) } }
      }
      if (query.includes('query CollectionByHandle')) {
        return { collection: getFixtureCollection(String(variables?.handle)) }
      }
      if (query.includes('query Products')) return productsPage(products.slice(0, 2))
      throw new Error(`Unexpected query: ${query}`)
    })
  })

  it('renders Products and the Collection chips', async () => {
    renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] })

    expect(await screen.findByText(products[0].title)).toBeInTheDocument()
    expect(screen.getByText(products[1].title)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Everyday' })).toBeInTheDocument()
    expect(screen.getByText(/Sort: Best Selling/)).toBeInTheDocument()
  })

  it('sends the sort from ?sort=price-desc', async () => {
    renderWithProviders(<ShopPage />, { initialEntries: ['/shop?sort=price-desc'] })

    expect(await screen.findByText(products[0].title)).toBeInTheDocument()
    expect(productsCalls()[0][1]).toMatchObject({ sortKey: 'PRICE', reverse: true, first: 12 })
    expect(screen.getByText(/Sort: Price: High/)).toBeInTheDocument()
  })

  it('falls back to the default sort for a legacy ?sort=BEST_SELLING&reverse=true URL', async () => {
    renderWithProviders(<ShopPage />, { initialEntries: ['/shop?sort=BEST_SELLING&reverse=true'] })

    expect(await screen.findByText(products[0].title)).toBeInTheDocument()
    expect(productsCalls()[0][1]).toMatchObject({ sortKey: 'BEST_SELLING', reverse: false })
    expect(screen.getByText(/Sort: Best Selling/)).toBeInTheDocument()
  })

  it('loads the next page with the first page endCursor and appends', async () => {
    shopifyFetch.mockImplementation(async (query: string, variables?: Record<string, unknown>) => {
      if (query.includes('query Collections')) return { collections: { edges: [] } }
      if (variables?.after === 'end-1') return productsPage(products.slice(2, 3))
      return productsPage(products.slice(0, 2), 'end-1')
    })
    const user = userEvent.setup()
    renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] })

    await user.click(await screen.findByRole('button', { name: 'LOAD MORE' }))

    expect(await screen.findByText(products[2].title)).toBeInTheDocument()
    expect(screen.getByText(products[0].title)).toBeInTheDocument()
    expect(productsCalls()[1][1]).toMatchObject({ after: 'end-1' })
    expect(screen.queryByRole('button', { name: 'LOAD MORE' })).not.toBeInTheDocument()
  })

  it('lists a Collection through CollectionByHandle when the filter is set', async () => {
    renderWithProviders(<ShopPage />, { initialEntries: ['/shop?collection=everyday'] })

    expect(await screen.findByText('Aria Pendant')).toBeInTheDocument()
    expect(productsCalls()).toHaveLength(0)
    const call = shopifyFetch.mock.calls.find(([q]) => String(q).includes('query CollectionByHandle'))
    expect(call?.[1]).toMatchObject({ handle: 'everyday', first: 12 })
  })

  it('writes the sort to the URL and drops reverse, deleting it for best-selling', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ShopPage />, { initialEntries: ['/shop?sort=price-asc'] })
    await screen.findByText(products[0].title)

    await user.click(screen.getByRole('button', { name: 'Newest' }))
    await waitFor(() => {
      expect(productsCalls().slice(-1)[0]?.[1]).toMatchObject({ sortKey: 'CREATED_AT', reverse: true })
    })

    await user.click(screen.getByRole('button', { name: 'Best Selling' }))
    await waitFor(() => {
      expect(productsCalls().slice(-1)[0]?.[1]).toMatchObject({ sortKey: 'BEST_SELLING', reverse: false })
    })
  })

  it('tracks view_item_list once per load and not again on a rerender', async () => {
    const { rerender } = renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] })

    await screen.findByText(products[0].title)
    await waitFor(() => expect(trackViewItemList).toHaveBeenCalledTimes(1))
    expect(trackViewItemList).toHaveBeenCalledWith('Shop All', [
      { id: products[0].id, name: products[0].title, price: products[0].priceRange.minVariantPrice.amount },
      { id: products[1].id, name: products[1].title, price: products[1].priceRange.minVariantPrice.amount },
    ])

    rerender(<ShopPage />)
    expect(trackViewItemList).toHaveBeenCalledTimes(1)
  })
})
