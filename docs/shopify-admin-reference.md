# Shopify Store Admin Reference

**Ticket:** #19 — Docs: Shopify store admin reference for business partner

This document is for the House of Mornii business owner / store admin. It covers day-to-day management tasks in the Shopify Admin without requiring developer access.

---

## Logging In

- Admin URL: `https://admin.shopify.com/store/house-of-mornii`
- Use your Shopify Partner or Staff account credentials
- Enable two-factor authentication under **Account → Security**

---

## Managing Products

### Add a New Product

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

### Edit a Product

1. Products → click the product name
2. Make changes → Save

### Archive / Remove a Product

- **Archive** (hides from storefront, keeps history): Products → click product → **Archive product**
- **Delete** (permanent): Products → click product → **Delete product** (cannot be undone)

---

## Managing Collections

Collections group products together. The frontend shows collections on the /collections page.

### Create a Collection

1. Go to **Products → Collections → Create collection**
2. **Title** — shown as the collection heading (e.g., "The Bridal Suite")
3. **Description** — shown on the collection page
4. **Collection image** — upload a banner image (landscape, 16:9 recommended)
5. **Collection type:**
   - **Manual** — you hand-pick which products appear
   - **Automated** — products auto-added when they match tags/title rules
6. Under **Sales channels**: check the **Headless** / online store channel
7. Click **Save**, then drag to reorder under **Products → Collections**

### Add Products to a Manual Collection

1. Products → Collections → click collection
2. Scroll to **Products** section → click **Browse** to search and add

---

## Managing Inventory

1. Products → Inventory → view all SKUs and stock levels
2. Edit quantities inline or import via CSV (Export → edit → Import)
3. For limited-edition pieces, set a specific quantity and choose "Stop selling when out of stock" so the button disables automatically on the storefront

---

## Processing Orders

1. **Orders → All orders** — lists incoming orders
2. Click an order to see:
   - Customer details
   - Items ordered
   - Payment status
   - Fulfillment status
3. **Fulfill an order**: click **Mark as fulfilled** and add tracking information
4. Shopify sends auto-confirmation and shipping emails to the customer

### Refunds and Returns

1. Go to the order → click **Refund**
2. Select items and reason
3. Click **Refund** — the amount is returned to the original payment method

---

## Discount Codes

1. **Discounts → Create discount**
2. Choose type: **Amount off**, **Percentage**, or **Free shipping**
3. Set eligibility (all customers, specific email, minimum spend)
4. Set usage limits and expiry date
5. Use the discount code in marketing emails and social posts

---

## Customers

1. **Customers** shows all customer accounts and purchase histories
2. Search by name, email, or phone
3. Import customers via CSV for emails

---

## Analytics

Shopify provides built-in analytics:
- **Analytics → Overview** — revenue, sessions, top products
- **Analytics → Reports** — sales by product, by collection, by channel
- **Live View** — real-time visitor activity

Google Analytics 4 is separately configured via the `VITE_GA4_MEASUREMENT_ID` environment variable and tracked in the frontend.

---

## Payments Setup

1. Admin → **Settings → Payments**
2. Activate **Shopify Payments** (recommended) or connect PayPal/Stripe
3. For testing, enable **Bogus Gateway** in test mode — use card number `1` to simulate a successful order

---

## Shipping and Taxes

1. Admin → **Settings → Shipping and delivery** — configure flat-rate or calculated shipping zones
2. Admin → **Settings → Taxes** — Shopify handles most tax rules automatically; review if selling across multiple countries

---

## Staff Accounts

Add team members without giving full owner access:

1. Settings → **Users and permissions → Add staff**
2. Assign role (all access or limited to specific sections)

---

## Useful Shopify Help Links

- Product management: https://help.shopify.com/en/manual/products
- Orders: https://help.shopify.com/en/manual/orders
- Analytics: https://help.shopify.com/en/manual/reports-and-analytics
- Payments: https://help.shopify.com/en/manual/payments
- Shopify Support: https://help.shopify.com/en/support

---

## Developer Contact Notes

When working with the web developer, provide:

- **Store domain**: `house-of-mornii.myshopify.com`
- **Storefront API token**: found in Admin → Apps → your Headless app → API credentials
  > ⚠️ Treat this token like a password — share only over secure channels (never in email plain text)
- **Product/collection handles**: the URL-friendly slugs Shopify generates (e.g., `the-gala-collection`)
  - Admin → Products/Collections → click an item → the handle appears in the URL and in the SEO section

---

*Last updated: 2026-04-14*
