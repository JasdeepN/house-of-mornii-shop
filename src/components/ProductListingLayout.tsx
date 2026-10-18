import { useMemo, type ReactNode } from 'react'
import { PRODUCT_SORTS, viewListing, type ListingFilters, type ProductSort, type ProductSummary } from '@/lib/shopify'
import { ProductGrid } from '@/components/ProductGrid'

interface ProductListingLayoutProps {
  title: string
  /** Shown above the title and results, for example a PageBreadcrumb. */
  breadcrumb?: ReactNode
  intro?: ReactNode
  /** The whole listing, before Type and Hide sold out are applied. */
  products: ProductSummary[]
  isLoading: boolean
  /** Shown in place of the results, for example a service-error message. */
  error?: ReactNode
  filters: ListingFilters
  onFiltersChange: (filters: ListingFilters) => void
}

const groupHeading = 'mb-2.5 font-body text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground'
const option =
  'flex min-h-11 w-full cursor-pointer items-center justify-between text-left text-foreground aria-pressed:font-bold'
const chip =
  'min-h-11 shrink-0 whitespace-nowrap rounded-full border border-border bg-card px-4 text-sm text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground'

export function ProductListingLayout({
  title,
  breadcrumb,
  intro,
  products,
  isLoading,
  error,
  filters,
  onFiltersChange,
}: ProductListingLayoutProps) {
  const view = useMemo(
    () => viewListing(products, { type: filters.type, hideSoldOut: filters.hideSoldOut }),
    [products, filters.type, filters.hideSoldOut],
  )

  const setType = (type: string | null) => onFiltersChange({ ...filters, type })
  const setHideSoldOut = (hideSoldOut: boolean) => onFiltersChange({ ...filters, hideSoldOut })
  const setSort = (sort: ProductSort) => onFiltersChange({ ...filters, sort })
  const clearFilters = () => onFiltersChange({ ...filters, type: null, hideSoldOut: false })

  const typeOptions = [{ type: null as string | null, label: 'All', count: view.total }].concat(
    view.types.map((t) => ({ type: t.type, label: t.type, count: t.count })),
  )

  return (
    <div className="min-h-screen bg-background pb-28 pt-24">
      {breadcrumb && <div className="mx-auto mb-8 w-[min(100%-112px,1440px)] max-[1100px]:w-[min(100%-72px,1440px)] max-[760px]:w-[min(100%-44px,1440px)]">{breadcrumb}</div>}
      <div className="mx-auto grid w-[min(100%-112px,1440px)] grid-cols-[250px_minmax(0,1fr)] items-start gap-11 max-[1100px]:w-[min(100%-72px,1440px)] max-[760px]:w-[min(100%-44px,1440px)] max-[760px]:grid-cols-1 max-[760px]:gap-0">
        <div className="sticky top-28 max-[760px]:static">
          <h1 className="mb-5 font-heading text-[40px] font-normal normal-case leading-[1.1] tracking-normal text-foreground max-[760px]:mb-3.5">
            {title}
          </h1>
          {intro && <div className="mb-5 text-base leading-relaxed text-muted-foreground">{intro}</div>}

          <aside aria-label="Filters" className="max-[760px]:hidden">
            <div className="border-t border-border pb-4 pt-4">
              <h2 className={groupHeading}>Type</h2>
              {typeOptions.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  className={option}
                  aria-pressed={filters.type === o.type}
                  onClick={() => setType(o.type)}
                >
                  <span className="flex flex-1 items-center">
                    {filters.type === o.type && (
                      <span aria-hidden="true" className="mr-2.5 size-1.5 rounded-full bg-primary" />
                    )}
                    {o.label}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">{o.count}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-border pb-4 pt-4">
              <h2 className={groupHeading}>Availability</h2>
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-foreground">
                <input
                  type="checkbox"
                  className="size-[18px] accent-primary"
                  checked={filters.hideSoldOut}
                  onChange={(e) => setHideSoldOut(e.target.checked)}
                />
                Hide sold out
              </label>
            </div>
            <div className="border-t border-border pb-4 pt-4">
              <h2 className={groupHeading}>Sort</h2>
              {PRODUCT_SORTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={option}
                  aria-pressed={filters.sort === s.value}
                  onClick={() => setSort(s.value)}
                >
                  <span className="flex flex-1 items-center">
                    {filters.sort === s.value && (
                      <span aria-hidden="true" className="mr-2.5 size-1.5 rounded-full bg-primary" />
                    )}
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <section aria-label="Products">
          <div
            role="group"
            aria-label="Product type"
            className="hidden gap-2 overflow-x-auto pb-3.5 pt-1 [scrollbar-width:none] max-[760px]:flex"
          >
            {typeOptions.map((o) => (
              <button
                key={o.label}
                type="button"
                className={chip}
                aria-pressed={filters.type === o.type}
                onClick={() => setType(o.type)}
              >
                {o.label} · {o.count}
              </button>
            ))}
            <button
              type="button"
              className={chip}
              aria-pressed={filters.hideSoldOut}
              onClick={() => setHideSoldOut(!filters.hideSoldOut)}
            >
              Hide sold out
            </button>
          </div>
          <div className="hidden pb-3.5 max-[760px]:block">
            <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
              <span>Sort</span>
              <select
                className="min-h-11 flex-1 rounded-full border border-border bg-card px-3 text-foreground"
                value={filters.sort}
                onChange={(e) => setSort(e.target.value as ProductSort)}
              >
                {PRODUCT_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <p role="status" className="py-20 text-center tracking-widest text-muted-foreground">
              Loading products...
            </p>
          ) : error ? (
            <div className="py-12 text-center text-muted-foreground">{error}</div>
          ) : (
            <>
              <div className="mb-4 flex min-h-[52px] items-center text-muted-foreground">
                <span aria-live="polite">{view.products.length} products</span>
              </div>
              {view.products.length > 0 ? (
                <ProductGrid products={view.products} />
              ) : (
                <div className="py-16 text-center">
                  {filters.type !== null || filters.hideSoldOut ? (
                    <>
                      <p className="mb-5 text-lg text-foreground">No Products match these filters</p>
                      <button
                        type="button"
                        className="min-h-11 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary-hover"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">No Products found.</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
