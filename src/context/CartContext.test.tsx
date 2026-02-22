import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider, useCart } from './CartContext'
import type { ReactNode } from 'react'

// Force demo mode
vi.mock('@/lib/shopify/client', () => ({
  IS_CONFIGURED: false,
  shopifyFetch: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CartProvider>{children}</CartProvider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }
}

describe('useCart', () => {
  it('throws when used outside CartProvider', () => {
    // Suppress console.error for expected error
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

describe('Demo cart operations', () => {
  it('addToCart creates a demo cart with one item', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: createWrapper(),
    })

    // Use a known demo product variant id
    // We need the actual variant ID from demo data
    const { getDemoProducts } = await import('@/lib/shopify/demo-data')
    const products = getDemoProducts()
    const variantId = products[0].variants.edges[0].node.id

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

    const { getDemoProducts } = await import('@/lib/shopify/demo-data')
    const variantId = getDemoProducts()[0].variants.edges[0].node.id

    await act(async () => {
      await result.current.addToCart(variantId)
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

    const { getDemoProducts } = await import('@/lib/shopify/demo-data')
    const products = getDemoProducts()
    const variantId1 = products[0].variants.edges[0].node.id
    const variantId2 = products[1].variants.edges[0].node.id

    await act(async () => {
      await result.current.addToCart(variantId1)
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

    const { getDemoProducts } = await import('@/lib/shopify/demo-data')
    const variantId = getDemoProducts()[0].variants.edges[0].node.id

    await act(async () => {
      await result.current.addToCart(variantId)
    })

    const lineId = result.current.cart!.lines.edges[0].node.id

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

    const { getDemoProducts } = await import('@/lib/shopify/demo-data')
    const variantId = getDemoProducts()[0].variants.edges[0].node.id

    await act(async () => {
      await result.current.addToCart(variantId)
    })

    const lineId = result.current.cart!.lines.edges[0].node.id

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

    const { getDemoProducts } = await import('@/lib/shopify/demo-data')
    const product = getDemoProducts()[0]
    const variantId = product.variants.edges[0].node.id
    const unitPrice = parseFloat(product.variants.edges[0].node.price.amount)

    await act(async () => {
      await result.current.addToCart(variantId, 3)
    })

    const subtotal = parseFloat(result.current.cart!.cost.subtotalAmount.amount)
    expect(subtotal).toBeCloseTo(unitPrice * 3, 2)
  })
})
