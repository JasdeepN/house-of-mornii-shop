import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretDown, Funnel } from '@phosphor-icons/react'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import {
  useProducts,
  useCollections,
  useCollection,
  shopifyFetch,
  IS_CONFIGURED,
  STOREFRONT_MODE,
  StorefrontError,
  getDemoProducts,
  PRODUCTS_QUERY,
  PRODUCTS_QUERY_TOKENLESS,
} from '@/lib/shopify'
import type { ShopifyProduct } from '@/lib/shopify'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { ProductGrid } from '@/components/ProductGrid'
import { fadeSlideUp, luxuryEase, viewportOnce } from '@/lib/animations'
import { useSEO } from '@/hooks/useSEO'
import { trackViewItemList } from '@/lib/analytics'

const SORT_OPTIONS = [
  { label: 'Best Selling', key: 'BEST_SELLING', reverse: false },
  { label: 'Newest', key: 'CREATED_AT', reverse: true },
  { label: 'Price: Low → High', key: 'PRICE', reverse: false },
  { label: 'Price: High → Low', key: 'PRICE', reverse: true },
  { label: 'A–Z', key: 'TITLE', reverse: false },
] as const

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sortKey = searchParams.get('sort') || 'BEST_SELLING'
  const reverse = searchParams.get('reverse') === 'true'
  const collectionFilter = searchParams.get('collection') || ''

  // Pagination state
  const [afterCursor, setAfterCursor] = useState<string | undefined>(undefined)
  const [loadedMore, setLoadedMore] = useState<ShopifyProduct[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMorePages, setHasMorePages] = useState(true)

  const { data: collections } = useCollections()
  const { data: productsData, isLoading: isAllLoading, error: productsError } = useProducts(sortKey, reverse)
  // When a collection filter is active, fetch that collection's products directly
  const { data: collectionData, isLoading: isCollectionLoading, error: collectionError } = useCollection(
    collectionFilter,
    50,
    sortKey,
    reverse,
  )

  const loading = collectionFilter ? isCollectionLoading : isAllLoading

  useSEO({
    title: 'Shop All',
    description: 'Explore our full collection of heritage-inspired costume jewellery. Everyday elegance, festive pieces, and bridal grandeur.',
  })

  // Find the active sort option label
  const activeSortLabel = useMemo(() => {
    const match = SORT_OPTIONS.find(
      (o) => o.key === sortKey && o.reverse === reverse,
    )
    return match?.label ?? 'Best Selling'
  }, [sortKey, reverse])

  const allProducts = useMemo(() => {
    if (!productsData) return []
    return productsData.edges.map((e) => e.node)
  }, [productsData])

  const handleSort = useCallback((key: string, rev: boolean) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', key)
    if (rev) params.set('reverse', 'true')
    else params.delete('reverse')
    setSearchParams(params, { replace: true })
    setAfterCursor(undefined)
    setLoadedMore([])
    setHasMorePages(true)
  }, [searchParams, setSearchParams])

  const handleCollectionFilter = useCallback((handle: string) => {
    const params = new URLSearchParams(searchParams)
    if (handle) params.set('collection', handle)
    else params.delete('collection')
    setSearchParams(params, { replace: true })
    setAfterCursor(undefined)
    setLoadedMore([])
    setHasMorePages(true)
  }, [searchParams, setSearchParams])

  const handleLoadMore = useCallback(async () => {
    const cursor = afterCursor || productsData?.pageInfo.endCursor
    if (!cursor) return
    setIsLoadingMore(true)
    try {
      if (!IS_CONFIGURED) {
        const items = getDemoProducts()
        const afterId = atob(cursor)
        const idx = items.findIndex((p) => p.id === afterId)
        const startIdx = idx >= 0 ? idx + 1 : 0
        const page = items.slice(startIdx, startIdx + 12)
        setLoadedMore((prev) => [...prev, ...page])
        if (startIdx + 12 >= items.length) {
          setHasMorePages(false)
        } else {
          setAfterCursor(btoa(page[page.length - 1].id))
        }
      } else {
        const data = await shopifyFetch<{
          products: {
            edges: { node: ShopifyProduct; cursor: string }[]
            pageInfo: { hasNextPage: boolean; endCursor: string | null }
          }
        }>(STOREFRONT_MODE === 'token' ? PRODUCTS_QUERY : PRODUCTS_QUERY_TOKENLESS, { first: 12, sortKey, reverse, after: cursor })
        const newProducts = data.products.edges.map((e) => e.node)
        setLoadedMore((prev) => [...prev, ...newProducts])
        setHasMorePages(data.products.pageInfo.hasNextPage)
        setAfterCursor(data.products.pageInfo.endCursor ?? undefined)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [productsData, afterCursor, sortKey, reverse])

  // Use collection-level fetch when filtered, otherwise show all products + loaded more
  const filteredProducts = useMemo(() => {
    if (!collectionFilter) return [...allProducts, ...loadedMore]
    if (!collectionData?.products) return []
    return collectionData.products.edges.map((e) => e.node)
  }, [collectionFilter, allProducts, collectionData, loadedMore])

  const trackedProducts = useMemo(() => {
    return filteredProducts.slice(0, 12).map((product) => ({
      id: product.id,
      name: product.title,
      price: product.priceRange.minVariantPrice.amount,
    }))
  }, [filteredProducts])

  // Track view_item_list when products load
  useEffect(() => {
    if (trackedProducts.length > 0) {
      trackViewItemList(collectionFilter || 'Shop All', trackedProducts)
    }
  }, [collectionFilter, trackedProducts])

  const activeError = collectionFilter ? collectionError : productsError
  const isServiceError =
    activeError instanceof StorefrontError &&
    (activeError.category === 'upstream_unavailable' ||
      activeError.category === 'misconfigured')

  const showLoadMore = !collectionFilter && hasMorePages && (productsData?.pageInfo.hasNextPage || loadedMore.length > 0)

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
            transition={{ delay: 0.7, duration: 0.8, ease: luxuryEase }}
          >
            <OrnamentalDivider className="mb-12" />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
            className="text-center text-lg lg:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-16"
          >
            Explore our full collection of heritage-inspired jewellery.
          </motion.p>

        {/* Toolbar: Sort + Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
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
            {collections?.map((col) => (
              <button
                key={col.handle}
                onClick={() => handleCollectionFilter(col.handle)}
                className={`pill-btn${collectionFilter === col.handle ? ' pill-btn--active' : ''}`}
              >
                {col.title}
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
              {SORT_OPTIONS.map((option) => (
                <button
                  key={`${option.key}-${option.reverse}`}
                  onClick={() => handleSort(option.key, option.reverse)}
                  className={`block w-full text-left px-4 py-2.5 text-[12px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                    sortKey === option.key && reverse === option.reverse
                      ? ''
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={
                    sortKey === option.key && reverse === option.reverse
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
          <div className="text-center py-20">
            <p className="text-muted-foreground tracking-widest mb-4">
              We're having trouble loading products right now. Please try again shortly.
            </p>
            <button
              className="pill-btn"
              onClick={() => window.location.reload()}
            >
              TRY AGAIN
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <ProductGrid products={filteredProducts} />
            {showLoadMore && (
              <div className="text-center mt-12">
                <button
                  className="pill-btn"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'LOADING...' : 'LOAD MORE'}
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
