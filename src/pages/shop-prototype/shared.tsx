// PROTOTYPE, throwaway: small helpers shared by the Shop All variants. Layout stays inside each variant.
import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/shopify'
import type { ShopifyImage, ShopifyProduct } from '@/lib/shopify'

export interface ShopCollection {
  handle: string
  title: string
  description?: string
  image?: ShopifyImage | null
}

export interface ShopVariantProps {
  products: ShopifyProduct[]
  collections: ShopCollection[]
  loading: boolean
  sortKey: string
  reverse: boolean
  onSort: (key: string, reverse: boolean) => void
  canLoadMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onQuickAdd: (product: ShopifyProduct) => void
}

// The brief keeps only these three sorts until real price and date data are connected.
export const SORTS = [
  { label: 'Recommended', key: 'BEST_SELLING', reverse: false },
  { label: 'Name A–Z', key: 'TITLE', reverse: false },
  { label: 'Name Z–A', key: 'TITLE', reverse: true },
]
export const sortValue = (key: string, reverse: boolean) => `${key}:${reverse}`
export function SortSelect({ sortKey, reverse, onSort, label = true }: Pick<ShopVariantProps, 'sortKey' | 'reverse' | 'onSort'> & { label?: boolean }) {
  const select = (
    <select
      className="p-select"
      aria-label={label ? undefined : 'Sort'}
      value={sortValue(sortKey, reverse)}
      onChange={(e) => {
        const [key, rev] = e.target.value.split(':')
        onSort(key, rev === 'true')
      }}
    >
      {SORTS.map((s) => (
        <option key={s.label} value={sortValue(s.key, s.reverse)}>{s.label}</option>
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

export function useTypeFilter(products: ShopifyProduct[]) {
  const [type, setType] = useState('all')
  const counts = useMemo(
    () => Object.fromEntries(TYPES.map((t) => [t.key, t.key === 'all' ? products.length : products.filter((p) => p.productType === t.key).length])),
    [products],
  )
  const visible = useMemo(() => (type === 'all' ? products : products.filter((p) => p.productType === type)), [products, type])
  return { type, setType, counts, visible }
}

export const sized = (url: string, width: number) => `${url}${url.includes('?') ? '&' : '?'}width=${width}`
export const typeLabel = (p: ShopifyProduct) => p.productType || 'Jewellery'

export function imagesOf(p: ShopifyProduct): ShopifyImage[] {
  const list = p.images?.edges?.map((e) => e.node) ?? []
  if (list.length) return list
  return p.featuredImage ? [p.featuredImage] : []
}

// A range reads "From", and a sale shows only from Shopify's real compare-at price (see #25).
export function priceOf(p: ShopifyProduct) {
  const min = p.priceRange.minVariantPrice
  const max = p.priceRange.maxVariantPrice
  const cmp = p.compareAtPriceRange?.minVariantPrice
  const onSale = Boolean(cmp && Number(cmp.amount) > Number(min.amount))
  return {
    now: `${Number(max.amount) > Number(min.amount) ? 'From ' : ''}${formatMoney(min)}`,
    was: onSale && cmp ? formatMoney(cmp) : null,
    pctOff: onSale && cmp ? Math.round((1 - Number(min.amount) / Number(cmp.amount)) * 100) : 0,
    soldOut: !p.availableForSale,
  }
}

export function Price({ p, soldOutText = true }: { p: ShopifyProduct; soldOutText?: boolean }) {
  const price = priceOf(p)
  return (
    <>
      <span>{price.now}</span>
      {price.was && <s className="p-was" aria-label={`was ${price.was}`}>{price.was}</s>}
      {soldOutText && price.soldOut && <span className="p-was">· Sold out</span>}
    </>
  )
}

export function Tag({ p }: { p: ShopifyProduct }) {
  const price = priceOf(p)
  if (price.soldOut) return <span className="p-tag">Sold out</span>
  if (price.pctOff) return <span className="p-tag p-tag--sale">−{price.pctOff}%</span>
  return null
}

export function Photo({ p, width = 700, swap = false, className = '' }: { p: ShopifyProduct; width?: number; swap?: boolean; className?: string }) {
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
