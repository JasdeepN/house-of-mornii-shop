import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Spinner } from '@phosphor-icons/react'
import { useCart } from '@/context/CartContext'

interface AddToCartButtonProps {
  variantId: string
  availableForSale: boolean
  className?: string
}

export function AddToCartButton({
  variantId,
  availableForSale,
  className,
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
        className={`w-full tracking-[0.2em] text-sm py-6 ${className ?? ''}`}
      >
        SOLD OUT
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isAdding}
      className={`w-full bg-accent text-accent-foreground hover:bg-accent/90 tracking-[0.2em] text-sm py-6 group ${className ?? ''}`}
    >
      {isAdding ? (
        <Spinner size={18} className="animate-spin mr-2" />
      ) : (
        <ShoppingBag size={18} weight="bold" className="mr-2 group-hover:animate-pulse" />
      )}
      {isAdding ? 'ADDING...' : 'ADD TO BAG'}
    </Button>
  )
}
