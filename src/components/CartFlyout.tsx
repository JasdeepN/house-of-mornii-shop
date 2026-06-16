import { Link } from 'react-router-dom'
import { Trash, Plus, Minus, ShoppingBag } from '@phosphor-icons/react'
import { useCart } from '@/context/CartContext'
import { formatMoney, flattenEdges } from '@/lib/shopify'
import type { ShopifyCartLine } from '@/lib/shopify'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FreeShippingBar } from '@/components/FreeShippingBar'
import { useCallback, useRef, useEffect } from 'react'
import { isValidCheckoutUrl } from '@/lib/cart'

function FlyoutLineItem({
  line,
  onClose,
}: {
  line: ShopifyCartLine
  onClose: () => void
}) {
  const { updateLineItem, removeLineItem, isLoading } = useCart()
  const variant = line.merchandise
  const image = variant.image

  // Debounced quantity update to prevent rapid state updates
  const updateQuantity = useCallback((newQuantity: number) => {
    if (newQuantity <= 0) {
      removeLineItem(line.id)
    } else if (newQuantity === 1) {
      updateLineItem(line.id, 1)
    } else {
      updateLineItem(line.id, newQuantity)
    }
  }, [line.id, updateLineItem, removeLineItem])

  // Debounce handler for rapid clicks
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingQuantityRef = useRef(line.quantity)

  useEffect(() => {
    pendingQuantityRef.current = line.quantity
  }, [line.quantity])

  const handleQuantityChange = useCallback((delta: number) => {
    pendingQuantityRef.current = Math.max(0, pendingQuantityRef.current + delta)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const nextQuantity = pendingQuantityRef.current
      debounceRef.current = null
      updateQuantity(nextQuantity)
    }, 300) // 300ms debounce delay
  }, [updateQuantity])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div
      data-testid="cart-item"
      className="flex gap-3 py-4 border-b"
      style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}
      role="listitem"
      aria-label={`${variant.product.title}, quantity ${line.quantity}`}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-sm overflow-hidden">
        {image ? (
          <img
            src={`${image.url}&width=128`}
            alt={image.altText || variant.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'oklch(0.20 0.03 210)' }}
          >
            <ShoppingBag size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <Link
            to={`/products/${variant.product.handle}`}
            onClick={onClose}
            className="text-xs tracking-widest hover:text-accent transition-colors line-clamp-1"
            aria-label={`View details for ${variant.product.title}`}
          >
            {variant.product.title}
          </Link>
          {variant.title !== 'Default Title' && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {variant.title}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          {/* Quantity */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={isLoading}
              className="w-6 h-6 flex items-center justify-center rounded-sm border border-foreground/20 hover:border-accent transition-colors disabled:opacity-40"
              aria-label={`Decrease quantity for ${variant.product.title}`}
            >
              <Minus size={10} weight="bold" />
            </button>
            <span 
              className="text-xs tracking-widest w-5 text-center" 
              role="status"
              aria-live="polite"
            >
              {line.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={isLoading}
              className="w-6 h-6 flex items-center justify-center rounded-sm border border-foreground/20 hover:border-accent transition-colors disabled:opacity-40"
              aria-label={`Increase quantity for ${variant.product.title}`}
            >
              <Plus size={10} weight="bold" />
            </button>
          </div>

          {/* Price + Remove */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs tracking-wider"
              style={{ color: 'oklch(0.60 0.11 78)' }}
            >
              {formatMoney(line.cost.totalAmount)}
            </span>
            <button
              onClick={() => removeLineItem(line.id)}
              disabled={isLoading}
              className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
              aria-label={`Remove ${variant.product.title} from cart`}
            >
              <Trash size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartFlyout() {
  const { cart, isLoading, itemCount, isCartOpen, setCartOpen } = useCart()
  const lines = cart ? flattenEdges(cart.lines) : []
  const isEmpty = !cart || lines.length === 0
  const canCheckout = cart ? isValidCheckoutUrl(cart.checkoutUrl) : false

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        data-testid="cart-flyout"
        side="right"
        className="flex flex-col w-full sm:max-w-[420px] p-0"
        style={{
          background: 'oklch(0.16 0.03 210 / 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid oklch(1 0 0 / 0.10)',
        }}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}>
          <SheetTitle className="text-lg tracking-[0.15em] flex items-center gap-3">
            Your Bag
            {itemCount > 0 && (
              <span
                className="text-[11px] tracking-widest font-normal"
                style={{ color: 'oklch(0.60 0.11 78)' }}
              >
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Shopping bag contents
          </SheetDescription>
        </SheetHeader>

        {isEmpty ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6" role="status">
            <ShoppingBag size={40} weight="thin" className="text-muted-foreground" />
            <p className="text-muted-foreground text-sm tracking-widest">
              Your bag is empty.
            </p>
            <Link
              to="/collections"
              onClick={() => setCartOpen(false)}
              className="text-xs tracking-[0.2em] uppercase transition-colors hover:text-accent hover:underline underline-offset-4"
              style={{ color: 'oklch(0.75 0.05 78)' }}
            >
              BROWSE COLLECTIONS →
            </Link>
          </div>
        ) : (
          <>
            {/* Line items */}
            <ScrollArea className="flex-1 px-6" role="list" aria-label="Cart items">
              {lines.map((line) => (
                <FlyoutLineItem
                  key={line.id}
                  line={line}
                  onClose={() => setCartOpen(false)}
                />
              ))}
            </ScrollArea>

            {/* Footer */}
            <SheetFooter className="px-6 pt-4 pb-6 border-t flex-col gap-3" style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}>
              <FreeShippingBar subtotalAmount={cart.cost.subtotalAmount.amount} className="w-full mb-1" />

              {/* Subtotal */}
              <div className="flex items-center justify-between w-full">
                <span className="text-sm tracking-widest">SUBTOTAL</span>
                <span
                  className="text-sm tracking-wider font-semibold"
                  style={{ color: 'oklch(0.60 0.11 78)' }}
                >
                  {formatMoney(cart.cost.subtotalAmount)}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground w-full">
                Taxes and shipping calculated at checkout.
              </p>

              {/* Checkout */}
              {canCheckout ? (
                <a
                  data-testid="checkout-button"
                  href={cart.checkoutUrl}
                  className={`block w-full text-center py-3.5 rounded-sm tracking-[0.2em] text-sm font-semibold transition-all duration-300 ${
                    isLoading ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'
                  }`}
                  style={{
                    background: 'oklch(0.60 0.11 78)',
                    color: 'oklch(0.15 0.02 210)',
                  }}
                >
                  PROCEED TO CHECKOUT
                </a>
              ) : (
                <div
                  data-testid="checkout-button"
                  aria-disabled="true"
                  className="block w-full text-center py-3.5 rounded-sm tracking-[0.2em] text-sm font-semibold opacity-50 pointer-events-none"
                  style={{
                    background: 'oklch(0.60 0.11 78)',
                    color: 'oklch(0.15 0.02 210)',
                  }}
                >
                  PROCEED TO CHECKOUT
                </div>
              )}

              {/* Continue shopping */}
              <button
                onClick={() => setCartOpen(false)}
                className="text-xs tracking-widest text-muted-foreground hover:text-accent transition-colors w-full text-center"
              >
                ← CONTINUE SHOPPING
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
