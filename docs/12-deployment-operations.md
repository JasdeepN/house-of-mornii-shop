# Deployment & Operations

## Overview

This document consolidates deployment procedures, domain/SSL configuration, production launch checklist, and API version update process.

## Prerequisites

- Node.js 20 or later
- Cloudflare account with Pages access
- GitHub repository admin access (to add secrets)
- Git CLI

## Local Development Setup

### Initial Setup

```bash
git clone git@github.com:YOUR_ORG/house-of-mornii-shop.git
cd house-of-mornii-shop
npm install
```

### Environment Variables

Copy the example env file and fill in credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```ini
# Public site/prototype placeholders
VITE_SITE_NAME=House of Mornii
VITE_SITE_TITLE=House of Mornii Preview
VITE_SITE_DESCRIPTION=Regal costume jewellery showcase in development.
VITE_SITE_URL=http://localhost:5173
VITE_CONTACT_EMAIL=contact@houseofmornii.com
VITE_NEWSLETTER_ENDPOINT=

# Required — a Shopify development store works well for local use
VITE_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_api_token

# Optional — skip unless you need analytics locally
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=
```

`VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are required — the app throws at module load if either is empty or a placeholder value, in every environment including local dev. Use a Shopify development store for local work.

The footer newsletter form is hidden unless `VITE_NEWSLETTER_ENABLED=true` (off until v1.1). If `VITE_NEWSLETTER_ENDPOINT` is empty, the form runs in **prototype mode** — it exercises the UI success path without writing to a real email provider.

### Start Dev Server

```bash
npm run dev
# → http://localhost:5173
```

## Running Tests

### Unit Tests (Vitest)

```bash
npm run test       # watch mode
npm run test:run   # single run (CI mode)
```

### E2E Tests (Playwright — tests a deployed site)

```bash
# Everything, against https://dev.houseofmornii.com (needs .env.e2e.local)
npm run test:e2e

# Read-only tier only: safe against any site, including production
E2E_BASE_URL=https://houseofmornii.com npm run test:e2e:read-only

# Open Playwright UI for interactive debugging
npm run test:e2e:ui
```

The dev-only tier places Orders and signs in, so it refuses any target but dev. The suite runs automatically after every `dev` deploy (`.github/workflows/deploy-site.yml`) and by hand via `.github/workflows/e2e.yml`. See [16 - End-to-End Tests](./16-end-to-end-tests.md).

## Production Build Verification

```bash
npm run build     # TypeScript compile + Vite bundle
npm run preview   # Serve dist/ locally at http://localhost:4173
```

Check for:
- No TypeScript errors
- No Vite build warnings for large chunks
- Preview URL loads correctly

## Deploy to Cloudflare Pages

### Automatic Deployment (Recommended)

Every push to `main` triggers `.github/workflows/deploy.yml` automatically:
1. Installs Node.js 20 + npm dependencies
2. Runs all unit tests (build fails if any test fails)
3. Builds the Vite bundle with production secrets injected
4. Deploys `dist/` to Cloudflare Pages via `wrangler-action@v3`

**No manual steps required for regular releases.**

### First-Time CI Setup

Add the following secrets to GitHub (repository **Settings → Secrets and variables → Actions → New repository secret**):

| Secret Name | Where to Get |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens → Create Token (Cloudflare Pages: Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Right sidebar → Account ID |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify Partner Dashboard → Store → Domains |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Admin → Apps → Storefront API tokens |
| `VITE_GA4_MEASUREMENT_ID` | Google Analytics → Admin → Data Streams → Measurement ID |
| `VITE_META_PIXEL_ID` | Meta Events Manager → Data Sources → Pixel → Pixel ID |

Add these non-secret repository **Variables** when final public copy/config should override `.env.production` defaults:

| Variable Name | Purpose |
|---|---|
| `VITE_SITE_NAME` | Public brand/site name |
| `VITE_SITE_TITLE` | Default HTML/social title |
| `VITE_SITE_DESCRIPTION` | Default meta/social description |
| `VITE_SITE_URL` | Canonical production URL, e.g. `https://houseofmornii.com` |
| `VITE_SITE_OG_IMAGE_PATH` | Social image path, e.g. `/og-image.png` |
| `VITE_SITE_OG_IMAGE_ALT` | Social image alt text |
| `VITE_THEME_COLOR` | Browser theme color, for example `oklch(0.336 0.054 200.5)` |
| `VITE_CONTACT_EMAIL` | Public contact email (`contact@houseofmornii.com`) |
| `VITE_INSTAGRAM_HANDLE` | Public Instagram display handle |
| `VITE_INSTAGRAM_URL` | Public Instagram URL |
| `VITE_CONTACT_LOCATION_LABEL` | Public location text; leave empty to omit it |
| `VITE_NEWSLETTER_ENABLED` | Shows the footer newsletter form; `false` until v1.1 |
| `VITE_NEWSLETTER_ENDPOINT` | Provider-neutral newsletter endpoint; leave blank for prototype mode |
| `VITE_NEWSLETTER_*` | Public newsletter/welcome placeholder copy |

### Manual Deployment (Break-Glass)

Only use if the GitHub Actions pipeline is unavailable:

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name=house-of-mornii
```

You must be logged into Cloudflare: `npx wrangler login` first.

## PR Preview Deployments

Every pull request opened against `main` automatically gets a preview URL from Cloudflare Pages:

```
https://<branch-or-commit-hash>.house-of-mornii.pages.dev
```

The preview URL is posted as a Deployment check in the GitHub PR. Preview deployments:
- Use the same secrets as production builds
- Are retained for 90 days after the PR is closed
- Do NOT affect the production domain

## Rollback

### Via Cloudflare Dashboard (Fastest)

1. Go to **Cloudflare Dashboard → Workers & Pages → house-of-mornii → Deployments**
2. Find the last known-good deployment
3. Click **Rollback to this deployment**

Rollback takes effect within ~10 seconds globally.

### Via Git Revert

```bash
git revert HEAD   # reverts the last commit
git push origin main
```

This creates a new commit and triggers a fresh deployment via CI.

## Secrets Rotation

When rotating Shopify tokens or other credentials:
1. Generate new credentials in Shopify/GA4/Meta
2. Update the GitHub secret values
3. Trigger a manual deployment: **GitHub → Actions → Deploy to Cloudflare Pages → Run workflow**
4. Verify the new deployment loads correctly

## Environment Tiers

| Environment | URL | Secrets Source | Trigger |
|---|---|---|---|
| Development | `localhost:5173` | `.env.local` (gitignored) | `npm run dev` |
| PR Preview | `*.house-of-mornii.pages.dev` | GitHub Secrets | PR opened/updated |
| Production | `houseofmornii.com` | GitHub Secrets | Push to `main` |

## Monitoring and Alerting

- **Uptime**: Configure Cloudflare Health Checks under Workers & Pages settings (notify on >2 min downtime)
- **Analytics**: GA4 real-time view at analytics.google.com
- **E2E**: CI run after every `dev` deploy, with Playwright report and trace artifacts (kept 14 days in GitHub Actions)
- **Error tracking**: Consider adding Sentry (optional — not currently configured)

## Troubleshooting

### "Module not found" in CI build

Run `npm ci` locally and confirm the failing import path resolves. CI uses a clean install — local `node_modules` mods won't carry over.

### Shopify API 401

Token or domain is wrong. Use the Storefront API access — **not** the Admin API token. The token needed is from the Storefront API settings, scoped to `unauthenticated_read_product_listings`.

### Cloudflare deployment exits without error but URL shows old version

Hard refresh (`Ctrl+Shift+R`). Cloudflare CDN may cache the old version for up to 4 hours for infrequently-updated pages. Use **Purge Cache** in the Cloudflare Pages dashboard if instant rollout is needed.

### Playwright tests fail locally but pass in CI

Usually a race condition. Run `npm run test:e2e:ui` for the step-by-step trace. Check screenshot artifacts in the test runner.

---

## Domain, DNS & SSL Configuration

### Architecture

```
Cloudflare Registrar
  └── Cloudflare DNS
    └── DNS A/CNAME → Cloudflare Pages
      └── house-of-mornii.pages.dev (origin)
```

The domain is owned by the business and registered through Cloudflare. Cloudflare acts as registrar, DNS provider, CDN/proxy, and TLS manager.

### Confirm Domain in Cloudflare

1. Log in to Cloudflare Dashboard
2. Confirm `houseofmornii.com` appears under registered domains / websites
3. Confirm DNS is managed in the same Cloudflare account that owns the domain
4. Confirm the active Cloudflare Pages project is `house-of-mornii`

### Connect Custom Domain to Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → house-of-mornii → Custom domains**
2. Click **Set up a custom domain**
3. Enter `houseofmornii.com` → Cloudflare automatically adds a `CNAME` record
4. Repeat for `www.houseofmornii.com`

### SSL/TLS Configuration

1. **Cloudflare Dashboard → SSL/TLS → Overview**
2. Set encryption mode to **Full (strict)**
3. Under **Edge Certificates → Always Use HTTPS** → toggle ON
4. Under **Edge Certificates → Minimum TLS Version** → set to **TLS 1.2** (or 1.3 for stricter)
5. Under **Edge Certificates → Automatic HTTPS Rewrites** → toggle ON

### www → Apex Redirect

Recommended: apex is canonical, www redirects to it.

In Cloudflare Dashboard → **Rules → Redirect Rules → Create rule**:
- Rule name: `www to apex redirect`
- Field: `Hostname equals www.houseofmornii.com`
- Action: `Dynamic redirect → https://houseofmornii.com/${uri.path} → 301`

### CDN Caching Configuration

Verify in **Caching → Configuration**:

| Setting | Recommended Value |
|---|---|
| **Caching Level** | Standard |
| **Browser Cache TTL** | Respect Existing Headers (Vite sets `Cache-Control: max-age=31536000`) |
| **Always Online** | On |
| **Development Mode** | OFF |

The `public/_headers` file already sets proper security headers and cache headers:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### DNS Records Summary

After setup, Cloudflare DNS should have these records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `houseofmornii.com` | `house-of-mornii.pages.dev` | Proxied (orange cloud) |
| CNAME | `www` | `house-of-mornii.pages.dev` | Proxied (orange cloud) |

### Verification Checklist

- [ ] `https://houseofmornii.com` loads the site over HTTPS
- [ ] `https://www.houseofmornii.com` redirects to `https://houseofmornii.com`
- [ ] `http://houseofmornii.com` redirects to `https://houseofmornii.com`
- [ ] Browser shows padlock — valid SSL cert issued by Cloudflare
- [ ] `curl -I https://houseofmornii.com` shows `cf-ray:` header (confirming Cloudflare proxy is active)
- [ ] Cloudflare Analytics shows traffic on the domain

---

## Production Launch Checklist

Complete all items in order. Each section must be fully checked before proceeding to the next.

### Phase 1: Store & Product Readiness

- [ ] Shopify dev store fully set up (see `docs/11-shopify-admin-reference.md`)
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

### Phase 2: Content & Copy

- [ ] Hero section copy finalized and approved
- [ ] "About House of Mornii" copy finalized
- [ ] Contact page email address confirmed deliverable
- [ ] FAQ entries reviewed and accurate
- [ ] Footer links all resolve (Privacy Policy, Terms of Service, Return Policy)
- [ ] Privacy Policy page created in Shopify and linked
- [ ] All collection and product descriptions proofread

### Phase 3: Brand Assets

- [ ] `public/og-image.png` — 1200×630 branded PNG (for social sharing previews)
  - Design source: `public/og-image.svg` — export to PNG at 2x resolution
  - Validate at: https://developers.facebook.com/tools/debug/ and https://cards-dev.twitter.com/validator
- [ ] Favicon set: `public/favicon.ico` + `public/favicon.svg`
- [ ] Apple touch icon: `public/apple-touch-icon.png` (180×180)
- [ ] Logo and brand lockup in final format

### Phase 4: Technical Integration

- [ ] `.env.local` set up with real Shopify credentials; `npm run dev` loads live products
- [ ] All GitHub secrets configured (see section above)
- [ ] `npm run build` passes cleanly (no TypeScript errors, no build warnings)
- [ ] `npm run test:run` — all unit tests pass
- [ ] E2E suite is green on the latest `dev` deploy (`npm run test:e2e` against dev)

### Phase 5: SEO & Analytics

- [ ] GA4 property created and Measurement ID set in `VITE_GA4_MEASUREMENT_ID` secret
- [ ] Meta Pixel created and ID set in `VITE_META_PIXEL_ID` secret (optional)
- [ ] `index.html` `<title>` reflects brand name
- [ ] `index.html` meta description is ≤160 characters and includes brand name
- [ ] `useSEO` hook sets correct `og:title` / `og:description` per page
- [ ] `og:image` shows correctly in Facebook link preview and Twitter/X card debugger
- [ ] `public/sitemap.xml` updated with final domain URL (`https://houseofmornii.com`)
- [ ] `public/robots.txt` allows crawling (confirm it's not blocking `/`)
- [ ] Google Search Console property created and `sitemap.xml` submitted
- [ ] Canonical URLs resolve correctly (no `www.` vs non-`www.` split)

### Phase 6: Domain & TLS

- [ ] Custom domain `houseofmornii.com` pointed to Cloudflare Pages
- [ ] `www.houseofmornii.com` resolves with a redirect to the apex domain
- [ ] TLS/HTTPS works on both `www` and apex — no browser warnings
- [ ] Cloudflare **Always Use HTTPS** enabled
- [ ] Cloudflare HTTP/2 and Brotli compression enabled

### Phase 7: Security & Performance

- [ ] `public/_headers` security headers active (CSP, HSTS, X-Frame-Options, etc.)
- [ ] HTTPS redirect in place (no HTTP access possible)
- [ ] Storefront API token has minimum required scopes only
- [ ] PageSpeed Insights score ≥ 85 on mobile: https://pagespeed.web.dev/
- [ ] Largest Contentful Paint (LCP) < 2.5s on mobile (home page)
- [ ] Total bundle size: `npm run build` — JS chunk < 350 KB gzip
- [ ] Images are served via Cloudflare CDN (check response headers for `cf-cache-status`)
- [ ] No browser console errors in production build (`npm run preview`)

### Phase 8: Pre-Launch Smoke Test (Production URL)

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

Run the read-only E2E tier: `E2E_BASE_URL=https://houseofmornii.com npm run test:e2e:read-only` (never the dev-only tier on production)

### Phase 9: Post-Launch Monitoring

- [ ] Set up Cloudflare Health Check to alert on downtime (Email/Slack notification)
- [ ] GA4 real-time view shows at least one session after a test visit
- [ ] Manual E2E workflow (`.github/workflows/e2e.yml`, tier `read-only`, production URL) passed
- [ ] Announce on social channels with the OG image / link preview

### Launch Sign-Off

| Role | Name | Date |
|---|---|---|
| Developer | | |
| Store Owner / Business | | |

**Production is ready when all Phase 1–8 items are checked.**

---

## API Version Update Process

### Overview

Shopify releases a new API version quarterly (January, April, July, October). Each version is supported for one year. The app currently targets API version `2026-01`.

### Quarterly Review Schedule

Review Shopify release notes at the start of each quarter (January, April, July, October) to identify:
- New features worth adopting
- Deprecated fields used in the codebase
- Breaking changes that require migration

### Update Steps

1. **Check Shopify Release Notes** — Review the [Shopify Release Notes](https://shopify.dev/docs/api/release-notes) for the new API version
2. **Update API Version Constant** — Update the API version in `src/lib/shopify/client.ts` and `workers/shopify-proxy.ts`
3. **Update Query Fragments** — Update any shared fragments in `src/lib/shopify/queries.ts` if field shapes changed
4. **Run Test Suite** — `npm run test:run` to verify all tests pass
5. **Deploy to Staging** — Deploy to a staging environment and verify catalog loads correctly
6. **Production Deployment** — Deploy to production via CI

### Deprecation Tracking

| Deprecated Field | Replacement | Status | Action Required |
|---|---|---|---|
| _(none currently tracked)_ | | | |

### Emergency Updates

If a critical security patch or breaking change requires immediate attention:
1. Update the API version constant
2. Run the full test suite
3. Deploy to staging immediately
4. Monitor for 24 hours before promoting to production

### Related Documentation

- `docs/03-shopify-integration.md` — Shopify integration reference
- `docs/08-shopify-automation-worker.md` — Worker API version configuration
