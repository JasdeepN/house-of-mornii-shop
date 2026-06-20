# Research: Shopify Dev Store Audit Guide

**Ticket:** #17 — Research: Audit Shopify dev store setup and verify Storefront API scopes

This document outlines what to verify once a Shopify partner dev store is provisioned. It serves as both a checklist and a reference for understanding what the House of Mornii storefront integration requires.

---

## Storefront API Requirements

The frontend (`src/lib/shopify/client.ts`) connects to:

```
https://{store-domain}/api/2026-01/graphql.json
```

### Required Storefront API Scopes

When creating a Headless channel or Custom app access token, ensure these `unauthenticated_read_*` scopes are checked:

| Scope | Used For |
|-------|----------|
| `unauthenticated_read_product_listings` | Product grid, PDP, search |
| `unauthenticated_read_product_inventory` | In-stock / sold-out display |
| `unauthenticated_read_selling_plans` | Subscription/recurring pricing (future) |
| `unauthenticated_read_checkouts` | Cart checkout creation |
| `unauthenticated_write_checkouts` | Cart line item mutations |
| `unauthenticated_read_customer_tags` | Optional — for personalization |
| `unauthenticated_read_content` | Optional — blog/article pages |

### How to Create the Storefront Token

1. Shopify Admin: **Sales channels → Add channel → Headless** (or go to **Apps → Develop apps → Create an app**)
2. Under **API credentials → Storefront API access scopes** — check all `unauthenticated_read_*` scopes listed above plus `unauthenticated_write_checkouts`
3. Click **Install app** / **Save**
4. Copy the **Storefront API access token** (shown once — save it immediately)
5. The store domain is the `.myshopify.com` domain (e.g., `house-of-mornii.myshopify.com`)

---

## Product and Collection Setup Checklist

For the dev store to render correctly with the House of Mornii frontend, verify:

### Collections

- [ ] At least 3 collections created (matching the demo data categories)
  - Suggested: "The Gala Collection", "The Bridal Suite", "Heritage Pieces"
- [ ] Each collection has a title, description, and at least one image
- [ ] Collections are **published** to the Headless / Storefront API channel

### Products

- [ ] At least 8-12 products across collections
- [ ] Each product has:
  - [ ] Title
  - [ ] Description (HTML body)
  - [ ] At least 1 product image (1:1 or 4:3 ratio recommended)
  - [ ] Price set in the store currency
  - [ ] At least one **variant** (even if just "Default Title")
  - [ ] Inventory tracked (even if set to "Continue selling when out of stock")
- [ ] Products are published to the Headless / Storefront channel

### GraphQL Query Verification

Run these queries against the Storefront API to confirm data is accessible:

```graphql
# In the Storefront API playground (Admin → Apps → Your App → Storefront API Explorer)

# Test 1: Collections load
query {
  collections(first: 10) {
    nodes {
      id
      title
      handle
      image { url }
    }
  }
}

# Test 2: Products in a collection load
query {
  collection(handle: "the-gala-collection") {
    products(first: 12) {
      nodes {
        id
        title
        handle
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 1) { nodes { url altText } }
        variants(first: 10) {
          nodes { id title availableForSale price { amount } }
        }
      }
    }
  }
}

# Test 3: Cart creation
mutation {
  cartCreate(input: {}) {
    cart { id checkoutUrl }
  }
}
```

---

## Cart and Checkout Verification

1. Add a product to cart (via the frontend UI or the GraphQL mutation above)
2. Confirm a cart ID is returned and stored in `localStorage['hom-cart-id']`
3. Click the checkout button in the cart flyout
4. Verify the URL redirects to `https://{store}.myshopify.com/cart/{token}` (or the Shopify-hosted checkout)
5. For test orders, use the Shopify **Bogus Gateway** (Admin → Settings → Payments → Test mode)

---

## Configuration Keys for `.env.local`

```ini
VITE_SHOPIFY_STORE_DOMAIN=house-of-mornii.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
```

> **Note:** Do NOT use the Admin API key here. The Storefront API token is different and has public-safe read access only (with write access scoped to checkout creation only).

---

## Known GraphQL Queries in Use

See `src/lib/shopify/queries.ts` for all queries. Key operations:
- `GET_COLLECTIONS` — collection browser
- `GET_COLLECTION` — single collection with paginated products
- `GET_PRODUCT` — full PDP with variants
- `GET_PRODUCTS` — shop page listing
- `CART_CREATE` / `CART_LINES_ADD` / `CART_LINES_UPDATE` — cart mutations

All queries target API version `2026-01`. If the dev store uses an older API version, update `SHOPIFY_API_VERSION` in `src/lib/shopify/client.ts`.
