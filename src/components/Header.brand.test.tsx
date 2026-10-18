import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Header } from './Header'

const shopifyFetch = vi.fn()
vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: true,
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))

beforeEach(() => shopifyFetch.mockReset())

describe('Header brand', () => {
  it('shows the lettering fallback when Brand settings are empty', async () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: { logo: null } } })
    renderWithProviders(<Header />)
    expect(await screen.findByText('Mornii')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'House of Mornii' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'House of Mornii, home' })).toHaveLength(1)
  })

  it('shows the Brand logo, contained, once loaded', async () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: { logo: { image: { url: 'https://cdn.example/logo.png' } } } } })
    renderWithProviders(<Header />)
    const img = await screen.findByRole('img', { name: 'House of Mornii' })
    expect(img).toHaveAttribute('src', 'https://cdn.example/logo.png')
    expect(img).toHaveClass('object-contain')
    await waitFor(() => expect(screen.queryByText('Mornii')).not.toBeInTheDocument())
  })

  it('pins only the teal bar', () => {
    shopifyFetch.mockResolvedValue({ shop: { brand: null } })
    renderWithProviders(<Header />)
    const bar = screen.getByRole('banner')
    expect(bar).toHaveClass('sticky', 'top-0')
    expect(bar).not.toContainElement(screen.getByRole('link', { name: 'House of Mornii, home' }))
  })
})
