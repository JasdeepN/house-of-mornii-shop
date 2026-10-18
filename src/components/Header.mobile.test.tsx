import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Header } from './Header'

vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: true,
  shopifyFetch: vi.fn(),
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true,
}))

describe('Header on phones', () => {
  it('shows Sign in, Search, Bag and the menu together', async () => {
    renderWithProviders(<Header />)
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search products/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bag' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('names the Bag button for assistive technology', async () => {
    renderWithProviders(<Header />)
    expect(await screen.findByRole('button', { name: 'Bag' })).toHaveAccessibleName('Bag')
  })

  it('offers Sign in and a single Book a styling control in the menu sheet', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(await screen.findByRole('button', { name: 'SIGN IN' })).toBeInTheDocument()
    expect(screen.getAllByText('BOOK A STYLING')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'BOOK A STYLING' })).toHaveAttribute('href', '/contact#styling')
    expect(screen.queryByRole('button', { name: 'BOOK A STYLING' })).not.toBeInTheDocument()
  })
})
