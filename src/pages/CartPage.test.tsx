import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartPage } from './CartPage'

let status: 'signed-in' | 'signed-out' = 'signed-out'

vi.mock('@/lib/customer', () => ({
  useCustomerSession: () => ({ session: { status } }),
}))

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    cart: {
      id: 'gid://shopify/Cart/c1',
      checkoutUrl: 'https://checkout.houseofmornii.com/cart/c/abc?key=k1',
      totalQuantity: 1,
      lines: { edges: [{ node: {
        id: 'line-1', quantity: 1,
        merchandise: {
          id: 'v1', title: 'Default Title',
          product: { handle: 'p', title: 'Pendant', featuredImage: null },
          price: { amount: '10.00', currencyCode: 'CAD' },
          selectedOptions: [], image: null,
        },
        cost: {
          totalAmount: { amount: '10.00', currencyCode: 'CAD' },
          amountPerQuantity: { amount: '10.00', currencyCode: 'CAD' },
        },
      } }] },
      cost: {
        subtotalAmount: { amount: '10.00', currencyCode: 'CAD' },
        totalAmount: { amount: '10.00', currencyCode: 'CAD' },
        totalTaxAmount: null,
      },
    },
    isLoading: false,
    itemCount: 1,
    isCartOpen: true,
    setCartOpen: vi.fn(),
    updateLineItem: vi.fn(),
    removeLineItem: vi.fn(),
  }),
}))

describe('CartPage checkout link', () => {
  beforeEach(() => {
    status = 'signed-out'
  })

  it('has no sso param when signed out', () => {
    render(<MemoryRouter><CartPage /></MemoryRouter>)
    const href = screen.getByText(/checkout/i, { selector: 'a, a *' }).closest('a')!.getAttribute('href')!
    expect(href).toBe('https://checkout.houseofmornii.com/cart/c/abc?key=k1')
  })

  it('makes no free-shipping or returns claim', () => {
    render(<MemoryRouter><CartPage /></MemoryRouter>)
    expect(screen.queryByText(/free shipping/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/easy returns/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/authenticity/i)).not.toBeInTheDocument()
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument()
  })

  it('adds sso=silent when signed in', () => {
    status = 'signed-in'
    render(<MemoryRouter><CartPage /></MemoryRouter>)
    const href = screen.getByText(/checkout/i, { selector: 'a, a *' }).closest('a')!.getAttribute('href')!
    const url = new URL(href)
    expect(url.searchParams.get('sso')).toBe('silent')
    expect(url.searchParams.get('key')).toBe('k1')
  })
})
