import { useMemo, useCallback, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { ProductListingLayout } from '@/components/ProductListingLayout'
import {
  useProductListing,
  parseListingFilters,
  withListingFilters,
  viewListing,
  type ListingFilters,
} from '@/lib/shopify'
import { useErrorHandler } from '@/lib/errorHandler'
import { useSEO } from '@/hooks/useSEO'
import { trackViewItemList } from '@/lib/analytics'

export function CollectionPage() {
  const { handle } = useParams<{ handle: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseListingFilters(searchParams), [searchParams])

  const listing = useProductListing({ collection: handle, sort: filters.sort, all: true })
  const { collection, products } = listing
  const errorDisplay = useErrorHandler(listing.error)

  useSEO({
    title: collection?.title,
    description: collection?.description || `Shop the ${collection?.title || ''} collection from House of Mornii.`,
    image: collection?.image?.url,
  })

  // No `replace`: Back and Forward restore the filters.
  const handleFiltersChange = useCallback(
    (next: ListingFilters) => setSearchParams(withListingFilters(searchParams, next)),
    [searchParams, setSearchParams],
  )

  const shown = useMemo(
    () => viewListing(products, { type: filters.type, hideSoldOut: filters.hideSoldOut }).products,
    [products, filters.type, filters.hideSoldOut],
  )

  const trackedProducts = useMemo(
    () => shown.slice(0, 12).map((p) => ({ id: p.id, name: p.title, price: p.price.min.amount })),
    [shown],
  )

  // Keep this before any conditional return so hook order stays stable.
  useEffect(() => {
    if (collection && trackedProducts.length > 0) {
      trackViewItemList(collection.title, trackedProducts)
    }
  }, [collection, trackedProducts])

  if (listing.isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
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
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-20 text-center max-w-lg">
          <h1 className="text-3xl mb-4 text-foreground">{errorDisplay.title}</h1>
          <p className="mb-8 leading-relaxed text-muted-foreground">{errorDisplay.message}</p>
          {errorDisplay.showRetry && (
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 text-sm tracking-[0.2em] uppercase border border-border text-foreground">Try Again</button>
          )}
        </div>
      </div>
    )
  }

  if (listing.notFound || !collection) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-20 text-center max-w-lg">
          <h1 className="text-3xl mb-4 text-foreground">Collection Not Found</h1>
          <p className="mb-8 leading-relaxed text-muted-foreground">This collection doesn't exist or couldn't be loaded.</p>
          <Link to="/collections" className="inline-flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-primary">
            <span>&larr;</span> Browse Collections
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProductListingLayout
      title={collection.title}
      breadcrumb={
        <PageBreadcrumb
          items={[
            { label: 'HOME', to: '/' },
            { label: 'COLLECTIONS', to: '/collections' },
            { label: collection.title.toUpperCase() },
          ]}
        />
      }
      intro={collection.description || undefined}
      products={products}
      isLoading={false}
      filters={filters}
      onFiltersChange={handleFiltersChange}
    />
  )
}
