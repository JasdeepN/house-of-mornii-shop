import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, renderWithRouter } from '@/test/utils'

// Force demo mode
vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: false,
  shopifyFetch: vi.fn(),
}))

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

import { CollectionsSection } from '@/components/CollectionsSection'
import { CartPage } from '@/pages/CartPage'
import { ContactPage } from '@/pages/ContactPage'

// ── Phase 1a: CollectionsSection copy fix ─────────────────────────────────────

describe('CollectionsSection copy', () => {
  it('does not reference Parisfall or eyeshadow', () => {
    renderWithRouter(<CollectionsSection />)

    const section = document.querySelector('#collections')!
    expect(section.textContent).not.toMatch(/parisfall/i)
    expect(section.textContent).not.toMatch(/eyeshadow/i)
  })

  it('contains appropriate brand copy', () => {
    renderWithRouter(<CollectionsSection />)

    expect(screen.getByText(/curated jewellery collections/i)).toBeInTheDocument()
  })
})

// ── Phase 1b: CartPage renders ────────────────────────────────────────────────

describe('CartPage', () => {
  it('renders with Your Bag heading', () => {
    renderWithProviders(<CartPage />, { initialEntries: ['/cart'] })

    expect(screen.getByText('Your Bag')).toBeInTheDocument()
  })
})

// ── Phase 1d: Book a Styling button ───────────────────────────────────────────

describe('ContactPage Book a Styling', () => {
  it('renders appointment link as an anchor with mailto href', () => {
    renderWithProviders(<ContactPage />, { initialEntries: ['/contact'] })

    const bookLink = screen.getByText('BOOK YOUR APPOINTMENT')
    expect(bookLink.tagName).toBe('A')
    expect(bookLink).toHaveAttribute('href', expect.stringContaining('mailto:'))
  })
})
