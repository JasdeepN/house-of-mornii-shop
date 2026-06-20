import { describe, it, expect } from 'vitest'
import {
  getDemoCollections,
  getDemoCollection,
  getDemoProduct,
  getDemoProducts,
} from './demo-data'

describe('getDemoCollections', () => {
  it('returns 3 collections', () => {
    const collections = getDemoCollections()
    expect(collections).toHaveLength(3)
  })

  it('returns collections with correct handles', () => {
    const handles = getDemoCollections().map((c) => c.handle)
    expect(handles).toEqual(['everyday', 'festive', 'bridal'])
  })

  it('each collection has required fields', () => {
    for (const col of getDemoCollections()) {
      expect(col.id).toBeTruthy()
      expect(col.handle).toBeTruthy()
      expect(col.title).toBeTruthy()
      expect(col.description).toBeTruthy()
      expect(col.image).toBeTruthy()
      expect(col.products.edges.length).toBeGreaterThan(0)
    }
  })
})

describe('getDemoCollection', () => {
  it('returns a collection by handle', () => {
    const col = getDemoCollection('everyday')
    expect(col).not.toBeNull()
    expect(col!.handle).toBe('everyday')
    expect(col!.title).toBe('Everyday')
  })

  it('returns null for unknown handle', () => {
    expect(getDemoCollection('nonexistent')).toBeNull()
  })

  it('everyday collection has 4 products', () => {
    const col = getDemoCollection('everyday')
    expect(col!.products.edges).toHaveLength(4)
  })

  it('bridal collection has 4 products', () => {
    const col = getDemoCollection('bridal')
    expect(col!.products.edges).toHaveLength(4)
  })
})

describe('getDemoProduct', () => {
  it('returns a product by handle', () => {
    const product = getDemoProduct('aria-pendant')
    expect(product).not.toBeNull()
    expect(product!.handle).toBe('aria-pendant')
    expect(product!.title).toBe('Aria Pendant')
  })

  it('returns null for unknown handle', () => {
    expect(getDemoProduct('nonexistent')).toBeNull()
  })

  it('product has required fields', () => {
    const product = getDemoProduct('aria-pendant')!
    expect(product.id).toBeTruthy()
    expect(product.description).toBeTruthy()
    expect(product.descriptionHtml).toContain('<p>')
    expect(product.availableForSale).toBe(true)
    expect(product.featuredImage).toBeTruthy()
    expect(product.variants.edges).toHaveLength(1)
    expect(product.priceRange.minVariantPrice.currencyCode).toBe('CAD')
    expect(product.vendor).toBe('House of Mornii')
  })

  it('product with compareAtPrice has it set on variant', () => {
    const product = getDemoProduct('noor-chandeliers')!
    const variant = product.variants.edges[0].node
    expect(variant.compareAtPrice).not.toBeNull()
    expect(variant.compareAtPrice!.amount).toBe('225.00')
  })
})

describe('getDemoProducts', () => {
  it('returns all 12 products', () => {
    expect(getDemoProducts()).toHaveLength(12)
  })

  it('all products have unique handles', () => {
    const handles = getDemoProducts().map((p) => p.handle)
    const unique = new Set(handles)
    expect(unique.size).toBe(handles.length)
  })

  it('all products have CAD pricing', () => {
    for (const product of getDemoProducts()) {
      expect(product.priceRange.minVariantPrice.currencyCode).toBe('CAD')
    }
  })
})
