import { describe, expect, it } from 'vitest'
import { isValidCheckoutUrl } from './cart'

describe('isValidCheckoutUrl', () => {
  it('rejects placeholder and non-Shopify checkout URLs', () => {
    expect(isValidCheckoutUrl('#')).toBe(false)
    expect(isValidCheckoutUrl('https://example.com/checkout')).toBe(false)
  })

  it('accepts valid Shopify checkout URLs', () => {
    expect(isValidCheckoutUrl('https://house-of-mornii.myshopify.com/checkouts/c/123')).toBe(true)
  })
})