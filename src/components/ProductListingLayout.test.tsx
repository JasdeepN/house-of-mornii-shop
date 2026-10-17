import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from '@/context/CartContext'
import { listingOf } from '@/test/fixtures/catalog-fixtures'
import type { ListingFilters } from '@/lib/shopify'
import { ProductListingLayout } from './ProductListingLayout'

const products = listingOf([
  { id: 'a', type: 'Necklace', available: true },
  { id: 'b', type: 'Necklace', available: false },
  { id: 'c', type: 'Ring', available: true },
])
const defaults: ListingFilters = { type: null, hideSoldOut: false, sort: 'recommended' }

function renderLayout(props: Partial<React.ComponentProps<typeof ProductListingLayout>> = {}) {
  const onFiltersChange = vi.fn()
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <CartProvider>
          <ProductListingLayout
            title="Shop"
            products={products}
            isLoading={false}
            filters={defaults}
            onFiltersChange={onFiltersChange}
            {...props}
          />
        </CartProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  return onFiltersChange
}

const sidebar = () => within(screen.getByRole('complementary', { name: 'Filters' }))

describe('ProductListingLayout', () => {
  it('shows the title, intro and Type counts', () => {
    renderLayout({ intro: 'Pieces for every day' })

    expect(screen.getByRole('heading', { level: 1, name: 'Shop' })).toBeInTheDocument()
    expect(screen.getByText('Pieces for every day')).toBeInTheDocument()
    expect(sidebar().getByRole('button', { name: /^All\s*3$/ })).toHaveAttribute('aria-pressed', 'true')
    expect(sidebar().getByRole('button', { name: /^Necklace\s*2$/ })).toBeInTheDocument()
    expect(screen.getByText('3 products')).toBeInTheDocument()
  })

  it('reports a chosen Type, Hide sold out and Sort', async () => {
    const user = userEvent.setup()
    const onFiltersChange = renderLayout()

    await user.click(sidebar().getByRole('button', { name: /^Ring/ }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...defaults, type: 'Ring' })

    await user.click(sidebar().getByRole('checkbox', { name: 'Hide sold out' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...defaults, hideSoldOut: true })

    await user.click(sidebar().getByRole('button', { name: 'Name Z–A' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...defaults, sort: 'title-desc' })
  })

  it('offers the same choices to phones as chips and a Sort select', async () => {
    const user = userEvent.setup()
    const onFiltersChange = renderLayout({ filters: { ...defaults, type: 'Ring' } })

    const chips = within(screen.getByRole('group', { name: 'Product type' }))
    expect(chips.getByRole('button', { name: /Ring · 1/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(chips.getByRole('button', { name: 'Hide sold out' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({ type: 'Ring', hideSoldOut: true, sort: 'recommended' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'price-asc')
    expect(onFiltersChange).toHaveBeenLastCalledWith({ type: 'Ring', hideSoldOut: false, sort: 'price-asc' })
  })

  it('counts and lists with Hide sold out applied', () => {
    renderLayout({ filters: { ...defaults, hideSoldOut: true } })

    expect(sidebar().getByRole('button', { name: /^All\s*2$/ })).toBeInTheDocument()
    expect(sidebar().getByRole('button', { name: /^Necklace\s*1$/ })).toBeInTheDocument()
    expect(screen.getByText('2 products')).toBeInTheDocument()
  })

  it('offers Clear filters when the filters match nothing', async () => {
    const user = userEvent.setup()
    const onFiltersChange = renderLayout({ filters: { type: 'Tikka', hideSoldOut: true, sort: 'newest' } })

    expect(screen.getByText('No Products match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onFiltersChange).toHaveBeenCalledWith({ type: null, hideSoldOut: false, sort: 'newest' })
  })

  it('shows a loading state, then nothing else', () => {
    renderLayout({ isLoading: true, products: [] })

    expect(screen.getByText('Loading products...')).toBeInTheDocument()
    expect(screen.queryByText(/products$/)).not.toBeInTheDocument()
  })

  it('shows the error in place of the results', () => {
    renderLayout({ error: 'Unable to fetch products.' })

    expect(screen.getByText('Unable to fetch products.')).toBeInTheDocument()
    expect(screen.queryByText('3 products')).not.toBeInTheDocument()
  })
})
