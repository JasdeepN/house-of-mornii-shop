import { useProduct, formatMoney } from '@/lib/shopify'
import type { ProductSummary, Variant } from '@/lib/shopify'
import { useCart } from '@/context/CartContext'
import { trackAddToCart } from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface QuickAddDialogProps {
  product: ProductSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Lets a Shopper pick a Variant of a Product with several, then adds it to the Cart. */
export function QuickAddDialog({ product, open, onOpenChange }: QuickAddDialogProps) {
  const { addToCart, openCart } = useCart()
  const { data, isLoading, error } = useProduct(open ? product.handle : '')

  const choose = async (variant: Variant) => {
    trackAddToCart({
      id: variant.id,
      name: product.title,
      price: variant.price.amount,
      quantity: 1,
      currency: variant.price.currencyCode,
    })
    onOpenChange(false)
    try {
      await addToCart(variant.id)
      openCart()
    } catch {
      logger.error('Failed to add item to cart', { component: 'QuickAddDialog', variantId: variant.id, action: 'addToCart' })
      toast.error('Failed to add item. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">Choose an option</DialogTitle>
          <DialogDescription className="text-muted-foreground">{product.title}</DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-muted-foreground" role="status">Loading options...</p>}
        {(error || (data === null && !isLoading)) && (
          <p className="text-foreground" role="alert">Unable to load the options. Please try again.</p>
        )}

        {data && (
          <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
            {data.variants.map((variant) => (
              <li key={variant.id}>
                <button
                  type="button"
                  disabled={!variant.availableForSale}
                  onClick={() => choose(variant)}
                  className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-background"
                >
                  <span className="font-medium">{variant.title}</span>
                  <span className="flex items-baseline gap-2 text-right">
                    {variant.availableForSale ? (
                      <>
                        <span className="font-bold">{formatMoney(variant.price)}</span>
                        {variant.compareAtPrice && (
                          <span className="text-muted-foreground line-through">{formatMoney(variant.compareAtPrice)}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">{formatMoney(variant.price)}</span>
                        <span className="font-bold">Sold out</span>
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
