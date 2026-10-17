import { describe, it, expect } from 'vitest'
import {
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from './queries'

describe('queries', () => {
  describe('Collection Queries', () => {
    it('COLLECTIONS_QUERY is a non-empty string', () => {
      expect(typeof COLLECTIONS_QUERY).toBe('string')
      expect(COLLECTIONS_QUERY.length).toBeGreaterThan(0)
    })

    it('COLLECTIONS_QUERY contains a query operation', () => {
      expect(COLLECTIONS_QUERY).toContain('query Collections')
    })

    it('COLLECTIONS_QUERY contains collections field', () => {
      expect(COLLECTIONS_QUERY).toContain('collections')
    })

    it('COLLECTIONS_QUERY contains ImageFields fragment', () => {
      expect(COLLECTIONS_QUERY).toContain('ImageFields')
    })

    it('COLLECTION_BY_HANDLE_QUERY is a non-empty string', () => {
      expect(typeof COLLECTION_BY_HANDLE_QUERY).toBe('string')
      expect(COLLECTION_BY_HANDLE_QUERY.length).toBeGreaterThan(0)
    })

    it('COLLECTION_BY_HANDLE_QUERY contains query operation with variables', () => {
      expect(COLLECTION_BY_HANDLE_QUERY).toContain('query CollectionByHandle')
      expect(COLLECTION_BY_HANDLE_QUERY).toContain('$handle')
      expect(COLLECTION_BY_HANDLE_QUERY).toContain('$first')
    })

    it('COLLECTION_BY_HANDLE_QUERY contains ProductCardFields fragment', () => {
      expect(COLLECTION_BY_HANDLE_QUERY).toContain('ProductCardFields')
    })
  })

  describe('Product Queries', () => {
    it('PRODUCTS_QUERY is a non-empty string', () => {
      expect(typeof PRODUCTS_QUERY).toBe('string')
      expect(PRODUCTS_QUERY.length).toBeGreaterThan(0)
    })

    it('PRODUCTS_QUERY contains query operation with variables', () => {
      expect(PRODUCTS_QUERY).toContain('query Products')
      expect(PRODUCTS_QUERY).toContain('$first')
      expect(PRODUCTS_QUERY).toContain('$sortKey')
      expect(PRODUCTS_QUERY).toContain('$reverse')
      expect(PRODUCTS_QUERY).toContain('$query')
    })

    it('card fragment carries two Variants with id and availability for quick-add', () => {
      expect(PRODUCTS_QUERY).toMatch(/variants\(first: 2\) \{ edges \{ node \{ id availableForSale \} \} \}/)
    })

    it('PRODUCTS_QUERY contains ProductCardFields fragment', () => {
      expect(PRODUCTS_QUERY).toContain('ProductCardFields')
    })

    it('PRODUCT_BY_HANDLE_QUERY is a non-empty string', () => {
      expect(typeof PRODUCT_BY_HANDLE_QUERY).toBe('string')
      expect(PRODUCT_BY_HANDLE_QUERY.length).toBeGreaterThan(0)
    })

    it('PRODUCT_BY_HANDLE_QUERY contains query operation with handle variable', () => {
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('query ProductByHandle')
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('$handle')
    })

    it('PRODUCT_BY_HANDLE_QUERY contains VariantFields fragment', () => {
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('VariantFields')
    })

    it('PRODUCT_BY_HANDLE_QUERY contains images field', () => {
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('images')
    })

    it('PRODUCT_BY_HANDLE_QUERY contains options field', () => {
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('options')
    })

    it('PRODUCT_BY_HANDLE_QUERY contains variants field', () => {
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('variants')
    })

    it('PRODUCT_BY_HANDLE_QUERY contains collections field', () => {
      expect(PRODUCT_BY_HANDLE_QUERY).toContain('collections')
    })
  })

  describe('Cart Mutations', () => {
    it('CART_CREATE_MUTATION is a non-empty string', () => {
      expect(typeof CART_CREATE_MUTATION).toBe('string')
      expect(CART_CREATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CART_CREATE_MUTATION contains mutation operation', () => {
      expect(CART_CREATE_MUTATION).toContain('mutation CartCreate')
      expect(CART_CREATE_MUTATION).toContain('cartCreate')
    })

    it('CART_CREATE_MUTATION contains CartFields fragment', () => {
      expect(CART_CREATE_MUTATION).toContain('CartFields')
    })

    it('CART_QUERY is a non-empty string', () => {
      expect(typeof CART_QUERY).toBe('string')
      expect(CART_QUERY.length).toBeGreaterThan(0)
    })

    it('CART_QUERY contains query operation with cartId variable', () => {
      expect(CART_QUERY).toContain('query Cart')
      expect(CART_QUERY).toContain('$cartId')
    })

    it('CART_LINES_ADD_MUTATION is a non-empty string', () => {
      expect(typeof CART_LINES_ADD_MUTATION).toBe('string')
      expect(CART_LINES_ADD_MUTATION.length).toBeGreaterThan(0)
    })

    it('CART_LINES_ADD_MUTATION contains mutation operation', () => {
      expect(CART_LINES_ADD_MUTATION).toContain('mutation CartLinesAdd')
      expect(CART_LINES_ADD_MUTATION).toContain('cartLinesAdd')
    })

    it('CART_LINES_UPDATE_MUTATION is a non-empty string', () => {
      expect(typeof CART_LINES_UPDATE_MUTATION).toBe('string')
      expect(CART_LINES_UPDATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CART_LINES_UPDATE_MUTATION contains mutation operation', () => {
      expect(CART_LINES_UPDATE_MUTATION).toContain('mutation CartLinesUpdate')
      expect(CART_LINES_UPDATE_MUTATION).toContain('cartLinesUpdate')
    })

    it('CART_LINES_REMOVE_MUTATION is a non-empty string', () => {
      expect(typeof CART_LINES_REMOVE_MUTATION).toBe('string')
      expect(CART_LINES_REMOVE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CART_LINES_REMOVE_MUTATION contains mutation operation', () => {
      expect(CART_LINES_REMOVE_MUTATION).toContain('mutation CartLinesRemove')
      expect(CART_LINES_REMOVE_MUTATION).toContain('cartLinesRemove')
    })
  })
})
