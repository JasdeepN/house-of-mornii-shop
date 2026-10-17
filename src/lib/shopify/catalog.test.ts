import { describe, expect, it } from 'vitest'
import {
  defaultVariant,
  formatDisplayPrice,
  PRODUCT_SORTS,
  parseListingFilters,
  parseProductSort,
  shopifySortFor,
  toCollectionSummary,
  toProduct,
  toProductSummary,
  toVariant,
  variantWithOption,
  viewListing,
  withListingFilters,
  type DisplayPrice,
} from './catalog'
import { listingOf } from '@/test/fixtures/catalog-fixtures'
import type { ShopifyImage, ShopifyMoney, ShopifyProduct, ShopifyProductVariant } from './types'

const cad = (amount: string): ShopifyMoney => ({ amount, currencyCode: 'CAD' })
const image = (n: number): ShopifyImage => ({ url: `https://cdn.test/${n}.jpg`, altText: null, width: 10, height: 10 })

function rawVariant(id: string, size: string, colour: string, over: Partial<ShopifyProductVariant> = {}): ShopifyProductVariant {
  return {
    id,
    title: `${size} / ${colour}`,
    availableForSale: true,
    price: cad('100.00'),
    compareAtPrice: null,
    selectedOptions: [
      { name: 'Size', value: size },
      { name: 'Colour', value: colour },
    ],
    image: null,
    ...over,
  }
}

function rawProduct(over: Partial<ShopifyProduct> = {}): ShopifyProduct {
  return {
    id: 'gid://shopify/Product/1',
    handle: 'ring',
    title: 'Ring',
    description: 'A ring',
    descriptionHtml: '<p>A ring</p>',
    availableForSale: true,
    featuredImage: image(0),
    images: { edges: [{ node: image(1) }, { node: image(2) }] },
    options: [
      { id: 'o1', name: 'Size', values: ['S', 'M'] },
      { id: 'o2', name: 'Colour', values: ['Gold', 'Silver'] },
    ],
    variants: {
      edges: [
        { node: rawVariant('v1', 'S', 'Gold') },
        { node: rawVariant('v2', 'M', 'Silver') },
        { node: rawVariant('v3', 'S', 'Silver') },
        { node: rawVariant('v4', 'M', 'Gold') },
      ],
    },
    priceRange: { minVariantPrice: cad('100.00'), maxVariantPrice: cad('100.00') },
    vendor: 'HoM',
    ...over,
  }
}

describe('PRODUCT_SORTS', () => {
  it('lists the six sorts in order with exact labels', () => {
    expect(PRODUCT_SORTS).toEqual([
      { value: 'recommended', label: 'Recommended' },
      { value: 'newest', label: 'Newest' },
      { value: 'price-asc', label: 'Price low to high' },
      { value: 'price-desc', label: 'Price high to low' },
      { value: 'title-asc', label: 'Name A\u2013Z' },
      { value: 'title-desc', label: 'Name Z\u2013A' },
    ])
  })
})

describe('parseProductSort', () => {
  it('accepts known sorts', () => {
    for (const { value } of PRODUCT_SORTS) expect(parseProductSort(value)).toBe(value)
  })
  it('falls back to recommended for missing or unknown values, including the old best-selling', () => {
    for (const bad of [null, undefined, '', 'BEST_SELLING', 'best-selling', 'junk']) {
      expect(parseProductSort(bad)).toBe('recommended')
    }
  })
})

describe('shopifySortFor', () => {
  it('recommended is best-selling for Products and the default order for a Collection', () => {
    expect(shopifySortFor('recommended', 'products')).toEqual({ sortKey: 'BEST_SELLING', reverse: false })
    expect(shopifySortFor('recommended', 'collection')).toEqual({ sortKey: 'COLLECTION_DEFAULT', reverse: false })
  })
  it('uses CREATED_AT for Products and CREATED for a Collection', () => {
    expect(shopifySortFor('newest', 'products')).toEqual({ sortKey: 'CREATED_AT', reverse: true })
    expect(shopifySortFor('newest', 'collection')).toEqual({ sortKey: 'CREATED', reverse: true })
  })
  it('maps price and title sorts', () => {
    expect(shopifySortFor('price-asc', 'products')).toEqual({ sortKey: 'PRICE', reverse: false })
    expect(shopifySortFor('price-desc', 'collection')).toEqual({ sortKey: 'PRICE', reverse: true })
    expect(shopifySortFor('title-asc', 'products')).toEqual({ sortKey: 'TITLE', reverse: false })
    expect(shopifySortFor('title-desc', 'collection')).toEqual({ sortKey: 'TITLE', reverse: true })
  })
})

describe('listing filters in the URL', () => {
  it('reads type, available=1 and sort', () => {
    expect(parseListingFilters(new URLSearchParams('type=Necklace&available=1&sort=price-asc'))).toEqual({
      type: 'Necklace',
      hideSoldOut: true,
      sort: 'price-asc',
    })
  })
  it('defaults to all types, sold out shown, recommended', () => {
    expect(parseListingFilters(new URLSearchParams(''))).toEqual({ type: null, hideSoldOut: false, sort: 'recommended' })
    expect(parseListingFilters(new URLSearchParams('type=&available=0&sort=best-selling'))).toEqual({
      type: null,
      hideSoldOut: false,
      sort: 'recommended',
    })
  })
  it('round-trips through withListingFilters', () => {
    const filters = { type: 'Earrings', hideSoldOut: true, sort: 'title-desc' as const }
    expect(parseListingFilters(withListingFilters(new URLSearchParams(), filters))).toEqual(filters)
  })
  it('leaves defaults out, removes reverse and keeps unrelated params', () => {
    const params = new URLSearchParams('q=gold&reverse=true&type=Old&available=1&sort=newest')
    const out = withListingFilters(params, { type: null, hideSoldOut: false, sort: 'recommended' })
    expect(out.toString()).toBe('q=gold')
    expect(params.get('type')).toBe('Old')
  })
  it('writes non-default values', () => {
    const out = withListingFilters(new URLSearchParams('q=gold&reverse=1'), {
      type: 'Set',
      hideSoldOut: true,
      sort: 'newest',
    })
    expect(out.get('type')).toBe('Set')
    expect(out.get('available')).toBe('1')
    expect(out.get('sort')).toBe('newest')
    expect(out.get('q')).toBe('gold')
    expect(out.has('reverse')).toBe(false)
  })
})

describe('viewListing', () => {
  const list = listingOf([
    { id: 'a', type: 'Necklace', available: true },
    { id: 'b', type: 'Earrings', available: false },
    { id: 'c', type: 'Necklace', available: false },
    { id: 'd', type: '', available: true },
    { id: 'e', type: 'Earrings', available: true },
  ])
  const ids = (v: { products: { id: string }[] }) => v.products.map((p) => p.id)

  it('shows every Product in order with typed counts A-Z and a total', () => {
    const v = viewListing(list, { type: null, hideSoldOut: false })
    expect(ids(v)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(v.types).toEqual([
      { type: 'Earrings', count: 2 },
      { type: 'Necklace', count: 2 },
    ])
    expect(v.total).toBe(5)
  })
  it('counts respect Hide sold out', () => {
    const v = viewListing(list, { type: null, hideSoldOut: true })
    expect(ids(v)).toEqual(['a', 'd', 'e'])
    expect(v.types).toEqual([
      { type: 'Earrings', count: 1 },
      { type: 'Necklace', count: 1 },
    ])
    expect(v.total).toBe(3)
  })
  it('filters by type while counts stay across types', () => {
    const v = viewListing(list, { type: 'Necklace', hideSoldOut: true })
    expect(ids(v)).toEqual(['a'])
    expect(v.total).toBe(3)
    expect(v.types).toHaveLength(2)
  })
  it('counts empty-type Products only in total', () => {
    const v = viewListing(list, { type: null, hideSoldOut: false })
    expect(v.types.reduce((n, t) => n + t.count, 0)).toBe(4)
    expect(v.types.some((t) => t.type === '')).toBe(false)
  })
  it('gives no Products for a type that is not present', () => {
    const v = viewListing(list, { type: 'Ring', hideSoldOut: false })
    expect(v.products).toEqual([])
    expect(v.total).toBe(5)
  })
})

describe('quickAdd', () => {
  const edges = (...nodes: { id: string; availableForSale: boolean }[]) => ({ edges: nodes.map((node) => ({ node })) })
  const card = (over: Partial<ShopifyProduct>) => rawProduct(over)
  it('is sold-out when the Product is not available for sale', () => {
    const raw = card({ availableForSale: false, variants: edges({ id: 'v1', availableForSale: false }) as never })
    expect(toProductSummary(raw).quickAdd).toEqual({ kind: 'sold-out' })
  })
  it('adds the only Variant', () => {
    const raw = card({ variants: edges({ id: 'v9', availableForSale: true }) as never })
    expect(toProductSummary(raw).quickAdd).toEqual({ kind: 'add', variantId: 'v9' })
  })
  it('lets the Shopper choose among several Variants', () => {
    const raw = card({ variants: edges({ id: 'v1', availableForSale: true }, { id: 'v2', availableForSale: true }) as never })
    expect(toProductSummary(raw).quickAdd).toEqual({ kind: 'choose' })
  })
  it('chooses when the data has no Variants', () => {
    expect(toProductSummary(card({ variants: { edges: [] } })).quickAdd).toEqual({ kind: 'choose' })
  })
  it('toProduct applies the same rules over its full Variant list', () => {
    expect(toProduct(rawProduct()).quickAdd).toEqual({ kind: 'choose' })
    expect(toProduct(rawProduct({ variants: { edges: [{ node: rawVariant('only', 'S', 'Gold') }] } })).quickAdd).toEqual({
      kind: 'add',
      variantId: 'only',
    })
  })
})

describe('displayed price', () => {
  it('is a single price when min equals max', () => {
    const { price } = toProductSummary(rawProduct())
    expect(price).toEqual({ min: cad('100.00'), max: cad('100.00'), isRange: false, compareAt: null, percentOff: 0 })
    expect(formatDisplayPrice(price)).toBe('$100.00')
  })

  it('is a range with a From label when Variants differ', () => {
    const { price } = toProductSummary(
      rawProduct({ priceRange: { minVariantPrice: cad('989.87'), maxVariantPrice: cad('9889.00') } }),
    )
    expect(price.isRange).toBe(true)
    expect(formatDisplayPrice(price)).toBe('From $989.87')
  })

  it('takes compareAt from the compare-at minimum when above min, and computes percentOff', () => {
    const { price } = toProductSummary(
      rawProduct({
        priceRange: { minVariantPrice: cad('75.00'), maxVariantPrice: cad('75.00') },
        compareAtPriceRange: { minVariantPrice: cad('100.00') },
      }),
    )
    expect(price.compareAt).toEqual(cad('100.00'))
    expect(price.percentOff).toBe(25)
  })

  it('never uses the range maximum as compareAt (#25)', () => {
    const { price } = toProductSummary(
      rawProduct({ priceRange: { minVariantPrice: cad('989.87'), maxVariantPrice: cad('9889.00') } }),
    )
    expect(price.compareAt).toBeNull()
    expect(price.percentOff).toBe(0)
  })

  it('ignores a compare-at price at or below min, or a missing compare-at range', () => {
    const equal = toProductSummary(rawProduct({ compareAtPriceRange: { minVariantPrice: cad('100.00') } }))
    expect(equal.price.compareAt).toBeNull()
    const zero = toProductSummary(rawProduct({ compareAtPriceRange: { minVariantPrice: cad('0.0') } }))
    expect(zero.price.compareAt).toBeNull()
    expect(toProductSummary(rawProduct({ compareAtPriceRange: undefined })).price.compareAt).toBeNull()
  })

  it('formats a non-range price without From', () => {
    const price: DisplayPrice = { min: cad('5.50'), max: cad('5.50'), isRange: false, compareAt: null, percentOff: 0 }
    expect(formatDisplayPrice(price)).toBe('$5.50')
  })
})

describe('toVariant', () => {
  it('keeps compareAtPrice only when above price', () => {
    expect(toVariant(rawVariant('v', 'S', 'Gold', { compareAtPrice: cad('150.00') })).compareAtPrice).toEqual(cad('150.00'))
    expect(toVariant(rawVariant('v', 'S', 'Gold', { compareAtPrice: cad('100.00') })).compareAtPrice).toBeNull()
    expect(toVariant(rawVariant('v', 'S', 'Gold', { compareAtPrice: null })).compareAtPrice).toBeNull()
  })
  it('copies the other fields', () => {
    const v = toVariant(rawVariant('v9', 'M', 'Silver', { image: image(5), availableForSale: false }))
    expect(v).toMatchObject({
      id: 'v9',
      title: 'M / Silver',
      availableForSale: false,
      price: cad('100.00'),
      image: image(5),
      selectedOptions: [
        { name: 'Size', value: 'M' },
        { name: 'Colour', value: 'Silver' },
      ],
    })
  })
})

describe('toProductSummary', () => {
  it('defaults tags and productType', () => {
    const s = toProductSummary(rawProduct())
    expect(s.tags).toEqual([])
    expect(s.productType).toBe('')
    const t = toProductSummary(rawProduct({ tags: ['a'], productType: 'Ring' }))
    expect(t.tags).toEqual(['a'])
    expect(t.productType).toBe('Ring')
  })
  it('takes images from the image edges, else the featured image, else none', () => {
    expect(toProductSummary(rawProduct()).images).toEqual([image(1), image(2)])
    expect(toProductSummary(rawProduct({ images: { edges: [] } })).images).toEqual([image(0)])
    expect(toProductSummary(rawProduct({ images: { edges: [] }, featuredImage: null })).images).toEqual([])
  })
  it('carries only summary fields', () => {
    const s = toProductSummary(rawProduct()) as unknown as Record<string, unknown>
    expect(s).not.toHaveProperty('variants')
    expect(s).not.toHaveProperty('options')
    expect(s).not.toHaveProperty('descriptionHtml')
    expect(s).toMatchObject({ id: 'gid://shopify/Product/1', handle: 'ring', vendor: 'HoM', featuredImage: image(0) })
  })
})

describe('toProduct', () => {
  it('adds descriptionHtml, options, variants and primaryCollection', () => {
    const p = toProduct(rawProduct({ collections: { edges: [{ node: { handle: 'rings', title: 'Rings' } }] } }))
    expect(p.descriptionHtml).toBe('<p>A ring</p>')
    expect(p.options).toEqual([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Colour', values: ['Gold', 'Silver'] },
    ])
    expect(p.variants.map((v) => v.id)).toEqual(['v1', 'v2', 'v3', 'v4'])
    expect(p.primaryCollection).toEqual({ handle: 'rings', title: 'Rings' })
    expect(p.price.min).toEqual(cad('100.00'))
  })
  it('has a null primaryCollection when there are none, and an empty descriptionHtml when missing', () => {
    const none = toProduct(rawProduct())
    expect(none.primaryCollection).toBeNull()
    expect(toProduct(rawProduct({ collections: { edges: [] } })).primaryCollection).toBeNull()
    const raw = rawProduct() as Partial<ShopifyProduct>
    delete raw.descriptionHtml
    expect(toProduct(raw as ShopifyProduct).descriptionHtml).toBe('')
  })
})

describe('toCollectionSummary', () => {
  it('keeps id, handle, title, description and image only', () => {
    const c = toCollectionSummary({
      id: 'c1',
      handle: 'rings',
      title: 'Rings',
      description: 'd',
      image: image(1),
      extra: 'x',
    } as never)
    expect(c).toEqual({ id: 'c1', handle: 'rings', title: 'Rings', description: 'd', image: image(1) })
  })
})

describe('defaultVariant', () => {
  it('prefers the first Variant available for sale, then the first, then null', () => {
    const base = toProduct(rawProduct())
    expect(defaultVariant(base)?.id).toBe('v1')
    const soldFirst = { ...base, variants: base.variants.map((v, i) => (i === 0 ? { ...v, availableForSale: false } : v)) }
    expect(defaultVariant(soldFirst)?.id).toBe('v2')
    const allSold = { ...base, variants: base.variants.map((v) => ({ ...v, availableForSale: false })) }
    expect(defaultVariant(allSold)?.id).toBe('v1')
    expect(defaultVariant({ ...base, variants: [] })).toBeNull()
  })
})

describe('variantWithOption', () => {
  const product = toProduct(rawProduct())
  const byId = (id: string) => product.variants.find((v) => v.id === id)!

  it('keeps the other current choices', () => {
    expect(variantWithOption(product, byId('v1'), 'Colour', 'Silver')?.id).toBe('v3') // S/Silver, not M/Silver
    expect(variantWithOption(product, byId('v1'), 'Size', 'M')?.id).toBe('v4') // M/Gold
  })
  it('matches on the one option when there is no current Variant', () => {
    expect(variantWithOption(product, null, 'Size', 'M')?.id).toBe('v2')
  })
  it('falls back to the first Variant with the value when no Variant matches every choice', () => {
    const sparse = { ...product, variants: [byId('v1'), byId('v2')] } // S/Gold, M/Silver
    expect(variantWithOption(sparse, byId('v1'), 'Colour', 'Silver')?.id).toBe('v2')
  })
  it('returns null when no Variant has the value', () => {
    expect(variantWithOption(product, byId('v1'), 'Colour', 'Bronze')).toBeNull()
  })
})
