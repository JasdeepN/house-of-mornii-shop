import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { renderWithProviders, userEvent } from '@/test/utils'
import { getEdgeCaseProducts, getFixtureProducts } from '@/test/fixtures/shopify-fixtures'
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

const soldOut = getEdgeCaseProducts().find((p) => p.handle === 'sold-out-product')!
const products = [...getFixtureProducts(), soldOut]

function productsPage(list: typeof products) {
  return {
    products: {
      edges: list.map((node) => ({ node, cursor: `cursor-${node.handle}` })),
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  }
}

function productsCalls() {
  return shopifyFetch.mock.calls.filter(([query]) => String(query).includes('query Products'))
}

function Probe() {
  const location = useLocation()
  return <p data-testid="search">{location.search}</p>
}

function renderShop(url = '/shop') {
  return renderWithProviders(
    <>
      <ShopPage />
      <Probe />
    </>,
    { initialEntries: [url] },
  )
}

const sidebar = () => screen.getByRole('complementary', { name: 'Filters' })

describe('ShopPage', () => {
  beforeEach(() => {
    trackViewItemList.mockReset()
    shopifyFetch.mockReset()
    shopifyFetch.mockImplementation(async (query: string) => {
      if (query.includes('query Products')) return productsPage(products)
      throw new Error(`Unexpected query: ${query}`)
    })
  })

  it('lists every Product and the Types with their counts', async () => {
    renderShop()

    expect(await screen.findByRole('heading', { level: 1, name: 'Shop' })).toBeInTheDocument()
    expect(await screen.findByText(products[0].title)).toBeInTheDocument()
    const types = within(sidebar())
    expect(types.getByRole('button', { name: /^All\s*13$/ })).toBeInTheDocument()
    expect(types.getByRole('button', { name: /^Necklace\s*4$/ })).toBeInTheDocument()
    expect(types.getByRole('button', { name: /^Earrings\s*4$/ })).toBeInTheDocument()
    expect(screen.getByText('13 products')).toBeInTheDocument()
  })

  it('has no Collection chips and loads the whole listing', async () => {
    renderShop('/shop?collection=everyday')

    await screen.findByText(products[0].title)
    expect(screen.queryByRole('button', { name: 'Everyday' })).not.toBeInTheDocument()
    expect(productsCalls()[0][1]).toMatchObject({ first: 250 })
    expect(screen.getByText('13 products')).toBeInTheDocument()
  })

  it('writes ?type= and shows only that Type', async () => {
    const user = userEvent.setup()
    renderShop()
    await screen.findByText(products[0].title)

    await user.click(within(sidebar()).getByRole('button', { name: /^Ring/ }))

    expect(screen.getByTestId('search')).toHaveTextContent('?type=Ring')
    expect(screen.getByText('1 products')).toBeInTheDocument()
    expect(screen.queryByText(products[0].title)).not.toBeInTheDocument()
    expect(within(sidebar()).getByRole('button', { name: /^Ring/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reads the Type from the address', async () => {
    renderShop('/shop?type=Necklace')

    await screen.findByText('4 products')
    expect(screen.getByText(products[0].title)).toBeInTheDocument()
  })

  it('Hide sold out writes available=1 and hides sold-out Products', async () => {
    const user = userEvent.setup()
    renderShop()
    await screen.findByText(soldOut.title)

    await user.click(within(sidebar()).getByRole('checkbox', { name: 'Hide sold out' }))

    expect(screen.getByTestId('search')).toHaveTextContent('?available=1')
    expect(screen.queryByText(soldOut.title)).not.toBeInTheDocument()
    expect(screen.getByText('12 products')).toBeInTheDocument()
    expect(within(sidebar()).getByRole('button', { name: /^Necklace\s*3$/ })).toBeInTheDocument()
  })

  it('writes ?sort=price-desc and sends PRICE reverse', async () => {
    const user = userEvent.setup()
    renderShop()
    await screen.findByText(products[0].title)

    await user.click(within(sidebar()).getByRole('button', { name: 'Price high to low' }))

    expect(screen.getByTestId('search')).toHaveTextContent('?sort=price-desc')
    await waitFor(() => {
      expect(productsCalls().slice(-1)[0][1]).toMatchObject({ sortKey: 'PRICE', reverse: true })
    })
  })

  it('leaves sort out of the address for Recommended', async () => {
    const user = userEvent.setup()
    renderShop('/shop?sort=price-asc')
    await screen.findByText(products[0].title)

    await user.click(within(sidebar()).getByRole('button', { name: 'Recommended' }))

    expect(screen.getByTestId('search')).toBeEmptyDOMElement()
    await waitFor(() => {
      expect(productsCalls().slice(-1)[0][1]).toMatchObject({ sortKey: 'BEST_SELLING', reverse: false })
    })
  })

  it('falls back to Recommended for a legacy ?sort=BEST_SELLING&reverse=true address', async () => {
    renderShop('/shop?sort=BEST_SELLING&reverse=true')

    await screen.findByText(products[0].title)
    expect(productsCalls()[0][1]).toMatchObject({ sortKey: 'BEST_SELLING', reverse: false })
    expect(within(sidebar()).getByRole('button', { name: 'Recommended' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows Clear filters when the filters leave nothing, and clears Type and Hide sold out', async () => {
    shopifyFetch.mockImplementation(async () => productsPage([soldOut]))
    const user = userEvent.setup()
    renderShop('/shop?type=Necklace&available=1&sort=newest')

    expect(await screen.findByText('No Products match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(await screen.findByText(soldOut.title)).toBeInTheDocument()
    expect(screen.getByTestId('search')).toHaveTextContent(/^\?sort=newest$/)
  })

  it('shows the service-error message', async () => {
    shopifyFetch.mockRejectedValue(new Error('Network request failed'))
    renderShop()

    expect(await screen.findByText(/unable|network|connect|try again/i)).toBeInTheDocument()
  })

  it('tracks the first 12 shown Products once and not again on a rerender', async () => {
    const { rerender } = renderShop()

    await screen.findByText(products[0].title)
    await waitFor(() => expect(trackViewItemList).toHaveBeenCalledTimes(1))
    const [name, items] = trackViewItemList.mock.calls[0]
    expect(name).toBe('Shop All')
    expect(items).toHaveLength(12)
    expect(items[0]).toEqual({
      id: products[0].id,
      name: products[0].title,
      price: products[0].priceRange.minVariantPrice.amount,
    })

    rerender(
      <>
        <ShopPage />
        <Probe />
      </>,
    )
    expect(trackViewItemList).toHaveBeenCalledTimes(1)
  })
})
