import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '@/test/utils'
import { AddToCartButton } from './AddToCartButton'

const addToCart = vi.fn<(variantId: string) => Promise<boolean>>()
const trackAddToCart = vi.fn()

vi.mock('@/context/CartContext', async () => {
  const actual = await vi.importActual<typeof import('@/context/CartContext')>('@/context/CartContext')
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
    addToCart.mockReset().mockResolvedValue(true)
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

  const renderButton = () =>
    renderWithProviders(
      <AddToCartButton
        variantId="gid://shopify/ProductVariant/1"
        availableForSale
        productTitle="Aria Pendant"
        productPrice="89.00"
        currencyCode="CAD"
      />,
    )

  it('is enabled again and reads "Add to bag" after a successful add', async () => {
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByTestId('add-to-cart'))

    await waitFor(() => expect(screen.getByTestId('add-to-cart')).toBeEnabled())
    expect(screen.getByTestId('add-to-cart')).toHaveTextContent(/add to bag/i)
    expect(trackAddToCart).toHaveBeenCalledTimes(1)
  })

  it('is enabled again after a failed add, and does not track it', async () => {
    addToCart.mockResolvedValue(false)
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByTestId('add-to-cart'))

    await waitFor(() => expect(addToCart).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('add-to-cart')).toBeEnabled())
    expect(screen.getByTestId('add-to-cart')).toHaveTextContent(/add to bag/i)
    expect(trackAddToCart).not.toHaveBeenCalled()
  })
})
