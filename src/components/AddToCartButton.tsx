import { useState } from 'react'
import { ShoppingBag, Spinner } from '@phosphor-icons/react'
import { useCart } from '@/context/CartContext'
import { trackAddToCart } from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  variantId: string
  availableForSale: boolean
  productTitle: string
  productPrice: string
  currencyCode?: string
  className?: string
  compact?: boolean
}

export function AddToCartButton({
  variantId,
  availableForSale,
  productTitle,
  productPrice,
  currencyCode,
  className,
  compact,
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleClick = async () => {
    setIsAdding(true)
    trackAddToCart({
      id: variantId,
      name: productTitle,
      price: productPrice,
      quantity: 1,
      currency: currencyCode,
    })
    try {
      await addToCart(variantId)
    } catch (err) {
      logger.error('Failed to add item to cart', {
        component: 'AddToCartButton',
        variantId,
        action: 'addToCart',
      })
      toast.error('Failed to add item. Please try again.')
      setIsAdding(false)
    }
  }

  if (!availableForSale) {
    return (
      <button
        disabled
        className={`pill-btn pill-btn--cta ${compact ? 'text-xs px-4 py-2' : 'w-full py-4 text-sm justify-center'} ${className ?? ''}`}
      >
        SOLD OUT
      </button>
    )
  }

  return (
    <button
      data-testid="add-to-cart"
      onClick={handleClick}
      disabled={isAdding || !availableForSale}
      className={`pill-btn pill-btn--cta ${compact ? 'text-xs px-4 py-2' : 'w-full py-4 text-sm justify-center'} ${className ?? ''}`}
    >
      {isAdding ? (
        <>
          <Spinner size={compact ? 14 : 18} className="animate-spin mr-2" />
          ADDING...
        </>
      ) : compact ? (
        <>
          <ShoppingBag size={compact ? 14 : 18} weight="bold" className="mr-2" />
          ADD
        </>
      ) : (
        <>
          <ShoppingBag size={compact ? 14 : 18} weight="bold" className="mr-2" />
          ADD TO BAG
        </>
      )}
    </button>
  )
}
