// Shopify Storefront API types
// Matches the GraphQL Storefront API 2026-01 schema

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyImage {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface ShopifyProductVariant {
  id: string
  title: string
  availableForSale: boolean
  price: ShopifyMoney
  compareAtPrice: ShopifyMoney | null
  selectedOptions: { name: string; value: string }[]
  image: ShopifyImage | null
}

export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  featuredImage: ShopifyImage | null
  images: { edges: { node: ShopifyImage }[] }
  options: { id: string; name: string; values: string[] }[]
  variants: { edges: { node: ShopifyProductVariant }[] }
  priceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  tags?: string[]
  vendor: string
}

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  description: string
  image: ShopifyImage | null
  products: {
    edges: { node: ShopifyProduct; cursor: string }[]
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

export interface ShopifyCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: {
      handle: string
      title: string
      featuredImage: ShopifyImage | null
    }
    price: ShopifyMoney
    selectedOptions: { name: string; value: string }[]
    image: ShopifyImage | null
  }
  cost: {
    totalAmount: ShopifyMoney
    amountPerQuantity: ShopifyMoney
  }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: {
    edges: { node: ShopifyCartLine }[]
  }
  cost: {
    subtotalAmount: ShopifyMoney
    totalAmount: ShopifyMoney
    totalTaxAmount: ShopifyMoney | null
  }
}

// Helper to flatten edges/node structure
export function flattenEdges<T>(connection: { edges: { node: T }[] }): T[] {
  return connection.edges.map((edge) => edge.node)
}

// Format Shopify money to CAD display string
export function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(parseFloat(money.amount))
}
