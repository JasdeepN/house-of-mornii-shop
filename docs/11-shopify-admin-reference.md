# Shopify Admin & Dev Store Reference

## Overview

This document covers two topics: (1) day-to-day Shopify Admin management for the business owner, and (2) dev store setup and verification for developers.

## Part 1: Shopify Admin Reference (Business Owner)

### Logging In

- Admin URL: `https://admin.shopify.com/store/house-of-mornii`
- Use your Shopify Partner or Staff account credentials
- Enable two-factor authentication under **Account → Security**

### Managing Products

#### Add a New Product

1. Go to **Products → Add product**
2. Fill in:
   - **Title** — product name shown on the site
   - **Description** — supports rich text; this is the description shown on the product page
   - **Media** — upload product images (at least 1; use 1:1 or 4:5 ratio for best display)
   - **Price** — set in your store currency
   - **Inventory** — enable "Track quantity" for jewelry pieces with limited stock
3. Under **Product organization**:
   - Set **Collections** — assign to the appropriate collection (e.g., "Gala Collection")
   - Set **Product type** and **Tags** for future filtering
4. Under **Sales channels**: check the **Headless** channel and/or your Online Store
5. Click **Save**

#### Edit a Product

1. Products → click the product name
2. Make changes → Save

#### Archive / Remove a Product

- **Archive** (hides from storefront, keeps history): Products → click product → **Archive product**
- **Delete** (permanent): Products → click product → **Delete product** (cannot be undone)

### Managing Collections

Collections group products together. The frontend shows collections on the `/collections` page.

#### Create a Collection

1. Go to **Products → Collections → Create collection**
2. **Title** — shown as the collection heading (e.g., "The Bridal Suite")
3. **Description** — shown on the collection page
4. **Collection image** — upload a banner image (landscape, 16:9 recommended)
5. **Collection type:**
   - **Manual** — you hand-pick which products appear
   - **Automated** — products auto-added when they match tags/title rules
6. Under **Sales channels**: check the **Headless** / online store channel
7. Click **Save**, then drag to reorder under **Products → Collections**

#### Add Products to a Manual Collection

1. Products → Collections → click collection
2. Scroll to **Products** section → click **Browse** to search and add

### Managing Inventory

1. Products → Inventory → view all SKUs and stock levels
2. Edit quantities inline or import via CSV (Export → edit → Import)
3. For limited-edition pieces, set a specific quantity and choose "Stop selling when out of stock" so the button disables automatically on the storefront

### Processing Orders

1. **Orders → All orders** — lists incoming orders
2. Click an order to see:
   - Customer details
   - Items ordered
   - Payment status
   - Fulfillment status
3. **Fulfill an order**: click **Mark as fulfilled** and add tracking information
4. Shopify sends auto-confirmation and shipping emails to the customer

#### Refunds and Returns

1. Go to the order → click **Refund**
2. Select items and reason
3. Click **Refund** — the amount is returned to the original payment method

### Discount Codes

1. **Discounts → Create discount**
2. Choose type: **Amount off**, **Percentage**, or **Free shipping**
3. Set eligibility (all customers, specific email, minimum spend)
4. Set usage limits and expiry date
5. Use the discount code in marketing emails and social posts

### Customers

1. **Customers** shows all customer accounts and purchase histories
2. Search by name, email, or phone
3. Import customers via CSV for emails

### Analytics

Shopify provides built-in analytics:
- **Analytics → Overview** — revenue, sessions, top products
- **Analytics → Reports** — sales by product, by collection, by channel
- **Live View** — real-time visitor activity

Google Analytics 4 is separately configured via the `VITE_GA4_MEASUREMENT_ID` environment variable and tracked in the frontend.

### Payments Setup

1. Admin → **Settings → Payments**
2. Activate **Shopify Payments** (recommended) or connect PayPal/Stripe
3. For testing, enable **Bogus Gateway** in test mode — use card number `1` to simulate a successful order

### Shipping and Taxes

1. Admin → **Settings → Shipping and delivery** — configure flat-rate or calculated shipping zones
2. Admin → **Settings → Taxes** — Shopify handles most tax rules automatically; review if selling across multiple countries

### Staff Accounts

Add team members without giving full owner access:

1. Settings → **Users and permissions → Add staff**
2. Assign role (all access or limited to specific sections)

### Useful Shopify Help Links

- Product management: https://help.shopify.com/en/manual/products
- Orders: https://help.shopify.com/en/manual/orders
- Analytics: https://help.shopify.com/en/manual/reports-and-analytics
- Payments: https://help.shopify.com/en/manual/payments
- Shopify Support: https://help.shopify.com/en/support

---

## Part 2: Dev Store Setup & Verification (Developer)

### Storefront API Requirements

The frontend (`src/lib/shopify/client.ts`) connects to:

```
https://{store-domain}/api/2026-01/graphql.json
```

#### Required Storefront API Scopes

When creating a Headless channel or Custom app access token, ensure these `unauthenticated_read_*` scopes are checked:

| Scope | Used For |
|---|---|
| `unauthenticated_read_product_listings` | Product grid, PDP, search |
| `unauthenticated_read_product_inventory` | In-stock / sold-out display |
| `unauthenticated_read_selling_plans` | Subscription/recurring pricing (future) |
| `unauthenticated_read_checkouts` | Cart checkout creation |
| `unauthenticated_write_checkouts` | Cart line item mutations |
| `unauthenticated_read_customer_tags` | Optional — for personalization |
| `unauthenticated_read_content` | Optional — blog/article pages |

#### How to Create the Storefront Token

1. Shopify Admin: **Sales channels → Add channel → Headless** (or go to **Apps → Develop apps → Create an app**)
2. Under **API credentials → Storefront API access scopes** — check all `unauthenticated_read_*` scopes listed above plus `unauthenticated_write_checkouts`
3. Click **Install app** / **Save**
4. Copy the **Storefront API access token** (shown once — save it immediately)
5. The store domain is the `.myshopify.com` domain (e.g., `house-of-mornii.myshopify.com`)

### Product and Collection Setup Checklist

For the dev store to render correctly with the House of Mornii frontend, verify:

#### Collections

- [ ] At least 3 collections created (matching the demo data categories)
  - Suggested: "The Gala Collection", "The Bridal Suite", "Heritage Pieces"
- [ ] Each collection has a title, description, and at least one image
- [ ] Collections are **published** to the Headless / Storefront API channel

#### Products

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

### Cart and Checkout Verification

1. Add a product to cart (via the frontend UI or the GraphQL mutation above)
2. Confirm a cart ID is returned and stored in `localStorage['hom-cart-id']`
3. Click the checkout button in the cart flyout
4. Verify the URL redirects to `https://{store}.myshopify.com/cart/{token}` (or the Shopify-hosted checkout)
5. For test orders, use the Shopify **Bogus Gateway** (Admin → Settings → Payments → Test mode)

### Configuration Keys for `.env.local`

```ini
VITE_SHOPIFY_STORE_DOMAIN=house-of-mornii.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
```

> Do NOT use the Admin API key here. The Storefront API token is different and has public-safe read access only (with write access scoped to checkout creation only).

### Known GraphQL Queries in Use

See `src/lib/shopify/queries.ts` for all queries. Key operations:
- `GET_COLLECTIONS` — collection browser
- `GET_COLLECTION` — single collection with paginated products
- `GET_PRODUCT` — full PDP with variants
- `GET_PRODUCTS` — shop page listing
- `CART_CREATE` / `CART_LINES_ADD` / `CART_LINES_UPDATE` — cart mutations

All queries target API version `2026-01`.

### Developer Contact Notes

When working with the web developer, provide:
- **Store domain**: `house-of-mornii.myshopify.com`
- **Storefront API token**: found in Admin → Apps → your Headless app → API credentials
  > Treat this token like a password — share only over secure channels (never in email plain text)
- **Product/collection handles**: the URL-friendly slugs Shopify generates (e.g., `the-gala-collection`)
  - Admin → Products/Collections → click an item → the handle appears in the URL and in the SEO section
