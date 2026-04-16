# Research: Newsletter Provider Selection

**Ticket:** #25 — Research: Newsletter provider selection — Klaviyo vs Shopify Customer Events vs Mailchimp vs ConvertKit

---

## Decision Summary

**Recommended: Klaviyo**

Klaviyo is the industry standard for Shopify-native email marketing. It provides native Shopify sync (orders, abandoned carts, browse abandonment), pre-built flows, and a free tier up to 500 contacts / 500 email sends. House of Mornii is a luxury positioning brand — Klaviyo's segmentation and flow capabilities align with the high-touch, CRM-forward approach appropriate for the brand.

---

## Provider Comparison

### Klaviyo

| Dimension | Detail |
|-----------|--------|
| Shopify integration | Native, real-time sync via Shopify app — products, orders, customers, cart events automatically available as triggers |
| Free tier | 500 contacts, 500 emails/month |
| Pricing | $20/mo (up to 500 active profiles + 5,000 emails/month); scales by contact count |
| Key features | Abandoned cart flows, back-in-stock alerts, post-purchase sequences, segmentation by purchase history |
| Template editor | Drag-and-drop; supports custom HTML |
| Analytics | Revenue attribution by email, per-flow ROI |
| Forms / pop-ups | Built-in signup forms with targeting rules (exit intent, scroll depth) |
| API | REST API + webhooks; embed signup forms in custom code |
| Cons | More expensive than alternatives at scale; dashboard has a learning curve |

### Shopify Email

| Dimension | Detail |
|-----------|--------|
| Shopify integration | Native — built into Shopify admin, uses store data directly |
| Free tier | 10,000 emails/month free |
| Pricing | $1 per 1,000 emails after free tier |
| Key features | Branded templates, basic automations (abandoned cart, order follow-up), basic segmentation |
| Cons | Limited flow complexity; no behavior-based browse abandonment; no cross-channel (SMS) |
| Best for | Businesses wanting the simplest possible setup with minimal external tools |

### Mailchimp

| Dimension | Detail |
|-----------|--------|
| Shopify integration | Via third-party connector (not native); data sync is less comprehensive |
| Free tier | 500 contacts, 1,000 emails/month |
| Pricing | $13/mo (Essentials, 500 contacts) |
| Key features | Familiar UI, large template library, basic automation journeys |
| Cons | Shopify integration broke in 2019 (requires reconnection tools); not built for ecommerce-first workflows |
| Best for | General-purpose newsletters; not ideal for Shopify-first stores |

### Omnisend

| Dimension | Detail |
|-----------|--------|
| Shopify integration | Native app, ecommerce-first |
| Free tier | 500 emails/month |
| Pricing | $16/mo (Standard, up to 500 contacts + 6,000 emails/month) |
| Key features | SMS + email + push in one platform; pre-built ecommerce automations |
| Cons | Less brand recognition than Klaviyo; smaller template ecosystem |
| Best for | Stores wanting SMS + email in a single tool at lower price than Klaviyo |

---

## Recommendation: Klaviyo

For House of Mornii:

1. **Luxury positioning** — Klaviyo's segmentation allows targeting by purchase tier (e.g., customers who spent >$200), which enables the personal, high-touch communications a luxury brand requires
2. **Shopify-native** — Products, orders, and cart events flow directly into Klaviyo without custom middleware
3. **Free startup tier** — 500 contacts is enough for the launch phase while building the list
4. **Newsletter form integration** — The `NewsletterSignup.tsx` form in the frontend can POST to Klaviyo's subscribe API endpoint (see #26 for implementation guide)
5. **Abandoned cart = high revenue** — For jewelry with considered purchase cycles, an abandoned cart flow is likely the highest-ROI automation

**Second choice: Shopify Email** if the business owner prefers to minimize third-party tools and keep everything inside the Shopify admin.

---

## Frontend Integration Approach

The existing `NewsletterSignup.tsx` component calls a form `onSubmit` handler. The implementation requires:

1. Creating a Klaviyo list and getting the `List ID`
2. Including the Klaviyo `Company ID` (public key — safe to expose in client code)
3. POSTing to Klaviyo's **Client API** subscribe endpoint:
   ```
   POST https://a.klaviyo.com/client/subscriptions/?company_id=COMPANY_ID
   ```
4. No server-side proxy needed — Klaviyo's client API accepts CORS requests from the browser

See [newsletter-integration-guide.md](newsletter-integration-guide.md) for the full implementation.

---

## Estimated Timeline

- Klaviyo account setup: 30 min
- Shopify → Klaviyo app install and sync: 15 min
- Frontend integration (wiring NewsletterSignup): 1-2 hours (+ testing)
- First flow (welcome email): 1 hour
- Abandoned cart flow: 1-2 hours

Total: ~1 day of focused work once credentials are available.
