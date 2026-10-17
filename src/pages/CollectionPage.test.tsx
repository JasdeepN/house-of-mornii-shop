import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, userEvent } from '@/test/utils'
import { CollectionPage } from './CollectionPage'
import { getFixtureCollection, getFixtureProducts } from '@/test/fixtures/shopify-fixtures'

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

function renderAt(url: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/collections/:handle" element={<CollectionPage />} />
    </Routes>,
    { initialEntries: [url] },
  )
}

describe('CollectionPage', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
  })

  it('renders a collection detail route without hook-order errors', async () => {
    shopifyFetch.mockResolvedValue({ collection: getFixtureCollection('everyday') })

    renderWithProviders(
      <Routes>
        <Route path="/collections/:handle" element={<CollectionPage />} />
      </Routes>,
      { initialEntries: ['/collections/everyday'] },
    )

    expect(await screen.findByRole('heading', { name: 'Everyday' })).toBeInTheDocument()
    expect(screen.getByText('Aria Pendant')).toBeInTheDocument()
    expect(screen.getByText('Cassia Chain')).toBeInTheDocument()
  })

  it('loads more Products with the endCursor and appends them', async () => {
    const everyday = getFixtureCollection('everyday')!
    const extra = getFixtureProducts().find((p) => p.handle === 'zara-ring')!
    shopifyFetch.mockImplementation(async (_query: string, variables?: Record<string, unknown>) => {
      if (variables?.after === 'end-1') {
        return {
          collection: {
            ...everyday,
            products: { edges: [{ node: extra, cursor: 'c' }], pageInfo: { hasNextPage: false, endCursor: null } },
          },
        }
      }
      return {
        collection: { ...everyday, products: { ...everyday.products, pageInfo: { hasNextPage: true, endCursor: 'end-1' } } },
      }
    })
    const user = userEvent.setup()
    renderAt('/collections/everyday')

    await user.click(await screen.findByRole('button', { name: 'LOAD MORE' }))

    expect(await screen.findByText('Zara Ring')).toBeInTheDocument()
    expect(screen.getByText('Aria Pendant')).toBeInTheDocument()
    expect(shopifyFetch.mock.calls[1][1]).toMatchObject({ handle: 'everyday', after: 'end-1' })
  })

  it('shows the not-found page for a Collection Shopify does not have', async () => {
    shopifyFetch.mockResolvedValue({ collection: null })
    renderAt('/collections/missing')

    expect(await screen.findByRole('heading', { name: 'Collection Not Found' })).toBeInTheDocument()
  })

  it('sends CREATED reverse for ?sort=newest and keeps the Collection order with no sort', async () => {
    shopifyFetch.mockResolvedValue({ collection: getFixtureCollection('everyday') })
    renderAt('/collections/everyday?sort=newest')

    await screen.findByRole('heading', { name: 'Everyday' })
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'CREATED', reverse: true })
    expect(screen.getByText(/Sort: Newest/)).toBeInTheDocument()
  })

  it('uses COLLECTION_DEFAULT and the Featured label with no sort', async () => {
    shopifyFetch.mockResolvedValue({ collection: getFixtureCollection('everyday') })
    renderAt('/collections/everyday')

    await screen.findByRole('heading', { name: 'Everyday' })
    expect(shopifyFetch.mock.calls[0][1]).toMatchObject({ sortKey: 'COLLECTION_DEFAULT', reverse: false })
    expect(screen.getByText(/Sort: Featured/)).toBeInTheDocument()
  })
})
