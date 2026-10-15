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
  CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
  CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION,
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_RECOVER_MUTATION,
  CUSTOMER_RESET_MUTATION,
  CUSTOMER_UPDATE_MUTATION,
  CART_CREATE_WITH_AUTH_URL_MUTATION,
  CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION,
  CUSTOMER_QUERY,
  CUSTOMER_BY_ACCESS_TOKEN_QUERY,
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
  CUSTOMER_ADDRESS_DELETE_MUTATION,
  CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
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

  describe('Customer Mutations', () => {
    it('CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION).toBe('string')
      expect(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION).toContain('mutation customerAccessTokenCreate')
      expect(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION).toContain('customerAccessTokenCreate')
    })

    it('CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION contains accessToken and expiresAt', () => {
      expect(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION).toContain('accessToken')
      expect(CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION).toContain('expiresAt')
    })

    it('CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION).toBe('string')
      expect(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION).toContain('mutation customerAccessTokenDelete')
      expect(CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION).toContain('customerAccessTokenDelete')
    })

    it('CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION).toBe('string')
      expect(CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION).toContain('mutation customerAccessTokenRenew')
      expect(CUSTOMER_ACCESS_TOKEN_RENEW_MUTATION).toContain('customerAccessTokenRenew')
    })

    it('CUSTOMER_CREATE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_CREATE_MUTATION).toBe('string')
      expect(CUSTOMER_CREATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_CREATE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_CREATE_MUTATION).toContain('mutation customerCreate')
      expect(CUSTOMER_CREATE_MUTATION).toContain('customerCreate')
    })

    it('CUSTOMER_CREATE_MUTATION contains customer fields', () => {
      expect(CUSTOMER_CREATE_MUTATION).toContain('firstName')
      expect(CUSTOMER_CREATE_MUTATION).toContain('lastName')
      expect(CUSTOMER_CREATE_MUTATION).toContain('email')
      expect(CUSTOMER_CREATE_MUTATION).toContain('phone')
      expect(CUSTOMER_CREATE_MUTATION).toContain('acceptsMarketing')
    })

    it('CUSTOMER_RECOVER_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_RECOVER_MUTATION).toBe('string')
      expect(CUSTOMER_RECOVER_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_RECOVER_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_RECOVER_MUTATION).toContain('mutation customerRecover')
      expect(CUSTOMER_RECOVER_MUTATION).toContain('customerRecover')
    })

    it('CUSTOMER_RESET_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_RESET_MUTATION).toBe('string')
      expect(CUSTOMER_RESET_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_RESET_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_RESET_MUTATION).toContain('mutation customerReset')
      expect(CUSTOMER_RESET_MUTATION).toContain('customerReset')
    })

    it('CUSTOMER_UPDATE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_UPDATE_MUTATION).toBe('string')
      expect(CUSTOMER_UPDATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_UPDATE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_UPDATE_MUTATION).toContain('mutation customerUpdate')
      expect(CUSTOMER_UPDATE_MUTATION).toContain('customerUpdate')
    })

    it('CUSTOMER_UPDATE_MUTATION contains customerAccessToken variable', () => {
      expect(CUSTOMER_UPDATE_MUTATION).toContain('$customerAccessToken')
    })
  })

  describe('Cart Auth Mutations', () => {
    it('CART_CREATE_WITH_AUTH_URL_MUTATION is a non-empty string', () => {
      expect(typeof CART_CREATE_WITH_AUTH_URL_MUTATION).toBe('string')
      expect(CART_CREATE_WITH_AUTH_URL_MUTATION.length).toBeGreaterThan(0)
    })

    it('CART_CREATE_WITH_AUTH_URL_MUTATION contains cartBuyerIdentity', () => {
      expect(CART_CREATE_WITH_AUTH_URL_MUTATION).toContain('cartBuyerIdentity')
      expect(CART_CREATE_WITH_AUTH_URL_MUTATION).toContain('authenticationUrl')
    })

    it('CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION is a non-empty string', () => {
      expect(typeof CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION).toBe('string')
      expect(CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION.length).toBeGreaterThan(0)
    })

    it('CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION contains cartBuyerIdentityUpdate', () => {
      expect(CART_MERGE_WITH_CUSTOMER_ACCESS_TOKEN_MUTATION).toContain('cartBuyerIdentityUpdate')
    })
  })

  describe('Customer Queries', () => {
    it('CUSTOMER_QUERY is a non-empty string', () => {
      expect(typeof CUSTOMER_QUERY).toBe('string')
      expect(CUSTOMER_QUERY.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_QUERY contains query operation with customerAccessToken variable', () => {
      expect(CUSTOMER_QUERY).toContain('query Customer')
      expect(CUSTOMER_QUERY).toContain('$customerAccessToken')
    })

    it('CUSTOMER_QUERY contains addresses field', () => {
      expect(CUSTOMER_QUERY).toContain('addresses')
    })

    it('CUSTOMER_QUERY contains orders field', () => {
      expect(CUSTOMER_QUERY).toContain('orders')
    })

    it('CUSTOMER_BY_ACCESS_TOKEN_QUERY is a non-empty string', () => {
      expect(typeof CUSTOMER_BY_ACCESS_TOKEN_QUERY).toBe('string')
      expect(CUSTOMER_BY_ACCESS_TOKEN_QUERY.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_BY_ACCESS_TOKEN_QUERY contains query operation', () => {
      expect(CUSTOMER_BY_ACCESS_TOKEN_QUERY).toContain('query CustomerByAccessToken')
    })
  })

  describe('Customer Address Mutations', () => {
    it('CUSTOMER_ADDRESS_CREATE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_ADDRESS_CREATE_MUTATION).toBe('string')
      expect(CUSTOMER_ADDRESS_CREATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_ADDRESS_CREATE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_ADDRESS_CREATE_MUTATION).toContain('mutation customerAddressCreate')
      expect(CUSTOMER_ADDRESS_CREATE_MUTATION).toContain('customerAddressCreate')
    })

    it('CUSTOMER_ADDRESS_UPDATE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_ADDRESS_UPDATE_MUTATION).toBe('string')
      expect(CUSTOMER_ADDRESS_UPDATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_ADDRESS_UPDATE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_ADDRESS_UPDATE_MUTATION).toContain('mutation customerAddressUpdate')
      expect(CUSTOMER_ADDRESS_UPDATE_MUTATION).toContain('customerAddressUpdate')
    })

    it('CUSTOMER_ADDRESS_DELETE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_ADDRESS_DELETE_MUTATION).toBe('string')
      expect(CUSTOMER_ADDRESS_DELETE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_ADDRESS_DELETE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_ADDRESS_DELETE_MUTATION).toContain('mutation customerAddressDelete')
      expect(CUSTOMER_ADDRESS_DELETE_MUTATION).toContain('customerAddressDelete')
    })

    it('CUSTOMER_ADDRESS_DELETE_MUTATION contains deletedCustomerAddressId', () => {
      expect(CUSTOMER_ADDRESS_DELETE_MUTATION).toContain('deletedCustomerAddressId')
    })

    it('CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION is a non-empty string', () => {
      expect(typeof CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION).toBe('string')
      expect(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION.length).toBeGreaterThan(0)
    })

    it('CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION contains mutation operation', () => {
      expect(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION).toContain('mutation customerDefaultAddressUpdate')
      expect(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION).toContain('customerDefaultAddressUpdate')
    })

    it('CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION contains defaultAddress', () => {
      expect(CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION).toContain('defaultAddress')
    })
  })
})
