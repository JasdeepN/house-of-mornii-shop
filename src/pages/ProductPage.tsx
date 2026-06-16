import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProduct, useRelatedProducts, formatMoney, flattenEdges } from '@/lib/shopify'
import { StorefrontError } from '@/lib/shopify'
import type { ShopifyProductVariant } from '@/lib/shopify'
import { ProductGallery } from '@/components/ProductGallery'
import { VariantSelector } from '@/components/VariantSelector'
import { AddToCartButton } from '@/components/AddToCartButton'
import { TrustBadges } from '@/components/TrustBadges'
import { ProductCard } from '@/components/ProductCard'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { useSEO } from '@/hooks/useSEO'
import { trackViewItem } from '@/lib/analytics'
import { JsonLd, productSchema, breadcrumbSchema } from '@/components/JsonLd'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

export function ProductPage() {
  const { handle } = useParams()
  const { data: product, isLoading, error } = useProduct(handle ?? '')
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null)
  const [showStickyATC, setShowStickyATC] = useState(false)
  const atcRef = useRef<HTMLDivElement>(null)

  // Sticky mobile ATC — show when main ATC scrolls out of view
  useEffect(() => {
    const el = atcRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyATC(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [product])

  // Set initial variant once product loads
  const activeVariant = useMemo(() => {
    if (selectedVariant) return selectedVariant
    if (!product) return null
    const variants = product.variants.edges.map((e) => e.node)
    return variants[0] ?? null
  }, [product, selectedVariant])

  // SEO — dynamic per product
  useSEO({
    title: product?.title,
    description: product?.description,
    image: product?.featuredImage?.url,
    type: 'product',
  })

  // Analytics — track view_item on PDP load
  useEffect(() => {
    if (product) {
      trackViewItem({
        id: product.id,
        name: product.title,
        price: product.priceRange.minVariantPrice.amount,
        currency: product.priceRange.minVariantPrice.currencyCode,
      })
    }
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const images = useMemo(() => {
    if (!product) return []
    return flattenEdges(product.images)
  }, [product])

  // Related products — from the product's primary collection
  const collectionHandle = useMemo(() => {
    if (!product) return undefined
    const cols = (product as { collections?: { edges: { node: { handle: string; title: string } }[] } }).collections?.edges
    return cols?.[0]?.node?.handle as string | undefined
  }, [product])

  const { products: relatedProducts } = useRelatedProducts(collectionHandle, product?.id)

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

  if (error) {
    const isServiceError =
      error instanceof StorefrontError &&
      (error.category === 'upstream_unavailable' || error.category === 'misconfigured')
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          {isServiceError ? (
            <>
              <h1 className="text-4xl tracking-[0.15em] mb-4">Service Unavailable</h1>
              <p className="text-muted-foreground mb-8">
                We're having trouble loading this product. Please try again shortly.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-accent hover:underline tracking-widest text-sm"
              >
                TRY AGAIN
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    )
  }

  if (!product) {
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
      <JsonLd data={productSchema(product)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: `${window.location.origin}/` },
        { name: 'Collections', url: `${window.location.origin}/collections` },
        { name: product.title, url: `${window.location.origin}/products/${product.handle}` },
      ])} />
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb
          items={[
            { label: 'HOME', to: '/' },
            { label: 'COLLECTIONS', to: '/collections' },
            { label: product.title.toUpperCase() },
          ]}
          className="mb-8"
        />

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
            <div ref={atcRef}>
              {activeVariant && (
                <AddToCartButton
                  variantId={activeVariant.id}
                  availableForSale={activeVariant.availableForSale}
                  productTitle={product.title}
                  productPrice={activeVariant.price.amount}
                  currencyCode={activeVariant.price.currencyCode}
                />
              )}
            </div>

            {/* Trust Badges */}
            <TrustBadges variant="full" className="mt-2" />

            {/* Description */}
            {product.descriptionHtml && (
              <div
                className="prose prose-invert prose-sm max-w-none mt-4 text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl tracking-[0.15em] mb-3">
                You May Also Like
              </h2>
              <OrnamentalDivider />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((rp, i) => (
                <motion.div
                  key={rp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                >
                  <ProductCard product={rp} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Mobile ATC Bar */}
      <AnimatePresence>
        {showStickyATC && activeVariant && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
            style={{
              background: 'oklch(0.18 0.03 210 / 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderTop: '1px solid oklch(1 0 0 / 0.10)',
              boxShadow: '0 -4px 24px oklch(0 0 0 / 0.4)',
            }}
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm tracking-widest truncate">{product.title}</p>
                <p
                  className="text-sm tracking-wider"
                  style={{ color: 'oklch(0.60 0.11 78)' }}
                >
                  {formatMoney(activeVariant.price)}
                </p>
              </div>
              <AddToCartButton
                variantId={activeVariant.id}
                availableForSale={activeVariant.availableForSale}
                productTitle={product.title}
                productPrice={activeVariant.price.amount}
                currencyCode={activeVariant.price.currencyCode}
                compact
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
