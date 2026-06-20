# Production Launch Checklist — House of Mornii Shop

**Ticket:** #29 — Production launch checklist

Complete all items in order. Each section must be fully checked before proceeding to the next.

---

## Phase 1: Store & Product Readiness

- [ ] Shopify dev store fully set up (see [shopify-dev-store-audit.md](shopify-dev-store-audit.md))
- [ ] All jewelry collections created with descriptions and images
- [ ] All products have:
  - [ ] Professional product photography (min. 2 photos per product)
  - [ ] Accurate pricing in store currency
  - [ ] Correct inventory counts (or "continue selling")
  - [ ] Variants configured where applicable (size, metal tone, etc.)
- [ ] Collections assigned to Headless channel
- [ ] Test purchase completed end-to-end (bogus gateway → Shopify checkout)
- [ ] Checkout email confirmation received and formatted correctly
- [ ] Shipping zones set up with rates

---

## Phase 2: Content & Copy

- [ ] Hero section copy finalized and approved
- [ ] "About House of Mornii" copy finalized
- [ ] Contact page email address confirmed deliverable
- [ ] FAQ entries reviewed and accurate
- [ ] Footer links all resolve (Privacy Policy, Terms of Service, Return Policy)
- [ ] Privacy Policy page created in Shopify and linked
- [ ] All collection and product descriptions proofread

---

## Phase 3: Brand Assets

- [ ] `public/og-image.png` — 1200×630 branded PNG (for social sharing previews)
  - Design source: `public/og-image.svg` — export to PNG at 2x resolution
  - Validate at: https://developers.facebook.com/tools/debug/ and https://cards-dev.twitter.com/validator
- [ ] Favicon set: `public/favicon.ico` + `public/favicon.svg`
- [ ] Apple touch icon: `public/apple-touch-icon.png` (180×180)
- [ ] Logo and brand lockup in final format

---

## Phase 4: Technical Integration

- [ ] `.env.local` set up with real Shopify credentials; `npm run dev` loads live products
- [ ] All GitHub secrets configured (see [deployment-runbook.md](deployment-runbook.md#first-time-ci-setup))
- [ ] `npm run build` passes cleanly (no TypeScript errors, no build warnings)
- [ ] `npm run test:run` — all 75+ unit tests pass
- [ ] E2E smoke tests pass against staging: `E2E_BASE_URL=https://staging-url npm run test:e2e`

---

## Phase 5: SEO & Analytics

- [ ] GA4 property created and Measurement ID set in `VITE_GA4_MEASUREMENT_ID` secret
- [ ] Meta Pixel created and ID set in `VITE_META_PIXEL_ID` secret (optional)
- [ ] `index.html` `<title>` reflects brand name
- [ ] `index.html` meta description is ≤160 characters and includes brand name
- [ ] `useSEO` hook sets correct `og:title` / `og:description` per page (test on product and collection pages)
- [ ] `og:image` shows correctly in Facebook link preview and Twitter/X card debugger
- [ ] `public/sitemap.xml` updated with final domain URL (`https://houseofmornii.com`)
- [ ] `public/robots.txt` allows crawling (confirm it's not blocking `/`)
- [ ] Google Search Console property created and `sitemap.xml` submitted
- [ ] Canonical URLs resolve correctly (no `www.` vs non-`www.` split)

---

## Phase 6: Domain & TLS

- [ ] Custom domain `houseofmornii.com` pointed to Cloudflare Pages (CNAME or proxied A record)
- [ ] `www.houseofmornii.com` resolves with a redirect to the apex domain (or vice versa — pick one canonical)
- [ ] TLS/HTTPS works on both `www` and apex — no browser warnings
- [ ] Cloudflare **Always Use HTTPS** enabled
- [ ] Cloudflare HTTP/2 and Brotli compression enabled

---

## Phase 7: Security & Performance

- [ ] `public/_headers` security headers active (CSP, HSTS, X-Frame-Options, etc.)
- [ ] HTTPS redirect in place (no HTTP access possible)
- [ ] Storefront API token has minimum required scopes only
- [ ] PageSpeed Insights score ≥ 85 on mobile: https://pagespeed.web.dev/
- [ ] Largest Contentful Paint (LCP) < 2.5s on mobile (home page)
- [ ] Total bundle size: `npm run build` — JS chunk < 350 KB gzip
- [ ] Images are served via Cloudflare CDN (check response headers for `cf-cache-status`)
- [ ] No browser console errors in production build (`npm run preview`)

---

## Phase 8: Pre-Launch Smoke Test (Production URL)

Run immediately after deploying to production domain:

- [ ] Home page loads and displays hero section
- [ ] Collections page shows all collections
- [ ] A collection page loads with products
- [ ] Product page loads with images, price, and add-to-cart button
- [ ] Add to cart → cart flyout opens with item
- [ ] Checkout button redirects to Shopify-hosted checkout over HTTPS
- [ ] Contact page form submits (or mailto link opens)
- [ ] Mobile layout: check on iOS Safari and Android Chrome
- [ ] 404 page shows branded error page (not a blank white page)

Run automated E2E: `E2E_BASE_URL=https://houseofmornii.com npm run test:e2e`

---

## Phase 9: Post-Launch Monitoring

- [ ] Set up Cloudflare Health Check to alert on downtime (Email/Slack notification)
- [ ] GA4 real-time view shows at least one session after a test visit
- [ ] E2E nightly workflow (`.github/workflows/e2e.yml`) first run passed
- [ ] Announce on social channels with the OG image / link preview

---

## Launch Sign-Off

| Role | Name | Date |
|------|------|------|
| Developer | | |
| Store Owner / Business | | |

**Production is ready when all Phase 1–8 items are checked.**

---

*See also:*
- [deployment-runbook.md](deployment-runbook.md) — CI/CD setup and rollback procedures
- [shopify-dev-store-audit.md](shopify-dev-store-audit.md) — Shopify integration verification
- [shopify-admin-reference.md](shopify-admin-reference.md) — Day-to-day store management
- [../docs/architecture-reviews/shopify-storefront-status-2026-04-10.md](architecture-reviews/shopify-storefront-status-2026-04-10.md) — Storefront integration architecture
