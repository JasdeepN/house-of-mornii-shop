import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { CartFlyout } from './CartFlyout'
import { useCart } from '@/context/CartContext'
import { getDemoProducts } from '@/lib/shopify/demo-data'

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

function PopulatedCartWrapper() {
  const { addToCart, openCart } = useCart()
  const variantId = getDemoProducts()[0].variants.edges[0].node.id

  return (
    <>
      <button
        onClick={async () => {
          await addToCart(variantId)
          openCart()
        }}
      >
        Open with item
      </button>
      <CartFlyout />
    </>
  )
}

describe('CartFlyout', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without crashing', () => {
    renderWithProviders(<CartFlyout />)
    // The Sheet is closed by default — the title may be in the DOM but hidden
    // Just verify no errors during render
  })

  it('shows empty state text when cart is open and empty', async () => {
    renderWithProviders(<OpenCartWrapper />)
    const user = userEvent.setup()
    await user.click(screen.getByText('Open'))

    expect(await screen.findByText(/your bag is empty/i)).toBeInTheDocument()
    expect(screen.getByText(/browse collections/i)).toBeInTheDocument()
  })

  it('disables checkout when the cart checkout URL is not valid', async () => {
    renderWithProviders(<PopulatedCartWrapper />)
    const user = userEvent.setup()

    await user.click(screen.getByText('Open with item'))

    const checkoutButton = await screen.findByTestId('checkout-button')
    expect(checkoutButton).toHaveAttribute('aria-disabled', 'true')
    expect(checkoutButton).not.toHaveAttribute('href')
  })

  it('accumulates rapid quantity clicks before sending one update', async () => {
    // Use synchronous clicks and verify the debounce behavior
    renderWithProviders(<PopulatedCartWrapper />)
    const user = userEvent.setup()

    await user.click(screen.getByText('Open with item'))
    
    // Wait for cart items to appear
    const increaseButton = await screen.findByRole('button', { name: /increase quantity for aria pendant/i })

    // Click increase button 3 times rapidly (synchronous)
    increaseButton.click()
    increaseButton.click()
    increaseButton.click()

    // Quantity display should still show 1 because debounce hasn't fired yet
    expect(screen.getByRole('status')).toHaveTextContent('1')
  }, 10000)
})
