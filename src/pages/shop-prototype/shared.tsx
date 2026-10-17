// PROTOTYPE, throwaway: small helpers shared by the Shop All variants. Layout stays inside each variant.
import { useMemo, useState } from 'react'
import { formatDisplayPrice, formatMoney, PRODUCT_SORTS, type ProductSort, type ProductSummary } from '@/lib/shopify'
import type { ShopifyImage } from '@/lib/shopify'

export interface ShopCollection {
  handle: string
  title: string
  description?: string
  image?: ShopifyImage | null
}

export interface ShopVariantProps {
  products: ProductSummary[]
  collections: ShopCollection[]
  loading: boolean
  sort: ProductSort | undefined
  onSort: (sort: ProductSort) => void
  canLoadMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onQuickAdd: (product: ProductSummary) => void
}

// The brief keeps only these sorts until real price and date data are connected.
const PROTOTYPE_SORTS: { value: ProductSort; label: string }[] = [
  { value: 'best-selling', label: 'Recommended' },
  { value: 'title-asc', label: 'Name A–Z' },
]
export const SORTS = PRODUCT_SORTS.flatMap((s) => PROTOTYPE_SORTS.filter((p) => p.value === s.value))
export function SortSelect({ sort, onSort, label = true }: Pick<ShopVariantProps, 'sort' | 'onSort'> & { label?: boolean }) {
  const select = (
    <select
      className="p-select"
      aria-label={label ? undefined : 'Sort'}
      value={sort ?? 'best-selling'}
      onChange={(e) => onSort(e.target.value as ProductSort)}
    >
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
  if (!label) return select
  return <label className="flex items-center gap-2.5 text-[var(--p-muted)]">Sort {select}</label>
}

export const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'Necklace', label: 'Necklaces' },
  { key: 'Earrings', label: 'Earrings' },
  { key: 'Set', label: 'Sets' },
]

export function useTypeFilter(products: ProductSummary[]) {
  const [type, setType] = useState('all')
  const counts = useMemo(
    () => Object.fromEntries(TYPES.map((t) => [t.key, t.key === 'all' ? products.length : products.filter((p) => p.productType === t.key).length])),
    [products],
  )
  const visible = useMemo(() => (type === 'all' ? products : products.filter((p) => p.productType === type)), [products, type])
  return { type, setType, counts, visible }
}

export const sized = (url: string, width: number) => `${url}${url.includes('?') ? '&' : '?'}width=${width}`
export const typeLabel = (p: ProductSummary) => p.productType || 'Jewellery'

export function imagesOf(p: ProductSummary): ShopifyImage[] {
  return p.images
}

// A range reads "From", and a sale shows only from Shopify's real compare-at price (see #25).
export function priceOf(p: ProductSummary) {
  return {
    now: formatDisplayPrice(p.price),
    was: p.price.compareAt ? formatMoney(p.price.compareAt) : null,
    pctOff: p.price.percentOff,
    soldOut: !p.availableForSale,
  }
}

export function Price({ p, soldOutText = true }: { p: ProductSummary; soldOutText?: boolean }) {
  const price = priceOf(p)
  return (
    <>
      <span>{price.now}</span>
      {price.was && <s className="p-was" aria-label={`was ${price.was}`}>{price.was}</s>}
      {soldOutText && price.soldOut && <span className="p-was">· Sold out</span>}
    </>
  )
}

export function Tag({ p }: { p: ProductSummary }) {
  const price = priceOf(p)
  if (price.soldOut) return <span className="p-tag">Sold out</span>
  if (price.pctOff) return <span className="p-tag p-tag--sale">−{price.pctOff}%</span>
  return null
}

export function Photo({ p, width = 700, swap = false, className = '' }: { p: ProductSummary; width?: number; swap?: boolean; className?: string }) {
  const imgs = imagesOf(p)
  if (!imgs.length) {
    return (
      <div className={`p-photo p-noimg ${className}`}>
        <div>
          <span aria-hidden="true">M</span>
          <span className="block">Photo coming soon</span>
        </div>
      </div>
    )
  }
  return (
    <div className={`p-photo ${className}`}>
      <img src={sized(imgs[0].url, width)} alt="" loading="lazy" width={imgs[0].width} height={imgs[0].height} />
      {swap && imgs[1] && <img className="p-img-b" src={sized(imgs[1].url, width)} alt="" loading="lazy" />}
    </div>
  )
}

export function LoadMore({ canLoadMore, loadingMore, onLoadMore, ghost = false }: Pick<ShopVariantProps, 'canLoadMore' | 'loadingMore' | 'onLoadMore'> & { ghost?: boolean }) {
  if (!canLoadMore) return null
  return (
    <div className="p-load">
      <button type="button" className={`p-btn${ghost ? ' p-btn--ghost' : ''}`} onClick={onLoadMore} disabled={loadingMore}>
        {loadingMore ? 'Loading…' : 'Show more'}
      </button>
    </div>
  )
}
