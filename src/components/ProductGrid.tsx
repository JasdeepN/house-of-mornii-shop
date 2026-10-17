import { ProductCard } from '@/components/ProductCard'
import type { ProductSummary } from '@/lib/shopify'

interface ProductGridProps {
  products: ProductSummary[]
  className?: string
}

export function ProductGrid({ products, className }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg tracking-widest">
          No products found in this collection.
        </p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-3 gap-[22px] max-[1100px]:grid-cols-2 max-[760px]:gap-3 ${className ?? ''}`}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}
