import { describe, expect, it } from 'vitest'
import { checkoutLink, isValidCheckoutUrl } from './cart'

describe('isValidCheckoutUrl', () => {
  it('rejects placeholder and non-Shopify checkout URLs', () => {
    expect(isValidCheckoutUrl('#')).toBe(false)
    expect(isValidCheckoutUrl('https://example.com/checkout')).toBe(false)
  })

  it('accepts valid Shopify checkout URLs', () => {
    expect(isValidCheckoutUrl('https://house-of-mornii.myshopify.com/checkouts/c/123')).toBe(true)
  })

  it('accepts the branded checkout hosts over https', () => {
    expect(isValidCheckoutUrl('https://checkout.houseofmornii.com/cart/c/abc')).toBe(true)
    expect(isValidCheckoutUrl('https://checkout-dev.houseofmornii.com/cart/c/abc')).toBe(true)
  })

  it('rejects lookalike and insecure hosts', () => {
    expect(isValidCheckoutUrl('https://checkout.houseofmornii.com.evil.com/x')).toBe(false)
    expect(isValidCheckoutUrl('https://evilcheckout.houseofmornii.com/x')).toBe(false)
    expect(isValidCheckoutUrl('https://houseofmornii.com/x')).toBe(false)
    expect(isValidCheckoutUrl('http://checkout.houseofmornii.com/x')).toBe(false)
  })
})

describe('checkoutLink', () => {
  const base = 'https://checkout.houseofmornii.com/cart/c/abc'

  it('returns the URL unchanged when signed out', () => {
    expect(checkoutLink(base, false)).toBe(base)
  })

  it('adds sso=silent when signed in', () => {
    expect(checkoutLink(base, true)).toBe(`${base}?sso=silent`)
  })

  it('preserves existing params', () => {
    const url = new URL(checkoutLink(`${base}?key=k1&a=b`, true))
    expect(url.searchParams.get('key')).toBe('k1')
    expect(url.searchParams.get('a')).toBe('b')
    expect(url.searchParams.get('sso')).toBe('silent')
  })

  it('preserves the fragment', () => {
    expect(checkoutLink(`${base}#frag`, true)).toBe(`${base}?sso=silent#frag`)
  })

  it('does not duplicate an existing sso param', () => {
    const url = new URL(checkoutLink(`${base}?sso=other&x=1`, true))
    expect(url.searchParams.getAll('sso')).toEqual(['silent'])
    expect(url.searchParams.get('x')).toBe('1')
  })
})
