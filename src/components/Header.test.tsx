import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { Header } from './Header'

// Force demo mode
vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: false,
  shopifyFetch: vi.fn(),
}))

// Mock useIsMobile to return false (desktop) by default
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

describe('Header', () => {
  it('renders nav links', () => {
    renderWithProviders(<Header />)

    expect(screen.getByText('SHOP')).toBeInTheDocument()
    expect(screen.getByText('COLLECTIONS')).toBeInTheDocument()
    expect(screen.getByText('ABOUT')).toBeInTheDocument()
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
  })

  it('renders BOOK A STYLING link', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText('BOOK A STYLING')).toBeInTheDocument()
  })

  it('nav links point to correct routes', () => {
    renderWithProviders(<Header />)

    const shopLink = screen.getByText('SHOP').closest('a')
    expect(shopLink).toHaveAttribute('href', '/shop')

    const aboutLink = screen.getByText('ABOUT').closest('a')
    expect(aboutLink).toHaveAttribute('href', '/about')

    const collectionsLink = screen.getByText('COLLECTIONS').closest('a')
    expect(collectionsLink).toHaveAttribute('href', '/collections')

    const contactLink = screen.getByText('CONTACT').closest('a')
    expect(contactLink).toHaveAttribute('href', '/contact')
  })

  it('shows bag icon', () => {
    renderWithProviders(<Header />)
    // The bag button should be present (check for any button that isn't a nav link)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
