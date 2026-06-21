import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import {
  useCollection,
  shopifyFetch,
  IS_CONFIGURED,
  getDemoCollection,
  COLLECTION_BY_HANDLE_QUERY,
} from '@/lib/shopify'
import { useErrorHandler } from '@/lib/errorHandler'
import type { ShopifyProduct } from '@/lib/shopify'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { ProductGrid } from '@/components/ProductGrid'
import { useSEO } from '@/hooks/useSEO'
import { trackViewItemList } from '@/lib/analytics'

const SORT_OPTIONS = [
  { label: 'Best Selling', key: 'BEST_SELLING', reverse: false },
  { label: 'Newest', key: 'CREATED', reverse: true },
  { label: 'Price: Low → High', key: 'PRICE', reverse: false },
  { label: 'Price: High → Low', key: 'PRICE', reverse: true },
  { label: 'A–Z', key: 'TITLE', reverse: false },
] as const

export function CollectionPage() {
  const { handle } = useParams<{ handle: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const sortKey = searchParams.get('sort') || undefined
  const reverse = searchParams.get('reverse') === 'true'
  const [loadedProducts, setLoadedProducts] = useState<ShopifyProduct[]>([])
  const [afterCursor, setAfterCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMorePages, setHasMorePages] = useState(true)

  const { data: collection, isLoading, error } = useCollection(handle ?? '', 12, sortKey, reverse)
  const errorDisplay = useErrorHandler(error)

  useSEO({
    title: collection?.title,
    description: collection?.description || `Shop the ${collection?.title || ''} collection from House of Mornii.`,
    image: collection?.image?.url,
  })

  const activeSortLabel = useMemo(() => {
    const match = SORT_OPTIONS.find(
      (o) => o.key === sortKey && o.reverse === reverse,
    )
    return match?.label ?? 'Featured'
  }, [sortKey, reverse])

  const handleSort = useCallback(
    (key: string, rev: boolean) => {
      const params = new URLSearchParams(searchParams)
      if (key) params.set('sort', key)
      else params.delete('sort')
      if (rev) params.set('reverse', 'true')
      else params.delete('reverse')
      setSearchParams(params, { replace: true })
      // Reset loaded-more products when sort changes
      setLoadedProducts([])
      setAfterCursor(undefined)
      setHasMorePages(true)
    },
    [searchParams, setSearchParams],
  )

  const handleLoadMore = useCallback(async () => {
    if (!handle || !collection) return
    const cursor = afterCursor || collection.products.pageInfo.endCursor
    if (!cursor) return
    setIsLoadingMore(true)
    try {
      if (!IS_CONFIGURED) {
        // Demo mode doesn't support real pagination, so hide the button
        setHasMorePages(false)
      } else {
        const data = await shopifyFetch<{
          collection: {
            products: {
              edges: { node: ShopifyProduct; cursor: string }[]
              pageInfo: { hasNextPage: boolean; endCursor: string | null }
            }
          }
        }>(COLLECTION_BY_HANDLE_QUERY, {
          handle,
          first: 12,
          sortKey,
          reverse,
          after: cursor,
        })
        const newProducts = data.collection.products.edges.map((e) => e.node)
        setLoadedProducts((prev) => [...prev, ...newProducts])
        setHasMorePages(data.collection.products.pageInfo.hasNextPage)
        setAfterCursor(data.collection.products.pageInfo.endCursor ?? undefined)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [handle, collection, afterCursor, sortKey, reverse])

  const baseProducts = collection?.products.edges.map((e) => e.node) ?? []
  const products = [...baseProducts, ...loadedProducts]
  const showLoadMore = !!collection && hasMorePages && collection.products.pageInfo.hasNextPage

  // Track view_item_list when collection products load.
  // Keep this before any conditional return so hook order stays stable.
  useEffect(() => {
    if (collection && products.length > 0) {
      trackViewItemList(
        collection.title,
        products.slice(0, 12).map((product) => ({
          id: product.id,
          name: product.title,
          price: product.priceRange.minVariantPrice.amount,
        })),
      )
    }
  }, [collection, products])

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center py-20">
          <p className="text-muted-foreground tracking-widest animate-pulse">
            Loading collection...
          </p>
        </div>
      </div>
    )
  }

  if (errorDisplay) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'oklch(0.18 0.03 210)' }}>
        <div className="container mx-auto px-6 lg:px-20 text-center max-w-lg">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto" style={{ color: 'oklch(0.65 0.02 78 / 0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-[0.15em] mb-4" style={{ color: 'oklch(0.92 0.01 78)' }}>{errorDisplay.title}</h1>
          <p className="mb-8 leading-relaxed" style={{ color: 'oklch(0.65 0.02 78 / 0.8)' }}>{errorDisplay.message}</p>
          {errorDisplay.showRetry && (
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 text-sm tracking-[0.2em] uppercase border" style={{ borderColor: 'oklch(0.60 0.11 78 / 0.4)', color: 'oklch(0.60 0.11 78)' }}>Try Again</button>
          )}
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'oklch(0.18 0.03 210)' }}>
        <div className="container mx-auto px-6 lg:px-20 text-center max-w-lg">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto" style={{ color: 'oklch(0.65 0.02 78 / 0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-[0.15em] mb-4" style={{ color: 'oklch(0.92 0.01 78)' }}>Collection Not Found</h1>
          <p className="mb-8 leading-relaxed" style={{ color: 'oklch(0.65 0.02 78 / 0.8)' }}>This collection doesn't exist or couldn't be loaded.</p>
          <Link to="/collections" className="inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase" style={{ color: 'oklch(0.60 0.11 78)' }}>
            <span>&larr;</span> Browse Collections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb
          items={[
            { label: 'HOME', to: '/' },
            { label: 'COLLECTIONS', to: '/collections' },
            { label: collection.title.toUpperCase() },
          ]}
          className="mb-8"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl lg:text-5xl tracking-[0.15em] mb-4">
            {collection.title}
          </h1>
          <OrnamentalDivider />
          {collection.description && (
            <p className="text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-6">
              {collection.description}
            </p>
          )}
        </motion.div>

        {/* Sort Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex justify-end mb-8"
        >
          <div className="relative group">
            <button
              className="pill-btn"
            >
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
              {SORT_OPTIONS.map((option) => {
                const isActive = sortKey === option.key && reverse === option.reverse
                return (
                  <button
                    key={`${option.key}-${option.reverse}`}
                    onClick={() => handleSort(option.key, option.reverse)}
                    className={`block w-full text-left px-4 py-2.5 text-[12px] font-semibold tracking-widest uppercase transition-colors ${
                      isActive
                        ? ''
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    style={
                      isActive
                        ? { color: 'oklch(0.60 0.11 78)' }
                        : undefined
                    }
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        <ProductGrid products={products} />

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
      </div>
    </div>
  )
}
