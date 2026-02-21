import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretDown, Funnel } from '@phosphor-icons/react'
import { useProducts, useCollections } from '@/lib/shopify'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { ProductGrid } from '@/components/ProductGrid'
import { Button } from '@/components/ui/button'

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

  const { data: collections } = useCollections()
  const { data: productsData, isLoading } = useProducts(sortKey, reverse)

  // Find the active sort option label
  const activeSortLabel = useMemo(() => {
    const match = SORT_OPTIONS.find(
      (o) => o.key === sortKey && o.reverse === reverse,
    )
    return match?.label ?? 'Best Selling'
  }, [sortKey, reverse])

  const products = useMemo(() => {
    if (!productsData) return []
    return productsData.edges.map((e) => e.node)
  }, [productsData])

  const handleSort = (key: string, rev: boolean) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', key)
    if (rev) params.set('reverse', 'true')
    else params.delete('reverse')
    setSearchParams(params, { replace: true })
  }

  const handleCollectionFilter = (handle: string) => {
    const params = new URLSearchParams(searchParams)
    if (handle) params.set('collection', handle)
    else params.delete('collection')
    setSearchParams(params, { replace: true })
  }

  // Filter products by collection tag if set (client-side filter for simplicity)
  const filteredProducts = useMemo(() => {
    if (!collectionFilter) return products
    return products.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === collectionFilter.toLowerCase()),
    )
  }, [products, collectionFilter])

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs tracking-[0.2em] text-muted-foreground mb-6">
            <Link to="/" className="hover:text-accent transition-colors">HOME</Link>
            <span>/</span>
            <span style={{ color: 'oklch(0.60 0.11 78)' }}>SHOP</span>
          </div>

          <h1 className="text-4xl lg:text-5xl tracking-[0.15em] mb-4">
            Shop All
          </h1>
          <OrnamentalDivider />
          <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-6">
            Explore our full collection of heritage-inspired jewellery.
          </p>
        </motion.div>

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
              className={`text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 rounded-sm transition-all ${
                !collectionFilter
                  ? 'font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={
                !collectionFilter
                  ? {
                      background: 'oklch(0.60 0.11 78 / 0.15)',
                      border: '1px solid oklch(0.60 0.11 78 / 0.3)',
                      color: 'oklch(0.60 0.11 78)',
                    }
                  : { border: '1px solid oklch(1 0 0 / 0.08)' }
              }
            >
              All
            </button>
            {collections?.map((col) => (
              <button
                key={col.handle}
                onClick={() => handleCollectionFilter(col.handle)}
                className={`text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 rounded-sm transition-all ${
                  collectionFilter === col.handle
                    ? 'font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={
                  collectionFilter === col.handle
                    ? {
                        background: 'oklch(0.60 0.11 78 / 0.15)',
                        border: '1px solid oklch(0.60 0.11 78 / 0.3)',
                        color: 'oklch(0.60 0.11 78)',
                      }
                    : { border: '1px solid oklch(1 0 0 / 0.08)' }
                }
              >
                {col.title}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 rounded-sm"
              style={{ border: '1px solid oklch(1 0 0 / 0.10)' }}
            >
              Sort: {activeSortLabel}
              <CaretDown size={12} weight="bold" />
            </button>
            <div
              className="absolute right-0 mt-1 w-48 rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30 py-1"
              style={{
                background: 'oklch(0.20 0.03 210)',
                border: '1px solid oklch(1 0 0 / 0.10)',
                boxShadow: '0 8px 24px oklch(0 0 0 / 0.4)',
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={`${option.key}-${option.reverse}`}
                  onClick={() => handleSort(option.key, option.reverse)}
                  className={`block w-full text-left px-4 py-2 text-[11px] tracking-[0.1em] uppercase transition-colors ${
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
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground tracking-widest animate-pulse">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <ProductGrid products={filteredProducts} />
            {productsData?.pageInfo.hasNextPage && !collectionFilter && (
              <div className="text-center mt-12">
                <Button
                  variant="outline"
                  className="border-accent text-foreground hover:bg-accent/10 tracking-widest"
                >
                  LOAD MORE
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground tracking-widest mb-4">
              No products found.
            </p>
            {collectionFilter && (
              <Button
                variant="outline"
                className="border-accent text-foreground hover:bg-accent/10 tracking-widest"
                onClick={() => handleCollectionFilter('')}
              >
                CLEAR FILTER
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
