import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Routes, Route, Link } from 'react-router-dom'
import { renderWithProviders, userEvent } from '@/test/utils'
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

  function renderFrom(from: string) {
    return renderWithProviders(
      <Routes>
        <Route path="/" element={<Link to="/products/aria-pendant" state={{ from }}>Open</Link>} />
        <Route path="/products/:handle" element={<ProductPage />} />
      </Routes>,
      { initialEntries: ['/'] },
    )
  }

  it('links the list level back to the Shop URL it came from, filters included', async () => {
    renderFrom('/shop?type=Necklace')
    await userEvent.setup().click(screen.getByRole('link', { name: 'Open' }))
    await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(nav).getByRole('link', { name: 'SHOP' })).toHaveAttribute('href', '/shop?type=Necklace')
    expect(within(nav).queryByRole('link', { name: 'COLLECTIONS' })).not.toBeInTheDocument()
  })

  it('links back to the Collection it came from, named by its title', async () => {
    renderFrom('/collections/everyday?sort=newest')
    await userEvent.setup().click(screen.getByRole('link', { name: 'Open' }))
    await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(nav).getByRole('link', { name: 'EVERYDAY' })).toHaveAttribute('href', '/collections/everyday?sort=newest')
  })

  it('ignores a from state that is not a list URL', async () => {
    renderFrom('https://elsewhere.example/shop')
    await userEvent.setup().click(screen.getByRole('link', { name: 'Open' }))
    await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(nav).getByRole('link', { name: 'COLLECTIONS' })).toBeInTheDocument()
  })

  it('has no enquiry section without a Turnstile site key', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')
    renderProduct('aria-pendant')
    await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })
    expect(screen.queryByRole('button', { name: /ask about this piece/i })).not.toBeInTheDocument()
  })

  it('reveals the enquiry form from Ask about this piece', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key')
    window.turnstile = { render: () => 'w', reset: () => {}, remove: () => {} }
    renderProduct('aria-pendant')
    await screen.findByRole('heading', { level: 1, name: 'Aria Pendant' })

    const toggle = screen.getByRole('button', { name: /ask about this piece/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.setup().click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    delete window.turnstile
    vi.unstubAllEnvs()
  })
})
