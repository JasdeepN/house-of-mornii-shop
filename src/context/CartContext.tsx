import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { shopifyFetch } from '@/lib/shopify/client'
import { logger } from '@/lib/logger'
import {
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION,
} from '@/lib/shopify/queries'
import type { ShopifyCart } from '@/lib/shopify/types'
import { toast } from 'sonner'
import { useCustomerAuth } from './CustomerAuthContext'

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

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartOpen, setCartOpen] = useState(false)
  const { isAuthenticated, accessToken } = useCustomerAuth()

  const openCart = useCallback(() => setCartOpen(true), [])

  // Restore cart from localStorage on mount
  useEffect(() => {
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
            logger.error('Failed to restore cart', {
              action: 'restoreCart',
              error: error instanceof Error ? error.message : String(error),
            })
            toast.error('Failed to load your cart. Please refresh the page.')
            localStorage.removeItem(CART_ID_KEY)
          })
          .finally(() => setIsLoading(false))
      }
    } catch (error) {
      logger.error('Failed to restore cart', {
        action: 'restoreCart',
        error: error instanceof Error ? error.message : String(error),
      })
      toast.error('Failed to load your cart. Please refresh the page.')
      // Reset to empty cart state on localStorage error
    }
  }, [])

  // Cart merge: when customer authenticates, merge anonymous cart into their account cart
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const savedCartId = localStorage.getItem(CART_ID_KEY)
    if (!savedCartId) return

    setIsLoading(true)
    shopifyFetch<{
      cartBuyerIdentityUpdate: {
        cart: ShopifyCart
        userErrors: { message: string }[]
      }
    }>(CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION, {
      cartId: savedCartId,
      customerAccessToken: accessToken,
    })
      .then((data) => {
        const updated = data.cartBuyerIdentityUpdate.cart
        if (updated) {
          setCart(updated)
        }
        // Clear the anonymous cart ID — it's now associated with the customer's account
        localStorage.removeItem(CART_ID_KEY)
      })
      .catch((error) => {
        logger.error('Failed to merge cart', {
          action: 'mergeCart',
          error: error instanceof Error ? error.message : String(error),
        })
        // Don't show error toast for merge failures — non-critical.
        // Clear the stale anonymous cart ID so we don't retry a merge
        // against a cart that may no longer be valid.
        localStorage.removeItem(CART_ID_KEY)
      })
      .finally(() => setIsLoading(false))
  }, [isAuthenticated, accessToken])

  // ── Add to Cart ──────────────────────────────────────────────────────────

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true)
      try {
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
