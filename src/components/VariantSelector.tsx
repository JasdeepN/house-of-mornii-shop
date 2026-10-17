import type { Product, Variant } from '@/lib/shopify'
import { variantWithOption } from '@/lib/shopify'
import { cn } from '@/lib/utils'

interface VariantSelectorProps {
  product: Product
  selectedVariant: Variant | null
  onVariantChange: (variant: Variant) => void
}

export function VariantSelector({
  product,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  // If only one variant (default), don't render selector
  if (product.variants.length <= 1) return null

  return (
    <div className="flex flex-col gap-4">
      {product.options.map((option) => (
        <div key={option.name} className="flex flex-col gap-2">
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

              const candidate = variantWithOption(product, selectedVariant, option.name, value)
              const isAvailable = candidate?.availableForSale ?? false

              return (
                <button
                  key={value}
                  onClick={() => {
                    if (candidate) onVariantChange(candidate)
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
