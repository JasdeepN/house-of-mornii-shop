// The Catalog module's domain shapes and rules: Products, Variants and Collections as pages use them.
// Raw Storefront API shapes (./types) stay inside src/lib/shopify; the hooks in ./hooks map them through here.

import { formatMoney } from './types'
import type { ShopifyCollection, ShopifyImage, ShopifyMoney, ShopifyProduct, ShopifyProductVariant } from './types'

// ─── Domain shapes ────────────────────────────────────────────────────────────

/** The price a Shopper sees for a Product in a listing. */
export interface DisplayPrice {
  /** The lowest Variant price. */
  min: ShopifyMoney
  /** The highest Variant price; equal to `min` when every Variant costs the same. */
  max: ShopifyMoney
  /** True when Variants differ in price; listings then read "From <min>". */
  isRange: boolean
  /** Shopify's compare-at price when it is above `min`, otherwise null. Never the range maximum (#25). */
  compareAt: ShopifyMoney | null
  /** Whole-number percentage from `compareAt` down to `min`; 0 when `compareAt` is null. */
  percentOff: number
}

export interface Variant {
  id: string
  title: string
  availableForSale: boolean
  price: ShopifyMoney
  /** Shopify's compare-at price when it is above `price`, otherwise null. */
  compareAtPrice: ShopifyMoney | null
  selectedOptions: { name: string; value: string }[]
  image: ShopifyImage | null
}

/** A Product as listings and search results show it. */
export interface ProductSummary {
  id: string
  handle: string
  title: string
  description: string
  availableForSale: boolean
  vendor: string
  tags: string[]
  /** Shopify's Product type; '' when unset. */
  productType: string
  featuredImage: ShopifyImage | null
  /** The Product's images in order, else the featured image alone, else []. Listings carry at most two. */
  images: ShopifyImage[]
  price: DisplayPrice
  /** What the quick-add button does: add the only Variant, let the Shopper choose among several, or nothing when sold out. */
  quickAdd: { kind: 'add'; variantId: string } | { kind: 'choose' } | { kind: 'sold-out' }
}

/** A Product with everything its page needs. */
export interface Product extends ProductSummary {
  descriptionHtml: string
  options: { name: string; values: string[] }[]
  variants: Variant[]
  /** The first Collection the Product belongs to, or null. */
  primaryCollection: { handle: string; title: string } | null
}

export interface CollectionSummary {
  id: string
  handle: string
  title: string
  description: string
  image: ShopifyImage | null
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

export type ProductSort = 'recommended' | 'newest' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'

/** Sort options in the order listings offer them. */
export const PRODUCT_SORTS: readonly { value: ProductSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'title-asc', label: 'Name A\u2013Z' },
  { value: 'title-desc', label: 'Name Z\u2013A' },
]

/** Reads a sort from a URL value; a missing or unknown value (including the retired 'best-selling') is 'recommended'. */
export function parseProductSort(value: string | null | undefined): ProductSort {
  return PRODUCT_SORTS.find((s) => s.value === value)?.value ?? 'recommended'
}

/**
 * Shopify sort arguments for a listing. Recommended is best-selling for all Products and the
 * Collection's own order (COLLECTION_DEFAULT) for a Collection. Product queries take ProductSortKeys
 * (newest is CREATED_AT); Collection queries take ProductCollectionSortKeys (newest is CREATED).
 */
export function shopifySortFor(
  sort: ProductSort,
  target: 'products' | 'collection',
): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case 'recommended':
      return { sortKey: target === 'collection' ? 'COLLECTION_DEFAULT' : 'BEST_SELLING', reverse: false }
    case 'newest':
      return { sortKey: target === 'collection' ? 'CREATED' : 'CREATED_AT', reverse: true }
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false }
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true }
    case 'title-asc':
      return { sortKey: 'TITLE', reverse: false }
    case 'title-desc':
      return { sortKey: 'TITLE', reverse: true }
  }
}

// ─── Listing filters ──────────────────────────────────────────────────────────

export interface ListingFilters {
  /** A Product type to show, or null for every type. */
  type: string | null
  /** True hides sold-out Products. */
  hideSoldOut: boolean
  sort: ProductSort
}

/** Reads `type`, `available=1` and `sort` from a page address. */
export function parseListingFilters(params: URLSearchParams): ListingFilters {
  return {
    type: params.get('type') || null,
    hideSoldOut: params.get('available') === '1',
    sort: parseProductSort(params.get('sort')),
  }
}

/**
 * A copy of `params` with these filters written in, defaults left out: no `type` for all types, no
 * `available` unless hiding sold out, no `sort` for recommended. Removes the legacy `reverse` param;
 * keeps every other param.
 */
export function withListingFilters(params: URLSearchParams, filters: ListingFilters): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('reverse')
  next.delete('type')
  next.delete('available')
  next.delete('sort')
  if (filters.type) next.set('type', filters.type)
  if (filters.hideSoldOut) next.set('available', '1')
  if (filters.sort !== 'recommended') next.set('sort', filters.sort)
  return next
}

export interface TypeCount {
  type: string
  count: number
}

export interface ListingView {
  /** The Products to show, in listing order. */
  products: ProductSummary[]
  /** Each non-empty Product type among the Products that pass Hide sold out, with its count, A–Z by type. */
  types: TypeCount[]
  /** How many Products pass Hide sold out, across every type (the "All" count). */
  total: number
}

/** What a listing shows for these filters. Sorting is not applied here; the listing arrives sorted. */
export function viewListing(
  products: ProductSummary[],
  filters: Pick<ListingFilters, 'type' | 'hideSoldOut'>,
): ListingView {
  const passing = filters.hideSoldOut ? products.filter((p) => p.availableForSale) : products
  const counts = new Map<string, number>()
  for (const p of passing) {
    if (p.productType) counts.set(p.productType, (counts.get(p.productType) ?? 0) + 1)
  }
  const types = [...counts]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type))
  return {
    products: filters.type === null ? passing : passing.filter((p) => p.productType === filters.type),
    types,
    total: passing.length,
  }
}

// ─── Prices and Variants ──────────────────────────────────────────────────────

/** "From $989.87" for a range, "$989.87" otherwise. */
export function formatDisplayPrice(price: DisplayPrice): string {
  const min = formatMoney(price.min)
  return price.isRange ? `From ${min}` : min
}

/** The first Variant available for sale, else the first Variant, else null. */
export function defaultVariant(product: Product): Variant | null {
  return product.variants.find((v) => v.availableForSale) ?? product.variants[0] ?? null
}

/**
 * The Variant a Shopper gets by choosing `value` for `optionName` while keeping their other current
 * choices. Falls back to the first Variant with that value when no Variant matches every choice;
 * null when no Variant has that value.
 */
export function variantWithOption(
  product: Product,
  current: Variant | null,
  optionName: string,
  value: string,
): Variant | null {
  const wanted = (current?.selectedOptions ?? [])
    .filter((o) => o.name !== optionName)
    .concat({ name: optionName, value })
  const exact = product.variants.find((v) =>
    wanted.every((w) => v.selectedOptions.some((o) => o.name === w.name && o.value === w.value)),
  )
  if (exact) return exact
  return (
    product.variants.find((v) => v.selectedOptions.some((o) => o.name === optionName && o.value === value)) ?? null
  )
}

// ─── Mapping from Storefront API shapes (internal to src/lib/shopify) ─────────

/** Only a compare-at amount above the base price counts as a sale. */
function above(compareAt: ShopifyMoney | null | undefined, base: ShopifyMoney): ShopifyMoney | null {
  return compareAt && Number(compareAt.amount) > Number(base.amount) ? compareAt : null
}

function toDisplayPrice(raw: ShopifyProduct): DisplayPrice {
  const min = raw.priceRange.minVariantPrice
  const max = raw.priceRange.maxVariantPrice
  const compareAt = above(raw.compareAtPriceRange?.minVariantPrice, min)
  return {
    min,
    max,
    isRange: Number(max.amount) > Number(min.amount),
    compareAt,
    percentOff: compareAt ? Math.round((1 - Number(min.amount) / Number(compareAt.amount)) * 100) : 0,
  }
}

/** Sold out wins; else a single Variant is added directly; otherwise the Shopper chooses. */
function quickAddFor(
  availableForSale: boolean,
  variants: { id: string }[],
): ProductSummary['quickAdd'] {
  if (!availableForSale) return { kind: 'sold-out' }
  if (variants.length === 1) return { kind: 'add', variantId: variants[0].id }
  return { kind: 'choose' }
}

export function toProductSummary(raw: ShopifyProduct): ProductSummary {
  const listed = raw.images?.edges.map((e) => e.node) ?? []
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    availableForSale: raw.availableForSale,
    vendor: raw.vendor,
    tags: raw.tags ?? [],
    productType: raw.productType ?? '',
    featuredImage: raw.featuredImage,
    images: listed.length > 0 ? listed : raw.featuredImage ? [raw.featuredImage] : [],
    price: toDisplayPrice(raw),
    quickAdd: quickAddFor(
      raw.availableForSale,
      (raw.variants?.edges ?? []).map((e) => e.node),
    ),
  }
}

export function toProduct(raw: ShopifyProduct): Product {
  const collection = raw.collections?.edges[0]?.node
  return {
    ...toProductSummary(raw),
    descriptionHtml: raw.descriptionHtml ?? '',
    options: raw.options.map(({ name, values }) => ({ name, values })),
    variants: raw.variants.edges.map((e) => toVariant(e.node as ShopifyProductVariant)),
    primaryCollection: collection ? { handle: collection.handle, title: collection.title } : null,
  }
}

export function toVariant(raw: ShopifyProductVariant): Variant {
  return {
    id: raw.id,
    title: raw.title,
    availableForSale: raw.availableForSale,
    price: raw.price,
    compareAtPrice: above(raw.compareAtPrice, raw.price),
    selectedOptions: raw.selectedOptions,
    image: raw.image,
  }
}

export function toCollectionSummary(raw: Pick<ShopifyCollection, 'id' | 'handle' | 'title' | 'description' | 'image'>): CollectionSummary {
  return { id: raw.id, handle: raw.handle, title: raw.title, description: raw.description, image: raw.image }
}
