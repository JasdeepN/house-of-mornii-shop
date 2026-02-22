import { describe, it, expect } from 'vitest'
import { flattenEdges, formatMoney } from './types'
import type { ShopifyMoney } from './types'

describe('flattenEdges', () => {
  it('unwraps edges/node structure', () => {
    const connection = {
      edges: [
        { node: { id: '1', name: 'A' } },
        { node: { id: '2', name: 'B' } },
      ],
    }
    const result = flattenEdges(connection)
    expect(result).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ])
  })

  it('returns empty array for empty edges', () => {
    const connection = { edges: [] }
    expect(flattenEdges(connection)).toEqual([])
  })
})

describe('formatMoney', () => {
  it('formats CAD currency correctly', () => {
    const money: ShopifyMoney = { amount: '89.00', currencyCode: 'CAD' }
    const result = formatMoney(money)
    // Intl may render as "CA$89.00" or "$89.00" depending on locale
    expect(result).toContain('89.00')
  })

  it('formats USD currency', () => {
    const money: ShopifyMoney = { amount: '125.50', currencyCode: 'USD' }
    const result = formatMoney(money)
    expect(result).toContain('125.50')
  })

  it('formats zero amount', () => {
    const money: ShopifyMoney = { amount: '0.00', currencyCode: 'CAD' }
    const result = formatMoney(money)
    expect(result).toContain('0.00')
  })

  it('handles large amounts with commas', () => {
    const money: ShopifyMoney = { amount: '1250.00', currencyCode: 'CAD' }
    const result = formatMoney(money)
    // Should contain 1,250.00 or 1250.00 depending on locale
    expect(result).toMatch(/1,?250\.00/)
  })
})
