import { afterEach, describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, renderWithRouter, userEvent } from '@/test/utils'

vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: true,
  shopifyFetch: vi.fn(),
}))

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

import { CollectionsSection } from '@/components/CollectionsSection'
import { CartPage } from '@/pages/CartPage'
import { ContactPage } from '@/pages/ContactPage'

afterEach(() => {
  vi.unstubAllEnvs()
})

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
  it('shows no coming-soon text or location line when none is set', () => {
    vi.stubEnv('VITE_CONTACT_LOCATION_LABEL', '')

    renderWithProviders(<ContactPage />, { initialEntries: ['/contact'] })

    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    expect(screen.queryByText('LOCATION')).not.toBeInTheDocument()
  })

  it('offers no booking button, and no mailto action, without a Turnstile site key', () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')

    renderWithProviders(<ContactPage />, { initialEntries: ['/contact'] })

    expect(screen.queryByText('BOOK YOUR APPOINTMENT')).not.toBeInTheDocument()
  })

  it('reveals the styling form from the button', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key')
    window.turnstile = { render: () => 'w', reset: () => {}, remove: () => {} }

    renderWithProviders(<ContactPage />, { initialEntries: ['/contact'] })
    const button = screen.getByRole('button', { name: 'BOOK YOUR APPOINTMENT' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Message')).not.toBeInTheDocument()

    await userEvent.setup().click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText("Tell us what you're looking for and when suits you.")).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    delete window.turnstile
  })

  it('opens the form when the URL carries #styling', () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key')
    window.turnstile = { render: () => 'w', reset: () => {}, remove: () => {} }

    renderWithProviders(<ContactPage />, { initialEntries: ['/contact#styling'] })

    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    delete window.turnstile
  })
})
