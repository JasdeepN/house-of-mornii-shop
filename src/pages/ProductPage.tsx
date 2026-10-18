import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { sanitizeRichText } from '@/lib/sanitize-html'
import { useProduct, useRelatedProducts, formatMoney, formatDisplayPrice, defaultVariant } from '@/lib/shopify'
import type { Variant } from '@/lib/shopify'
import { useErrorHandler } from '@/lib/errorHandler'
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
import { luxuryEase } from '@/lib/animations'

/** The Collection's title for the breadcrumb: the Product's own when it is that Collection, else the handle read as words. */
function cameFromTitle(handle: string, primary: { handle: string; title: string } | null): string {
  if (primary?.handle === handle) return primary.title.toUpperCase()
  return decodeURIComponent(handle).replace(/-/g, ' ').toUpperCase()
}

export function ProductPage() {
  const { handle } = useParams()
  const location = useLocation()
  const { data: product, isLoading, error } = useProduct(handle ?? '')
  const errorDisplay = useErrorHandler(error)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
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
    return product ? defaultVariant(product) : null
  }, [product, selectedVariant])

  // Parent collection — used to add a real middle breadcrumb level instead of skipping straight to the product
  const primaryCollection = product?.primaryCollection ?? null

  // A card passes the list it came from so the breadcrumb returns there with its filters.
  const from = (location.state as { from?: unknown } | null)?.from
  const cameFrom = typeof from === 'string' && (from.startsWith('/shop') || from.startsWith('/collections/')) ? from : null
  const cameFromCollectionHandle = cameFrom?.startsWith('/collections/') ? cameFrom.slice('/collections/'.length).split(/[?#/]/)[0] : null

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
        price: product.price.min.amount,
        currency: product.price.min.currencyCode,
      })
    }
  }, [product?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { products: relatedProducts } = useRelatedProducts(product)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"
          />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Loading...
          </span>
        </div>
      </div>
    )
  }

  if (errorDisplay) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-16 flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-20 text-center max-w-lg">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-[0.15em] mb-4 text-foreground">
            {errorDisplay.title}
          </h1>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            {errorDisplay.message}
          </p>
          {errorDisplay.showRetry && (
            <button
              onClick={() => window.location.reload()}
              className="min-h-11 px-6 py-2.5 text-sm tracking-[0.2em] uppercase border border-border text-foreground hover:bg-muted transition-colors"
            >
              Try Again
            </button>
          )}
          {!errorDisplay.showRetry && (
            <Link
              to="/collections"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase text-primary hover:opacity-80 transition-opacity"
            >
              <span>&larr;</span> Browse Collections
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-16 flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-20 text-center max-w-lg">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-[0.15em] mb-4 text-foreground">
            Product Not Found
          </h1>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            This piece may no longer be available.
          </p>
          <Link
            to="/collections"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm tracking-[0.2em] uppercase text-primary hover:opacity-80 transition-opacity"
          >
            <span>&larr;</span> Browse Collections
          </Link>
        </div>
      </div>
    )
  }

  const compareAtPrice = activeVariant?.compareAtPrice

  const listCrumbs: { label: string; to: string }[] = cameFrom
    ? [{ label: cameFromCollectionHandle ? cameFromTitle(cameFromCollectionHandle, primaryCollection) : 'SHOP', to: cameFrom }]
    : [
        { label: 'COLLECTIONS', to: '/collections' },
        ...(primaryCollection
          ? [{ label: primaryCollection.title.toUpperCase(), to: `/collections/${primaryCollection.handle}` }]
          : []),
      ]

  return (
    <div className="min-h-screen pt-8 pb-16">
      <JsonLd data={productSchema(product)} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: `${window.location.origin}/` },
        { name: 'Collections', url: `${window.location.origin}/collections` },
        ...(primaryCollection
          ? [{ name: primaryCollection.title, url: `${window.location.origin}/collections/${primaryCollection.handle}` }]
          : []),
        { name: product.title, url: `${window.location.origin}/products/${product.handle}` },
      ])} />
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb
          items={[
            { label: 'HOME', to: '/' },
            ...listCrumbs,
            { label: product.title.toUpperCase() },
          ]}
          className="mb-8"
        />

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: luxuryEase }}
            className="min-w-0"
          >
            <ProductGallery images={product.images} title={product.title} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease: luxuryEase }}
            className="flex min-w-0 flex-col gap-6"
          >
            {/* Vendor */}
            {product.vendor && (
              <span
                className="text-xs tracking-[0.3em] uppercase text-muted-foreground"
              >
                {product.vendor}
              </span>
            )}

            <h1 className="text-3xl lg:text-4xl tracking-[0.12em] [overflow-wrap:anywhere]">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-2xl tracking-wider text-foreground"
              >
                {activeVariant ? formatMoney(activeVariant.price) : formatDisplayPrice(product.price)}
              </span>
              {compareAtPrice && (
                <span className="text-base text-muted-foreground line-through">
                  {formatMoney(compareAtPrice)}
                </span>
              )}
            </div>

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
                className="prose prose-sm max-w-none mt-4 break-words [overflow-wrap:anywhere] text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.descriptionHtml) }}
              />
            )}
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: luxuryEase }}
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
                  transition={{ duration: 0.3, delay: 0.1 * i, ease: luxuryEase }}
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
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/90 backdrop-blur-md border-t border-border shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm tracking-widest truncate">{product.title}</p>
                <p
                  className="text-sm tracking-wider text-foreground"
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
