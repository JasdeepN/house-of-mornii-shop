import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '@/test/utils'
import { CollectionPage } from './CollectionPage'
import { getFixtureCollection } from '@/test/fixtures/shopify-fixtures'

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

describe('CollectionPage', () => {
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
})
