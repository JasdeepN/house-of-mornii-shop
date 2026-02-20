import type { ShopifyProduct, ShopifyProductVariant } from '@/lib/shopify'
import { cn } from '@/lib/utils'

interface VariantSelectorProps {
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant | null
  onVariantChange: (variant: ShopifyProductVariant) => void
}

export function VariantSelector({
  product,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  const variants = product.variants.edges.map((e) => e.node)

  // If only one variant (default), don't render selector
  if (variants.length <= 1) return null

  return (
    <div className="flex flex-col gap-4">
      {product.options.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          <label
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: 'oklch(0.72 0.05 78)' }}
          >
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedVariant?.selectedOptions.some(
                (o) => o.name === option.name && o.value === value
              )

              // Find the variant matching this selection
              const matchingVariant = variants.find((v) =>
                v.selectedOptions.some(
                  (o) => o.name === option.name && o.value === value
                )
              )
              const isAvailable = matchingVariant?.availableForSale ?? false

              return (
                <button
                  key={value}
                  onClick={() => {
                    if (matchingVariant) onVariantChange(matchingVariant)
                  }}
                  disabled={!isAvailable}
                  className={cn(
                    'px-4 py-2 text-sm tracking-widest border rounded-sm transition-all duration-300',
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-foreground/20 text-muted-foreground hover:border-accent/50',
                    !isAvailable && 'opacity-30 cursor-not-allowed line-through'
                  )}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
