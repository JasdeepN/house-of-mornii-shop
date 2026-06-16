# Shopify Storefront API Documentation

This document provides comprehensive documentation for the Shopify Storefront API integration in the House of Mornii Shop application.

## Overview

The application integrates with Shopify Storefront API v2026-01 to provide product browsing, collection navigation, and cart functionality. The integration supports three operational modes:

| Mode | Condition | Behavior |
|------|-----------|----------|
| `demo` | No valid credentials | Uses fixture data, no API calls |
| `tokenless` | Domain only | Limited fields (no tags, metafields) |
| `token` | Domain + token | Full API access |

## API Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SHOPIFY_STORE_DOMAIN` | Yes | Your `*.myshopify.com` storefront domain |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Recommended | Public Storefront API access token |

### API Endpoint

```
POST https://{domain}/api/2026-01/graphql.json
```

## Core Modules

### `@/lib/shopify/client`

Main API client module with exports:

| Export | Type | Description |
|--------|------|-------------|
| `STOREFRONT_MODE` | `StorefrontMode` | Current operational mode ('demo' \| 'tokenless' \| 'token') |
| `IS_CONFIGURED` | `boolean` | True when valid credentials present |
| `shopifyFetch<T>()` | `function` | Execute GraphQL queries/mutations |
| `StorefrontError` | `class` | Typed error handling |

### `@/lib/shopify/hooks`

React Query hooks for data fetching:

| Hook | Returns | Description |
|------|---------|-------------|
| `useCollections()` | `ShopifyCollection[]` | All collections |
| `useCollection(handle)` | `ShopifyCollection` | Single collection by handle |
| `useProduct(handle)` | `ShopifyProduct` | Single product by handle |
| `useProducts()` | `ShopifyProduct[]` | All products |
| `useRelatedProducts(handle)` | `ShopifyProduct[]` | Related products |

### `@/lib/shopify/types`

TypeScript interfaces matching Shopify Storefront API schema:

| Interface | Description |
|-----------|-------------|
| `ShopifyMoney` | Currency amount |
| `ShopifyImage` | Product image data |
| `ShopifyProductVariant` | Product variant information |
| `ShopifyProduct` | Product data |
| `ShopifyCollection` | Collection data |
| `ShopifyCartLine` | Cart line item |
| `ShopifyCart` | Shopping cart |

## GraphQL Queries

### Collections

#### `COLLECTIONS_QUERY`

Fetches first 20 collections with product counts.

**Variables:** None

**Returns:** `collections.edges[].node` with handle, title, description, image, product count

#### `COLLECTION_BY_HANDLE_QUERY`

Fetches single collection with products (token mode).

**Variables:**
- `$handle: String!` - Collection handle
- `$first: Int!` - Number of products
- `$after: String` - Pagination cursor
- `$sortKey: ProductCollectionSortKeys` - Sort field
- `$reverse: Boolean` - Sort direction

**Returns:** Collection with products connection

#### `COLLECTION_BY_HANDLE_QUERY_TOKENLESS`

Same as above but without token-gated fields.

### Products

#### `PRODUCTS_QUERY`

Fetches products with pagination.

**Variables:**
- `$first: Int!` - Number of products
- `$after: String` - Pagination cursor
- `$sortKey: ProductSortKeys` - Sort field
- `$reverse: Boolean` - Sort direction
- `$query: String` - Search query

**Returns:** Products connection

#### `PRODUCT_BY_HANDLE_QUERY`

Fetches single product by handle (token mode).

**Variables:**
- `$handle: String!` - Product handle

**Returns:** Complete product with variants, images, options, price range, tags

#### `PRODUCT_BY_HANDLE_QUERY_TOKENLESS`

Same as above but without token-gated fields (no tags).

### Cart Operations

#### `CART_CREATE_MUTATION`

Create new cart.

**Variables:**
- `$lines: [CartLineInput!]!` - Array of cart lines with variant ID and quantity

**Returns:** Cart object with checkout URL

#### `CART_QUERY`

Fetch cart by ID.

**Variables:**
- `$cartId: ID!` - Cart ID

**Returns:** Complete cart object

#### `CART_LINES_ADD_MUTATION`

Add items to cart.

**Variables:**
- `$cartId: ID!` - Cart ID
- `$lines: [CartLineInput!]!` - Lines to add

**Returns:** Updated cart

#### `CART_LINES_UPDATE_MUTATION`

Update cart line quantity.

**Variables:**
- `$cartId: ID!` - Cart ID
- `$lines: [CartLineUpdateInput!]!` - Lines with ID and quantity

**Returns:** Updated cart

#### `CART_LINES_REMOVE_MUTATION`

Remove items from cart.

**Variables:**
- `$cartId: ID!` - Cart ID
- `$lineIds: [ID!]!` - Line IDs to remove

**Returns:** Updated cart

## Data Types

### ShopifyMoney

```typescript
interface ShopifyMoney {
  amount: string    // Numeric amount as string
  currencyCode: string  // ISO 4217 currency code (e.g., 'CAD', 'USD')
}
```

### ShopifyImage

```typescript
interface ShopifyImage {
  url: string       // Image URL with width parameter support
  altText: string | null
  width: number
  height: number
}
```

### ShopifyProduct

```typescript
interface ShopifyProduct {
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
  tags?: string[]           // Token-gated field
  vendor: string
}
```

### ShopifyCart

```typescript
interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  lines: { edges: { node: ShopifyCartLine }[] }
  cost: {
    subtotalAmount: ShopifyMoney
    totalAmount: ShopifyMoney
    totalTaxAmount: ShopifyMoney | null
  }
}
```

## Error Handling

### StorefrontError Categories

| Category | HTTP Status | Cause | Retryable |
|----------|-------------|-------|-----------|
| `not_found` | 404 | Resource doesn't exist | No |
| `misconfigured` | 401/403 | Invalid credentials | No |
| `upstream_unavailable` | 5xx | Shopify service error | Yes |
| `query_error` | GraphQL errors | Malformed query | Depends |

### Error Handling Pattern

```typescript
import { StorefrontError } from '@/lib/shopify'

try {
  const product = await useProduct('my-product')
} catch (error) {
  if (error instanceof StorefrontError) {
    switch (error.category) {
      case 'not_found':
        // Show 404 page
        break
      case 'misconfigured':
        // Show configuration error
        break
      case 'upstream_unavailable':
        // Show retry button
        break
      case 'query_error':
        // Log and show generic error
        break
    }
  }
}
```

## Demo Mode

When `STOREFRONT_MODE === 'demo'`:

- All hooks return data from `src/lib/shopify/demo-data.ts`
- No API calls are made
- Cart is in-memory only (resets on page reload)
- Console warning logged in dev mode

## Testing

### Unit Tests

Test files: `src/lib/shopify/*.test.ts{,x}`

Run tests:
```bash
npm run test              # Watch mode
npm run test:run          # Single run
npx vitest run src/lib/shopify/client.test.ts  # Single file
```

### E2E Tests

Test files: `e2e/*.spec.ts`

Run tests:
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with UI
```

## Best Practices

### 1. Always Check Mode

```typescript
import { STOREFRONT_MODE } from '@/lib/shopify/client'

if (STOREFRONT_MODE === 'demo') {
  // Use demo data
} else {
  // Use API
}
```

### 2. Use Hooks for Data Fetching

```typescript
import { useProduct } from '@/lib/shopify'

function ProductPage({ handle }: { handle: string }) {
  const { data, isLoading, error } = useProduct(handle)
  
  if (isLoading) return <Loading />
  if (error) return <Error error={error} />
  
  return <Product product={data} />
}
```

### 3. Handle Pagination

```typescript
import { useCollection } from '@/lib/shopify'

function CollectionPage({ handle }: { handle: string }) {
  const { data, fetchNextPage, hasNextPage } = useCollection(handle)
  
  return (
    <>
      {data.products.edges.map(product => (
        <ProductCard key={product.node.id} product={product.node} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </>
  )
}
```

### 4. Optimize Images

Shopify images support width parameter:
```typescript
const imageUrl = `${product.featuredImage.url}&width=800`
```

## Troubleshooting

### Common Issues

1. **Demo mode in production**
   - Error: "Storefront Not Configured"
   - Solution: Set `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN`

2. **Tokenless mode limitations**
   - Missing: tags, metafields, customer APIs
   - Solution: Add `VITE_SHOPIFY_STOREFRONT_TOKEN`

3. **GraphQL errors**
   - Check: Query syntax, field permissions, API version
   - Solution: Update queries in `src/lib/shopify/queries.ts`

## Related Documentation

- [`shopify-error-handling-guide.md`](./shopify-error-handling-guide.md) - Detailed error handling
- [`shopify-auth-mode-setup.md`](./shopify-auth-mode-setup.md) - Configuration guide
- [`demo-mode-developer-guide.md`](./demo-mode-developer-guide.md) - Demo mode details
- [`shopify-dev-store-audit.md`](./shopify-dev-store-audit.md) - Store setup checklist
