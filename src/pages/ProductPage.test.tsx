import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '@/test/utils'
import { ProductPage } from './ProductPage'
import { getFixtureCollection, getFixtureProduct } from '@/test/fixtures/shopify-fixtures'

const shopifyFetch = vi.fn()

vi.mock('@/lib/shopify/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shopify/client')>('@/lib/shopify/client')
  return {
    ...actual,
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'token',
    shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
  }
})

function renderProduct(handle: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/products/:handle" element={<ProductPage />} />
    </Routes>,
    { initialEntries: [`/products/${handle}`] },
  )
}

describe('ProductPage', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
    shopifyFetch.mockImplementation(async (query: string, variables?: { handle?: string }) => {
      if (query.includes('query ProductByHandle')) {
        return { product: getFixtureProduct(variables?.handle ?? '') }
      }
      if (query.includes('query CollectionByHandle')) {
        return { collection: getFixtureCollection(variables?.handle ?? '') }
      }
      throw new Error(`unmocked query: ${query.slice(0, 40)}`)
    })
  })

  it('renders the Product title and price', async () => {
    renderProduct('aria-pendant')

    expect(await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })).toBeInTheDocument()
    expect(screen.getAllByText(/\$89\.00/).length).toBeGreaterThan(0)
  })

  it('shows the primary Collection in the breadcrumb', async () => {
    renderProduct('aria-pendant')
    await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(nav).getByRole('link', { name: 'EVERYDAY' })).toHaveAttribute('href', '/collections/everyday')
  })

  it('lists related Products without the Product itself', async () => {
    renderProduct('aria-pendant')

    expect(await screen.findByText('Seren Studs')).toBeInTheDocument()
    const cards = screen.getAllByTestId('product-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.some((c) => c.getAttribute('href') === '/products/aria-pendant')).toBe(false)
  })
})
