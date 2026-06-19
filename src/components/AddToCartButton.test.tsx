import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { AddToCartButton } from './AddToCartButton'

const addToCart = vi.fn(() => Promise.resolve())
const trackAddToCart = vi.fn()

vi.mock('@/context/CartContext', async () => {
  const actual = await vi.importActual<'@/context/CartContext'>('@/context/CartContext')
  return {
    ...(actual as Record<string, unknown>),
    useCart: () => ({
      addToCart,
    }),
  }
})

vi.mock('@/lib/analytics', () => ({
  trackAddToCart: (...args: unknown[]) => trackAddToCart(...args),
}))

describe('AddToCartButton', () => {
  beforeEach(() => {
    addToCart.mockClear()
    trackAddToCart.mockClear()
  })

  it('tracks add-to-cart with the real product payload', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AddToCartButton
        variantId="gid://shopify/ProductVariant/1"
        availableForSale
        productTitle="Aria Pendant"
        productPrice="89.00"
        currencyCode="CAD"
      />,
    )

    await user.click(screen.getByTestId('add-to-cart'))

    expect(trackAddToCart).toHaveBeenCalledWith({
      id: 'gid://shopify/ProductVariant/1',
      name: 'Aria Pendant',
      price: '89.00',
      quantity: 1,
      currency: 'CAD',
    })

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledWith('gid://shopify/ProductVariant/1')
    })
  })
})