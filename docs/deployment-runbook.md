# Deployment Runbook — House of Mornii Shop

**Ticket:** #22 — Docs: Dev deployment runbook and PR preview URL guide

---

## Prerequisites

- Node.js 20 or later
- Cloudflare account with Pages access
- GitHub repository admin access (to add secrets)
- Git CLI

---

## 1. Local Development Setup

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
# Optional — leave empty to use demo product data
VITE_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_api_token

# Optional — skip unless you need analytics locally
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=
```

If `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are both empty, the app runs in **demo mode** — a full in-memory product catalog is used. This is the default for new contributors.

### Start Dev Server

```bash
npm run dev
# → http://localhost:5173
```

---

## 2. Running Tests

### Unit Tests (Vitest)

```bash
npm run test       # watch mode
npm run test:run   # single run (CI mode)
```

Expected output: all tests pass. Fix any failing tests before pushing.

### E2E Tests (Playwright — requires a running server)

```bash
# Against local dev server (auto-started)
npm run test:e2e

# Against production (full smoke test)
E2E_BASE_URL=https://houseofmornii.com npm run test:e2e

# Open Playwright UI for interactive debugging
npm run test:e2e:ui
```

E2E tests run automatically every night at 04:00 UTC via `.github/workflows/e2e.yml`.

---

## 3. Production Build Verification

```bash
npm run build     # TypeScript compile + Vite bundle
npm run preview   # Serve dist/ locally at http://localhost:4173
```

Check for:
- No TypeScript errors
- No Vite build warnings for large chunks
- Preview URL loads correctly

---

## 4. Deploy to Cloudflare Pages

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
|-------------|--------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens → Create Token (Cloudflare Pages: Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Right sidebar → Account ID |
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify Partner Dashboard → Store → Domains |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Shopify Admin → Apps → Storefront API tokens |
| `VITE_GA4_MEASUREMENT_ID` | Google Analytics → Admin → Data Streams → Measurement ID |
| `VITE_META_PIXEL_ID` | Meta Events Manager → Data Sources → Pixel → Pixel ID |

### Manual Deployment (Break-Glass)

Only use if the GitHub Actions pipeline is unavailable:

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name=house-of-mornii
```

You must be logged into Cloudflare: `npx wrangler login` first.

---

## 5. PR Preview Deployments

Every pull request opened against `main` automatically gets a preview URL from Cloudflare Pages:

```
https://<branch-or-commit-hash>.house-of-mornii.pages.dev
```

The preview URL is posted as a Deployment check in the GitHub PR. Preview deployments:
- Use the same secrets as production builds
- Are retained for 90 days after the PR is closed
- Do NOT affect the production domain

**To test a feature branch before merging:**
1. Push your branch and open a PR
2. Wait for the `build-and-deploy` workflow to complete (~2 minutes)
3. Click the **View deployment** link in the PR checks section

---

## 6. Rollback

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

---

## 7. Secrets Rotation

When rotating Shopify tokens or other credentials:

1. Generate new credentials in Shopify/GA4/Meta
2. Update the GitHub secret values
3. Trigger a manual deployment: **GitHub → Actions → Deploy to Cloudflare Pages → Run workflow**
4. Verify the new deployment loads correctly

---

## 8. Environment Tiers

| Environment | URL | Secrets Source | Trigger |
|-------------|-----|----------------|---------|
| Development | `localhost:5173` | `.env.local` (gitignored) | `npm run dev` |
| PR Preview | `*.house-of-mornii.pages.dev` | GitHub Secrets | PR opened/updated |
| Production | `houseofmornii.com` | GitHub Secrets | Push to `main` |

---

## 9. Monitoring and Alerting

- **Uptime**: Configure Cloudflare Health Checks under Workers & Pages settings (notify on >2 min downtime)
- **Analytics**: GA4 real-time view at analytics.google.com
- **E2E smoke**: Nightly CI run at 04:00 UTC with Playwright report artifacts (available 14 days in GitHub Actions)
- **Error tracking**: Consider adding Sentry (optional — not currently configured)

---

## 10. Troubleshooting

### "Module not found" in CI build

Run `npm ci` locally and confirm the failing import path resolves. CI uses a clean install — local `node_modules` mods won't carry over.

### Shopify API 401

Token or domain is wrong. Use the Storefront API access — **not** the Admin API token. The token needed is from the Storefront API settings, scoped to `unauthenticated_read_product_listings`.

### Cloudflare deployment exits without error but URL shows old version

Hard refresh (`Ctrl+Shift+R`). Cloudflare CDN may cache the old version for up to 4 hours for infrequently-updated pages. Use **Purge Cache** in the Cloudflare Pages dashboard if instant rollout is needed.

### Playwright tests fail locally but pass in CI

Usually a race condition. Run `npm run test:e2e:ui` for the step-by-step trace. Check screenshot artifacts in the test runner.
