import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '@/test/utils'
import { CollectionPage } from './CollectionPage'

vi.mock('@/lib/shopify/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shopify/client')>('@/lib/shopify/client')
  return {
    ...actual,
    IS_CONFIGURED: false,
    STOREFRONT_MODE: 'demo',
    shopifyFetch: vi.fn(),
  }
})

describe('CollectionPage', () => {
  it('renders a demo collection detail route without hook-order errors', async () => {
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