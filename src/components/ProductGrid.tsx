import { ProductCard } from '@/components/ProductCard'
import type { ShopifyProduct } from '@/lib/shopify'

interface ProductGridProps {
  products: ShopifyProduct[]
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
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${className ?? ''}`}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}
