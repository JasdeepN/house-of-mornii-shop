import { useState, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react'
import { useCollection } from '@/lib/shopify'
import { OrnamentalDivider } from '@/components/OrnamentalBorder'
import { ProductGrid } from '@/components/ProductGrid'
import { Button } from '@/components/ui/button'

const SORT_OPTIONS = [
  { label: 'Best Selling', key: 'BEST_SELLING' },
  { label: 'Newest', key: 'CREATED' },
  { label: 'Price: Low → High', key: 'PRICE' },
  { label: 'A–Z', key: 'TITLE' },
] as const

export function CollectionPage() {
  const { handle } = useParams<{ handle: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const sortKey = searchParams.get('sort') || undefined
  const [loadedProducts, setLoadedProducts] = useState<
    ReturnType<typeof flattenProducts>
  >([])
  const [afterCursor, setAfterCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const { data: collection, isLoading, error } = useCollection(handle ?? '', 12, sortKey)

  const activeSortLabel = useMemo(() => {
    const match = SORT_OPTIONS.find((o) => o.key === sortKey)
    return match?.label ?? 'Featured'
  }, [sortKey])

  const handleSort = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams)
      if (key) params.set('sort', key)
      else params.delete('sort')
      setSearchParams(params, { replace: true })
      // Reset loaded-more products when sort changes
      setLoadedProducts([])
      setAfterCursor(undefined)
    },
    [searchParams, setSearchParams],
  )

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center py-20">
          <p className="text-muted-foreground tracking-widest animate-pulse">
            Loading collection...
          </p>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center py-20">
          <h1 className="text-4xl tracking-[0.15em] mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground">
            This collection doesn't exist or couldn't be loaded.
          </p>
        </div>
      </div>
    )
  }

  const baseProducts = collection.products.edges.map((e) => e.node)
  const products = [...baseProducts, ...loadedProducts]
  const { hasNextPage } = collection.products.pageInfo

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-xs tracking-[0.2em] text-muted-foreground mb-8"
        >
          <Link to="/" className="hover:text-accent transition-colors">HOME</Link>
          <span>/</span>
          <Link to="/collections" className="hover:text-accent transition-colors">COLLECTIONS</Link>
          <span>/</span>
          <span style={{ color: 'oklch(0.60 0.11 78)' }}>{collection.title.toUpperCase()}</span>
        </motion.div>

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
                  key={option.key}
                  onClick={() => handleSort(option.key)}
                  className={`block w-full text-left px-4 py-2 text-[11px] tracking-[0.1em] uppercase transition-colors ${
                    sortKey === option.key
                      ? ''
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={
                    sortKey === option.key
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

        <ProductGrid products={products} />

        {(hasNextPage || afterCursor) && loadedProducts.length === 0 && hasNextPage && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="border-accent text-foreground hover:bg-accent/10 tracking-widest"
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'LOADING...' : 'LOAD MORE'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper — avoids importing flattenEdges just for typing
function flattenProducts(edges: { node: any }[]) {
  return edges.map((e) => e.node)
}
