import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretLeft } from '@phosphor-icons/react'
import { useProduct, formatMoney, flattenEdges } from '@/lib/shopify'
import type { ShopifyProductVariant } from '@/lib/shopify'
import { ProductGallery } from '@/components/ProductGallery'
import { VariantSelector } from '@/components/VariantSelector'
import { AddToCartButton } from '@/components/AddToCartButton'

export function ProductPage() {
  const { handle } = useParams()
  const { data: product, isLoading, error } = useProduct(handle ?? '')
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null)

  // Set initial variant once product loads
  const activeVariant = useMemo(() => {
    if (selectedVariant) return selectedVariant
    if (!product) return null
    const variants = product.variants.edges.map((e) => e.node)
    return variants[0] ?? null
  }, [product, selectedVariant])

  const images = useMemo(() => {
    if (!product) return []
    return flattenEdges(product.images)
  }, [product])

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'oklch(0.60 0.11 78)', borderTopColor: 'transparent' }}
          />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Loading...
          </span>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          <h1 className="text-4xl tracking-[0.15em] mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This piece may no longer be available.
          </p>
          <Link
            to="/collections"
            className="text-accent hover:underline tracking-widest text-sm"
          >
            &larr; BROWSE COLLECTIONS
          </Link>
        </div>
      </div>
    )
  }

  const compareAtPrice = activeVariant?.compareAtPrice
  const price = activeVariant?.price

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            to="/collections"
            className="inline-flex items-center gap-1 text-sm tracking-widest text-muted-foreground hover:text-accent transition-colors"
          >
            <CaretLeft size={14} weight="bold" />
            COLLECTIONS
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <ProductGallery images={images} title={product.title} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="flex flex-col gap-6"
          >
            {/* Vendor */}
            {product.vendor && (
              <span
                className="text-xs tracking-[0.3em] uppercase"
                style={{ color: 'oklch(0.60 0.11 78)' }}
              >
                {product.vendor}
              </span>
            )}

            <h1 className="text-3xl lg:text-4xl tracking-[0.12em]">
              {product.title}
            </h1>

            {/* Price */}
            {price && (
              <div className="flex items-baseline gap-3">
                <span
                  className="text-2xl tracking-wider"
                  style={{ color: 'oklch(0.60 0.11 78)' }}
                >
                  {formatMoney(price)}
                </span>
                {compareAtPrice && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatMoney(compareAtPrice)}
                  </span>
                )}
              </div>
            )}

            {/* Variant Selector */}
            <VariantSelector
              product={product}
              selectedVariant={activeVariant}
              onVariantChange={setSelectedVariant}
            />

            {/* Add to Cart */}
            {activeVariant && (
              <AddToCartButton
                variantId={activeVariant.id}
                availableForSale={activeVariant.availableForSale}
              />
            )}

            {/* Description */}
            {product.descriptionHtml && (
              <div
                className="prose prose-invert prose-sm max-w-none mt-4 text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
