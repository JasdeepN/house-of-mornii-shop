import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Spinner } from '@phosphor-icons/react'
import { useCart } from '@/context/CartContext'

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
    await addToCart(variantId)
    setIsAdding(false)
  }

  if (!availableForSale) {
    return (
      <Button
        disabled
        className={`${compact ? 'px-4 py-2 text-xs' : 'w-full py-6 text-sm'} tracking-[0.2em] ${className ?? ''}`}
      >
        SOLD OUT
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isAdding}
      className={`${compact ? 'px-4 py-2 text-xs' : 'w-full py-6 text-sm'} bg-accent text-accent-foreground hover:bg-accent/90 tracking-[0.2em] group ${className ?? ''}`}
    >
      {isAdding ? (
        <Spinner size={compact ? 14 : 18} className="animate-spin mr-2" />
      ) : (
        <ShoppingBag size={compact ? 14 : 18} weight="bold" className="mr-2 group-hover:animate-pulse" />
      )}
      {isAdding ? 'ADDING...' : compact ? 'ADD' : 'ADD TO BAG'}
    </Button>
  )
}
