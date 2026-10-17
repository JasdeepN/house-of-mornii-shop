import { useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretDown, Funnel } from '@phosphor-icons/react'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useCollections, useProductListing, parseProductSort, PRODUCT_SORTS, type ProductSort } from '@/lib/shopify'
import { isServiceError as checkIsServiceError, useErrorHandler } from '@/lib/errorHandler'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { ProductGrid } from '@/components/ProductGrid'
import { fadeSlideUp, luxuryEase, viewportOnce } from '@/lib/animations'
import { useSEO } from '@/hooks/useSEO'
import { trackViewItemList } from '@/lib/analytics'

// PROTOTYPE: Shop All design variants on ?variant=A-E. Only in development builds and builds made with
// VITE_PROTOTYPES=true (the dev deploy); production builds leave it out.
const ShopPrototype = import.meta.env.DEV || import.meta.env.VITE_PROTOTYPES === 'true'
  ? lazy(() => import('@/pages/shop-prototype/ShopPrototype').then((m) => ({ default: m.ShopPrototype })))
  : null

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = parseProductSort(searchParams.get('sort'))
  const collectionFilter = searchParams.get('collection') || ''

  const { data: collections } = useCollections()
  // PROTOTYPE: load every Product while a design variant is shown, so counts and patterns are complete
  const prototyping = Boolean(ShopPrototype && searchParams.get('variant'))
  const listing = useProductListing({
    collection: collectionFilter || undefined,
    sort,
    pageSize: prototyping ? 50 : 12,
  })
  const errorDisplay = useErrorHandler(listing.error)
  const loading = listing.isLoading

  useSEO({
    title: 'Shop All',
    description: 'Explore our full collection of heritage-inspired costume jewellery. Everyday elegance, festive pieces, and bridal grandeur.',
  })

  const activeSort = sort ?? 'best-selling'
  const activeSortLabel = PRODUCT_SORTS.find((o) => o.value === activeSort)?.label ?? 'Best Selling'

  const handleSort = useCallback((next: ProductSort) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'best-selling') params.delete('sort')
    else params.set('sort', next)
    params.delete('reverse')
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  const handleCollectionFilter = useCallback((handle: string) => {
    const params = new URLSearchParams(searchParams)
    if (handle) params.set('collection', handle)
    else params.delete('collection')
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  const trackedProducts = useMemo(() => {
    return listing.products.slice(0, 12).map((product) => ({
      id: product.id,
      name: product.title,
      price: product.price.min.amount,
    }))
  }, [listing.products])

  // Track view_item_list when products load
  useEffect(() => {
    if (trackedProducts.length > 0) {
      trackViewItemList(collectionFilter || 'Shop All', trackedProducts)
    }
  }, [collectionFilter, trackedProducts])

  const isServiceError = checkIsServiceError(listing.error)

  if (ShopPrototype && searchParams.get('variant')) {
    return (
      <Suspense fallback={null}>
        <ShopPrototype
          products={listing.products}
          collections={collections ?? []}
          loading={loading}
          sort={sort}
          onSort={handleSort}
          canLoadMore={listing.hasMore}
          loadingMore={listing.isLoadingMore}
          onLoadMore={listing.loadMore}
        />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-6 lg:px-20">
          <PageBreadcrumb
            items={[{ label: 'HOME', to: '/' }, { label: 'SHOP' }]}
            className="mb-10"
          />

          {/* Hero title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl tracking-[0.15em] flex flex-wrap items-center justify-center gap-x-4">
              Shop All
            </h1>
          </div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.4, ease: luxuryEase }}
          >
            <OrnamentalDivider className="mb-12" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2, duration: 0.3, ease: luxuryEase }}
            className="text-center text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-16"
          >
            Explore our full collection of heritage-inspired jewellery.
          </motion.p>

        {/* Toolbar: Sort + Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: luxuryEase }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          {/* Collection filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Funnel size={14} weight="bold" className="text-muted-foreground mr-1" />
            <button
              onClick={() => handleCollectionFilter('')}
              className={`pill-btn${!collectionFilter ? ' pill-btn--active' : ''}`}
            >
              All
            </button>
            {collections?.filter(Boolean).map((col) => (
              <button
                key={col.handle}
                onClick={() => handleCollectionFilter(col.handle)}
                className={`pill-btn${collectionFilter === col.handle ? ' pill-btn--active' : ''}`}
              >
                {col.title || col.handle}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative group">
            <button className="pill-btn">
              Sort: {activeSortLabel}
              <CaretDown size={12} weight="bold" />
            </button>
            <div
              className="absolute right-0 mt-1 w-52 rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 py-1"
              style={{
                background: 'oklch(0.18 0.03 210 / 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid oklch(1 0 0 / 0.14)',
                boxShadow: '0 8px 32px oklch(0 0 0 / 0.5)',
              }}
            >
              {PRODUCT_SORTS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSort(option.value)}
                  className={`block w-full text-left px-4 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                    activeSort === option.value
                      ? ''
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={
                    activeSort === option.value
                      ? { color: 'oklch(0.60 0.11 78)' }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground tracking-widest animate-pulse">
              Loading products...
            </p>
          </div>
        ) : isServiceError ? (
          <div style={{ padding: '1rem', color: '#a6a6a6', textAlign: 'center' }}>
            {errorDisplay?.message ?? 'Unable to fetch products.'}
          </div>
        ) : listing.products.length > 0 ? (
          <>
            <ProductGrid products={listing.products} />
            {listing.hasMore && (
              <div className="text-center mt-12">
                <button
                  className="pill-btn"
                  onClick={listing.loadMore}
                  disabled={listing.isLoadingMore}
                >
                  {listing.isLoadingMore ? 'LOADING...' : 'LOAD MORE'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground tracking-widest mb-4">
              No products found.
            </p>
            {collectionFilter && (
              <button
                className="pill-btn"
                onClick={() => handleCollectionFilter('')}
              >
                CLEAR FILTER
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
