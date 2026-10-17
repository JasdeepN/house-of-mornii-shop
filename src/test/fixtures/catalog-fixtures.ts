// Domain fixtures for page tests that mock the Catalog hooks.
// Built from the raw Storefront fixtures through the Catalog mappers. Test-only.

import {
  toCollectionSummary,
  toProduct,
  toProductSummary,
  type CollectionSummary,
  type Product,
  type ProductSummary,
} from '@/lib/shopify/catalog'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { getFixtureCollections, getFixtureProduct, getFixtureProducts } from './shopify-fixtures'

export function fixtureProductSummaries(): ProductSummary[] {
  return getFixtureProducts().map(toProductSummary)
}

/** The Product with this handle; throws when the fixtures have none, so a typo fails loudly. */
export function fixtureProduct(handle: string): Product {
  const raw = getFixtureProduct(handle)
  if (!raw) throw new Error(`No fixture Product with handle "${handle}"`)
  return toProduct(raw)
}

export function fixtureCollectionSummaries(): CollectionSummary[] {
  return getFixtureCollections().map(toCollectionSummary)
}

/**
 * A Product built from a fixture with its prices replaced, for price cases such as #25
 * (a $989.87 to $9,889.00 range must not show a compare-at price).
 */
export function fixtureProductWithPrices(
  handle: string,
  prices: { min: string; max?: string; compareAt?: string },
  currencyCode = 'CAD',
): Product {
  const raw = getFixtureProduct(handle)
  if (!raw) throw new Error(`No fixture Product with handle "${handle}"`)
  const money = (amount: string) => ({ amount, currencyCode })
  const priced: ShopifyProduct = {
    ...raw,
    priceRange: { minVariantPrice: money(prices.min), maxVariantPrice: money(prices.max ?? prices.min) },
    compareAtPriceRange: prices.compareAt ? { minVariantPrice: money(prices.compareAt) } : undefined,
  }
  return toProduct(priced)
}
