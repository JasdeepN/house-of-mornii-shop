import { useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseListingFilters(searchParams), [searchParams])

  const listing = useProductListing({ sort: filters.sort, all: true })
  const errorDisplay = useErrorHandler(listing.error)

  useSEO({
    title: 'Shop',
    description: 'Explore our full collection of heritage-inspired costume jewellery. Everyday elegance, festive pieces, and bridal grandeur.',
  })

  // No `replace`: Back and Forward restore the filters.
  const handleFiltersChange = useCallback(
    (next: ListingFilters) => setSearchParams(withListingFilters(searchParams, next)),
    [searchParams, setSearchParams],
  )

  const shown = useMemo(
    () => viewListing(listing.products, { type: filters.type, hideSoldOut: filters.hideSoldOut }).products,
    [listing.products, filters.type, filters.hideSoldOut],
  )

  const trackedProducts = useMemo(
    () => shown.slice(0, 12).map((p) => ({ id: p.id, name: p.title, price: p.price.min.amount })),
    [shown],
  )

  useEffect(() => {
    if (trackedProducts.length > 0) trackViewItemList('Shop All', trackedProducts)
  }, [trackedProducts])

  return (
    <ProductListingLayout
      title="Shop"
      breadcrumb={<PageBreadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'SHOP' }]} />}
      products={listing.products}
      isLoading={listing.isLoading}
      error={errorDisplay ? errorDisplay.message : undefined}
      filters={filters}
      onFiltersChange={handleFiltersChange}
    />
  )
}
