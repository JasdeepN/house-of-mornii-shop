import { useState } from 'react'
import { ShoppingBag, Spinner } from '@phosphor-icons/react'
import { useCart } from '@/context/CartContext'
import { trackAddToCart } from '@/lib/analytics'

interface AddToCartButtonProps {
  variantId: string
  availableForSale: boolean
  className?: string
  compact?: boolean
}

export function AddToCartButton({
  variantId,
  availableForSale,
  className,
  compact,
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleClick = async () => {
    setIsAdding(true)
    trackAddToCart({ id: variantId, name: variantId, price: '0', quantity: 1 })
    await addToCart(variantId)
    setIsAdding(false)
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
      onClick={handleClick}
      disabled={isAdding}
      className={`pill-btn pill-btn--cta ${compact ? 'text-xs px-4 py-2' : 'w-full py-4 text-sm justify-center'} ${className ?? ''}`}
    >
      {isAdding ? (
        <Spinner size={compact ? 14 : 18} className="animate-spin mr-2" />
      ) : (
        <ShoppingBag size={compact ? 14 : 18} weight="bold" className="mr-2" />
      )}
      {isAdding ? 'ADDING...' : compact ? 'ADD' : 'ADD TO BAG'}
    </button>
  )
}
