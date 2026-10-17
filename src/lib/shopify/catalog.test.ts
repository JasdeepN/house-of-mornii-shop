import { describe, expect, it } from 'vitest'
import {
  defaultVariant,
  formatDisplayPrice,
  parseProductSort,
  shopifySortFor,
  toCollectionSummary,
  toProduct,
  toProductSummary,
  toVariant,
  variantWithOption,
  type DisplayPrice,
} from './catalog'
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

describe('parseProductSort', () => {
  it('accepts known sorts and rejects everything else', () => {
    expect(parseProductSort('price-asc')).toBe('price-asc')
    expect(parseProductSort('title-asc')).toBe('title-asc')
    for (const bad of [null, undefined, '', 'BEST_SELLING', 'junk']) {
      expect(parseProductSort(bad)).toBeUndefined()
    }
  })
})

describe('shopifySortFor', () => {
  it('uses each listing own order when no sort is chosen', () => {
    expect(shopifySortFor(undefined, 'products')).toEqual({ sortKey: 'BEST_SELLING', reverse: false })
    expect(shopifySortFor(undefined, 'collection')).toEqual({ sortKey: 'COLLECTION_DEFAULT', reverse: false })
  })
  it('maps best-selling for both targets', () => {
    expect(shopifySortFor('best-selling', 'products')).toEqual({ sortKey: 'BEST_SELLING', reverse: false })
    expect(shopifySortFor('best-selling', 'collection')).toEqual({ sortKey: 'BEST_SELLING', reverse: false })
  })
  it('uses CREATED_AT for Products and CREATED for a Collection', () => {
    expect(shopifySortFor('newest', 'products')).toEqual({ sortKey: 'CREATED_AT', reverse: true })
    expect(shopifySortFor('newest', 'collection')).toEqual({ sortKey: 'CREATED', reverse: true })
  })
  it('maps price and title sorts', () => {
    expect(shopifySortFor('price-asc', 'products')).toEqual({ sortKey: 'PRICE', reverse: false })
    expect(shopifySortFor('price-desc', 'collection')).toEqual({ sortKey: 'PRICE', reverse: true })
    expect(shopifySortFor('title-asc', 'products')).toEqual({ sortKey: 'TITLE', reverse: false })
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
