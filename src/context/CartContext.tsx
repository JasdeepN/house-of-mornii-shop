import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { IS_CONFIGURED } from '@/lib/shopify/client'
import { shopifyFetch } from '@/lib/shopify/client'
import {
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from '@/lib/shopify/queries'
import { getDemoProduct, getDemoProducts } from '@/lib/shopify/demo-data'
import type { ShopifyCart, ShopifyCartLine } from '@/lib/shopify/types'
import { toast } from 'sonner'

const CART_ID_KEY = 'hom-cart-id'

interface CartContextValue {
  cart: ShopifyCart | null
  isLoading: boolean
  itemCount: number
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
  openCart: () => void
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  updateLineItem: (lineId: string, quantity: number) => Promise<void>
  removeLineItem: (lineId: string) => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}

// ─── Demo Cart helpers ───────────────────────────────────────────────────────

let _demoLineId = 0

function buildDemoCart(lines: ShopifyCartLine[]): ShopifyCart {
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)
  const subtotal = lines.reduce(
    (sum, l) => sum + parseFloat(l.cost.totalAmount.amount),
    0,
  )
  return {
    id: 'demo-cart',
    checkoutUrl: '#',
    totalQuantity,
    lines: { edges: lines.map((l) => ({ node: l })) },
    cost: {
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: 'CAD' },
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: 'CAD' },
      totalTaxAmount: null,
    },
  }
}

function makeDemoLine(variantId: string, quantity: number): ShopifyCartLine | null {
  const allProducts = getDemoProducts()

  // Try to find by variant id first, then treat variantId as a handle
  let product = allProducts.find(
    (p) => p.variants.edges.some((e) => e.node.id === variantId),
  )
  if (!product) {
    product = getDemoProduct(variantId) ?? undefined
  }
  if (!product) return null

  const variant = product.variants.edges[0].node
  const price = variant.price

  return {
    id: `demo-line-${++_demoLineId}`,
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

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartOpen, setCartOpen] = useState(false)

  const openCart = useCallback(() => setCartOpen(true), [])

  // Restore cart from localStorage on mount (Shopify mode only)
  useEffect(() => {
    if (!IS_CONFIGURED) return
    try {
      const savedCartId = localStorage.getItem(CART_ID_KEY)
      if (savedCartId) {
        setIsLoading(true)
        shopifyFetch<{ cart: ShopifyCart | null }>(CART_QUERY, {
          cartId: savedCartId,
        })
          .then((data) => {
            if (data.cart) {
              setCart(data.cart)
            } else {
              localStorage.removeItem(CART_ID_KEY)
            }
          })
          .catch((error) => {
            console.error('Failed to restore cart:', error)
            toast.error('Failed to load your cart. Please refresh the page.')
            localStorage.removeItem(CART_ID_KEY)
          })
          .finally(() => setIsLoading(false))
      }
    } catch (error) {
      console.error('Failed to restore cart:', error)
      toast.error('Failed to load your cart. Please refresh the page.')
      // Reset to empty cart state on localStorage error
    }
  }, [])

  // ── Add to Cart ──────────────────────────────────────────────────────────

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true)
      try {
        if (!IS_CONFIGURED) {
          // Demo mode: in-memory cart
          const currentLines = cart
            ? cart.lines.edges.map((e) => e.node)
            : []

          // Check if variant already in cart
          const existing = currentLines.find(
            (l) => l.merchandise.id === variantId,
          )
          let updatedLines: ShopifyCartLine[]

          if (existing) {
            updatedLines = currentLines.map((l) =>
              l.id === existing.id
                ? {
                    ...l,
                    quantity: l.quantity + quantity,
                    cost: {
                      ...l.cost,
                      totalAmount: {
                        amount: (
                          parseFloat(l.cost.amountPerQuantity.amount) *
                          (l.quantity + quantity)
                        ).toFixed(2),
                        currencyCode: l.cost.amountPerQuantity.currencyCode,
                      },
                    },
                  }
                : l,
            )
          } else {
            const newLine = makeDemoLine(variantId, quantity)
            if (!newLine) throw new Error('Product not found')
            updatedLines = [...currentLines, newLine]
          }

          setCart(buildDemoCart(updatedLines))
          toast.success('Added to cart')
          setCartOpen(true)
          return
        }

        // Shopify mode
        if (!cart) {
          const data = await shopifyFetch<{
            cartCreate: { cart: ShopifyCart; userErrors: { message: string }[] }
          }>(CART_CREATE_MUTATION, {
            lines: [{ merchandiseId: variantId, quantity }],
          })
          if (data.cartCreate.userErrors.length) {
            throw new Error(data.cartCreate.userErrors[0].message)
          }
          const newCart = data.cartCreate.cart
          setCart(newCart)
          localStorage.setItem(CART_ID_KEY, newCart.id)
        } else {
          const data = await shopifyFetch<{
            cartLinesAdd: {
              cart: ShopifyCart
              userErrors: { message: string }[]
            }
          }>(CART_LINES_ADD_MUTATION, {
            cartId: cart.id,
            lines: [{ merchandiseId: variantId, quantity }],
          })
          if (data.cartLinesAdd.userErrors.length) {
            throw new Error(data.cartLinesAdd.userErrors[0].message)
          }
          setCart(data.cartLinesAdd.cart)
        }
        toast.success('Added to cart')
        setCartOpen(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add item')
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  // ── Update Line Item ─────────────────────────────────────────────────────

  const updateLineItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return
      setIsLoading(true)
      try {
        if (!IS_CONFIGURED) {
          const updatedLines = cart.lines.edges
            .map((e) => e.node)
            .map((l) =>
              l.id === lineId
                ? {
                    ...l,
                    quantity,
                    cost: {
                      ...l.cost,
                      totalAmount: {
                        amount: (
                          parseFloat(l.cost.amountPerQuantity.amount) * quantity
                        ).toFixed(2),
                        currencyCode: l.cost.amountPerQuantity.currencyCode,
                      },
                    },
                  }
                : l,
            )
          setCart(buildDemoCart(updatedLines))
          return
        }

        const data = await shopifyFetch<{
          cartLinesUpdate: {
            cart: ShopifyCart
            userErrors: { message: string }[]
          }
        }>(CART_LINES_UPDATE_MUTATION, {
          cartId: cart.id,
          lines: [{ id: lineId, quantity }],
        })
        if (data.cartLinesUpdate.userErrors.length) {
          throw new Error(data.cartLinesUpdate.userErrors[0].message)
        }
        setCart(data.cartLinesUpdate.cart)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to update item',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  // ── Remove Line Item ─────────────────────────────────────────────────────

  const removeLineItem = useCallback(
    async (lineId: string) => {
      if (!cart) return
      setIsLoading(true)
      try {
        if (!IS_CONFIGURED) {
          const updatedLines = cart.lines.edges
            .map((e) => e.node)
            .filter((l) => l.id !== lineId)
          const newCart = updatedLines.length > 0 ? buildDemoCart(updatedLines) : null
          setCart(newCart)
          if (!newCart) {
            localStorage.removeItem(CART_ID_KEY)
          }
          toast.success('Removed from cart')
          return
        }

        const data = await shopifyFetch<{
          cartLinesRemove: {
            cart: ShopifyCart
            userErrors: { message: string }[]
          }
        }>(CART_LINES_REMOVE_MUTATION, {
          cartId: cart.id,
          lineIds: [lineId],
        })
        if (data.cartLinesRemove.userErrors.length) {
          throw new Error(data.cartLinesRemove.userErrors[0].message)
        }
        setCart(data.cartLinesRemove.cart)
        if (!data.cartLinesRemove.cart) {
          localStorage.removeItem(CART_ID_KEY)
        }
        toast.success('Removed from cart')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to remove item',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [cart],
  )

  // ── Clear Cart (for logout) ────────────────────────────────────────────────

  const clearCart = useCallback(() => {
    setCart(null)
    localStorage.removeItem(CART_ID_KEY)
  }, [])

  const itemCount = cart?.totalQuantity ?? 0

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        isCartOpen,
        setCartOpen,
        openCart,
        addToCart,
        updateLineItem,
        removeLineItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
