import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider, useCart } from './CartContext'
import { CustomerAuthProvider } from '@/context/CustomerAuthContext'
import type { ReactNode } from 'react'
import { getFixtureProducts } from '@/test/fixtures/shopify-fixtures'
import type { ShopifyCart, ShopifyCartLine } from '@/lib/shopify/types'

const shopifyFetch = vi.fn()

vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: true,
  shopifyFetch: (...args: unknown[]) => shopifyFetch(...args),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CustomerAuthProvider>
            <CartProvider>{children}</CartProvider>
          </CustomerAuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }
}

// Build a mock ShopifyCart response from a set of lines, mirroring the
// shape the real Storefront API cart mutations return.
let _lineId = 0
function makeLine(variantId: string, quantity: number): ShopifyCartLine {
  const products = getFixtureProducts()
  const product = products.find((p) =>
    p.variants.edges.some((e) => e.node.id === variantId),
  )!
  const variant = product.variants.edges[0].node
  const price = variant.price
  return {
    id: `line-${++_lineId}`,
    quantity,
    merchandise: {
      id: variant.id,
      title: variant.title,
      product: {
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage,
      },
      price,
      selectedOptions: variant.selectedOptions,
      image: variant.image,
    },
    cost: {
      totalAmount: {
        amount: (parseFloat(price.amount) * quantity).toFixed(2),
        currencyCode: price.currencyCode,
      },
      amountPerQuantity: price,
    },
  }
}

function makeCart(lines: ShopifyCartLine[]): ShopifyCart {
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)
  const subtotal = lines.reduce(
    (sum, l) => sum + parseFloat(l.cost.totalAmount.amount),
    0,
  )
  return {
    id: 'gid://shopify/Cart/test-cart',
    checkoutUrl: 'https://checkout.example.com',
    totalQuantity,
    lines: { edges: lines.map((l) => ({ node: l })) },
    cost: {
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: 'CAD' },
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: 'CAD' },
      totalTaxAmount: null,
    },
  }
}

describe('useCart', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
    localStorage.clear()
  })

  it('throws when used outside CartProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      renderHook(() => useCart())
    }).toThrow('useCart must be used within <CartProvider>')
    spy.mockRestore()
  })

  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    expect(result.current.cart).toBeNull()
    expect(result.current.itemCount).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isCartOpen).toBe(false)
  })

  it('openCart sets isCartOpen to true', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    act(() => result.current.openCart())
    expect(result.current.isCartOpen).toBe(true)
  })

  it('setCartOpen toggles cart open state', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    act(() => result.current.setCartOpen(true))
    expect(result.current.isCartOpen).toBe(true)

    act(() => result.current.setCartOpen(false))
    expect(result.current.isCartOpen).toBe(false)
  })
})

describe('Cart operations (token mode, shopifyFetch mocked)', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
    localStorage.clear()
  })

  it('addToCart creates a cart with one item', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    const variantId = getFixtureProducts()[0].variants.edges[0].node.id
    const line = makeLine(variantId, 1)
    shopifyFetch.mockResolvedValueOnce({
      cartCreate: { cart: makeCart([line]), userErrors: [] },
    })

    await act(async () => {
      await result.current.addToCart(variantId)
    })

    expect(result.current.cart).not.toBeNull()
    expect(result.current.itemCount).toBe(1)
    expect(result.current.isCartOpen).toBe(true)
  })

  it('addToCart increases quantity for same variant', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    const variantId = getFixtureProducts()[0].variants.edges[0].node.id

    shopifyFetch.mockResolvedValueOnce({
      cartCreate: { cart: makeCart([makeLine(variantId, 1)]), userErrors: [] },
    })
    await act(async () => {
      await result.current.addToCart(variantId)
    })

    const existingLineId = result.current.cart!.lines.edges[0].node.id
    shopifyFetch.mockResolvedValueOnce({
      cartLinesAdd: {
        cart: makeCart([{ ...makeLine(variantId, 3), id: existingLineId }]),
        userErrors: [],
      },
    })
    await act(async () => {
      await result.current.addToCart(variantId, 2)
    })

    expect(result.current.itemCount).toBe(3)
    const lines = result.current.cart!.lines.edges
    expect(lines).toHaveLength(1)
    expect(lines[0].node.quantity).toBe(3)
  })

  it('addToCart adds different products as separate lines', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    const products = getFixtureProducts()
    const variantId1 = products[0].variants.edges[0].node.id
    const variantId2 = products[1].variants.edges[0].node.id

    shopifyFetch.mockResolvedValueOnce({
      cartCreate: { cart: makeCart([makeLine(variantId1, 1)]), userErrors: [] },
    })
    await act(async () => {
      await result.current.addToCart(variantId1)
    })

    const line1 = result.current.cart!.lines.edges[0].node
    shopifyFetch.mockResolvedValueOnce({
      cartLinesAdd: {
        cart: makeCart([line1, makeLine(variantId2, 1)]),
        userErrors: [],
      },
    })
    await act(async () => {
      await result.current.addToCart(variantId2)
    })

    expect(result.current.itemCount).toBe(2)
    expect(result.current.cart!.lines.edges).toHaveLength(2)
  })

  it('updateLineItem changes quantity', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    const variantId = getFixtureProducts()[0].variants.edges[0].node.id
    shopifyFetch.mockResolvedValueOnce({
      cartCreate: { cart: makeCart([makeLine(variantId, 1)]), userErrors: [] },
    })
    await act(async () => {
      await result.current.addToCart(variantId)
    })

    const lineId = result.current.cart!.lines.edges[0].node.id
    shopifyFetch.mockResolvedValueOnce({
      cartLinesUpdate: {
        cart: makeCart([{ ...makeLine(variantId, 5), id: lineId }]),
        userErrors: [],
      },
    })

    await act(async () => {
      await result.current.updateLineItem(lineId, 5)
    })

    expect(result.current.cart!.lines.edges[0].node.quantity).toBe(5)
    expect(result.current.itemCount).toBe(5)
  })

  it('removeLineItem removes the item from cart', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    const variantId = getFixtureProducts()[0].variants.edges[0].node.id
    shopifyFetch.mockResolvedValueOnce({
      cartCreate: { cart: makeCart([makeLine(variantId, 1)]), userErrors: [] },
    })
    await act(async () => {
      await result.current.addToCart(variantId)
    })

    const lineId = result.current.cart!.lines.edges[0].node.id
    shopifyFetch.mockResolvedValueOnce({
      cartLinesRemove: { cart: null, userErrors: [] },
    })

    await act(async () => {
      await result.current.removeLineItem(lineId)
    })

    expect(result.current.cart).toBeNull()
    expect(result.current.itemCount).toBe(0)
  })

  it('cart cost reflects correct subtotal', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    const product = getFixtureProducts()[0]
    const variantId = product.variants.edges[0].node.id
    const unitPrice = parseFloat(product.variants.edges[0].node.price.amount)

    shopifyFetch.mockResolvedValueOnce({
      cartCreate: { cart: makeCart([makeLine(variantId, 3)]), userErrors: [] },
    })

    await act(async () => {
      await result.current.addToCart(variantId, 3)
    })

    const subtotal = parseFloat(result.current.cart!.cost.subtotalAmount.amount)
    expect(subtotal).toBeCloseTo(unitPrice * 3, 2)
  })
})
