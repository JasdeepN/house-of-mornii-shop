import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { CartFlyout } from './CartFlyout'
import { useCart } from '@/context/CartContext'

// Force demo mode
vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: false,
  shopifyFetch: vi.fn(),
}))

function OpenCartWrapper() {
  const { openCart } = useCart()
  return (
    <>
      <button onClick={openCart}>Open</button>
      <CartFlyout />
    </>
  )
}

describe('CartFlyout', () => {
  it('renders without crashing', () => {
    renderWithProviders(<CartFlyout />)
    // The Sheet is closed by default — the title may be in the DOM but hidden
    // Just verify no errors during render
  })

  it('shows empty state text when cart is open and empty', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')

    renderWithProviders(<OpenCartWrapper />)
    const user = userEvent.setup()
    await user.click(screen.getByText('Open'))

    expect(await screen.findByText(/your bag is empty/i)).toBeInTheDocument()
    expect(screen.getByText(/browse collections/i)).toBeInTheDocument()
  })
})
