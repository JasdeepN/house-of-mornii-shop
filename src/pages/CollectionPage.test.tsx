import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { renderWithProviders, userEvent } from '@/test/utils'
import { CollectionPage } from './CollectionPage'
import { getFixtureCollection } from '@/test/fixtures/shopify-fixtures'

const shopifyFetch = vi.fn()

vi.mock('@/hooks/useSEO', () => ({ useSEO: vi.fn() }))

vi.mock('@/lib/shopify/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shopify/client')>('@/lib/shopify/client')
  return {
    ...actual,
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'token',
    shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
  }
})

function Probe() {
  const location = useLocation()
  return <p data-testid="search">{location.search}</p>
}

function renderAt(url: string) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/collections/:handle" element={<CollectionPage />} />
      </Routes>
      <Probe />
    </>,
    { initialEntries: [url] },
  )
}

const sidebar = () => screen.getByRole('complementary', { name: 'Filters' })

describe('CollectionPage', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
    shopifyFetch.mockResolvedValue({ collection: getFixtureCollection('everyday') })
  })

  it('shows the Collection title, its description and its Products', async () => {
    renderAt('/collections/everyday')

    expect(await screen.findByRole('heading', { level: 1, name: 'Everyday' })).toBeInTheDocument()
    expect(getFixtureCollection('everyday')!.description).toBeTruthy()
    expect(screen.getByText(getFixtureCollection('everyday')!.description)).toBeInTheDocument()
    expect(screen.getByText('Aria Pendant')).toBeInTheDocument()
    expect(screen.getByText('Cassia Chain')).toBeInTheDocument()
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ handle: 'everyday', first: 250 })
  })

  it('keeps the breadcrumb', async () => {
    renderAt('/collections/everyday')
    await screen.findByRole('heading', { level: 1, name: 'Everyday' })

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(nav).getByRole('link', { name: 'COLLECTIONS' })).toHaveAttribute('href', '/collections')
  })

  it('lists the Types of the Collection and writes ?type= when one is chosen', async () => {
    const user = userEvent.setup()
    renderAt('/collections/everyday')
    await screen.findByText('Aria Pendant')

    const necklace = within(sidebar()).getByRole('button', { name: /^Necklace\s*2$/ })
    await user.click(necklace)

    expect(screen.getByTestId('search')).toHaveTextContent('?type=Necklace')
    expect(screen.getByText('Cassia Chain')).toBeInTheDocument()
    expect(screen.queryByText('Seren Studs')).not.toBeInTheDocument()
  })

  it('sends CREATED reverse for ?sort=newest', async () => {
    renderAt('/collections/everyday?sort=newest')

    await screen.findByRole('heading', { level: 1, name: 'Everyday' })
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'CREATED', reverse: true })
    expect(within(sidebar()).getByRole('button', { name: 'Newest' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('writes ?sort=newest from the sidebar and omits sort for Recommended (COLLECTION_DEFAULT)', async () => {
    const user = userEvent.setup()
    renderAt('/collections/everyday')
    await screen.findByText('Aria Pendant')
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'COLLECTION_DEFAULT', reverse: false })

    await user.click(within(sidebar()).getByRole('button', { name: 'Newest' }))
    expect(screen.getByTestId('search')).toHaveTextContent('?sort=newest')

    await user.click(within(sidebar()).getByRole('button', { name: 'Recommended' }))
    expect(screen.getByTestId('search')).toBeEmptyDOMElement()
  })

  it('shows the not-found page for a Collection Shopify does not have', async () => {
    shopifyFetch.mockResolvedValue({ collection: null })
    renderAt('/collections/missing')

    expect(await screen.findByRole('heading', { name: 'Collection Not Found' })).toBeInTheDocument()
  })
})
