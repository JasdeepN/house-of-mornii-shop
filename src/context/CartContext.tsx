import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { shopifyFetch } from '@/lib/shopify/client'
import {
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from '@/lib/shopify/queries'
import type { ShopifyCart } from '@/lib/shopify/types'
import { toast } from 'sonner'

const CART_ID_KEY = 'hom-cart-id'

interface CartContextValue {
  cart: ShopifyCart | null
  isLoading: boolean
  itemCount: number
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  updateLineItem: (lineId: string, quantity: number) => Promise<void>
  removeLineItem: (lineId: string) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Restore cart from localStorage on mount
  useEffect(() => {
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
            // Cart expired or was completed — clear it
            localStorage.removeItem(CART_ID_KEY)
          }
        })
        .catch(() => {
          localStorage.removeItem(CART_ID_KEY)
        })
        .finally(() => setIsLoading(false))
    }
  }, [])

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true)
      try {
        if (!cart) {
          // Create new cart
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
          // Add to existing cart
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add item')
      } finally {
        setIsLoading(false)
      }
    },
    [cart]
  )

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
          err instanceof Error ? err.message : 'Failed to update item'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [cart]
  )

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
        toast.success('Removed from cart')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to remove item'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [cart]
  )

  const itemCount = cart?.totalQuantity ?? 0

  return (
    <CartContext.Provider
      value={{ cart, isLoading, itemCount, addToCart, updateLineItem, removeLineItem }}
    >
      {children}
    </CartContext.Provider>
  )
}
