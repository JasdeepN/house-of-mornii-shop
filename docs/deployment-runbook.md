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
# Public site/prototype placeholders
VITE_SITE_NAME=House of Mornii
VITE_SITE_TITLE=House of Mornii Preview
VITE_SITE_DESCRIPTION=Regal costume jewellery showcase in development. Final product, policy, contact, and marketing integrations are configured by environment.
VITE_SITE_URL=http://localhost:5173
VITE_CONTACT_EMAIL=
VITE_NEWSLETTER_ENDPOINT=

# Required — a Shopify development store works well for local use
VITE_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_storefront_api_token

# Optional — skip unless you need analytics locally
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=
```

`VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are required — the app throws at module load if either is empty or a placeholder value, in every environment including local dev. Use a Shopify development store for local work.

If `VITE_NEWSLETTER_ENDPOINT` is empty, the newsletter form runs in **prototype mode** — it exercises the UI success path without writing to a real email provider.

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

Add these non-secret repository **Variables** when final public copy/config should override `.env.production` defaults:

| Variable Name | Purpose |
|---------------|---------|
| `VITE_SITE_NAME` | Public brand/site name |
| `VITE_SITE_TITLE` | Default HTML/social title |
| `VITE_SITE_DESCRIPTION` | Default meta/social description |
| `VITE_SITE_URL` | Canonical production URL, e.g. `https://houseofmornii.com` |
| `VITE_SITE_OG_IMAGE_PATH` | Social image path, e.g. `/og-image.png` |
| `VITE_SITE_OG_IMAGE_ALT` | Social image alt text |
| `VITE_THEME_COLOR` | Browser theme color |
| `VITE_CONTACT_EMAIL` | Public contact email, when ready |
| `VITE_INSTAGRAM_HANDLE` | Public Instagram display handle |
| `VITE_INSTAGRAM_URL` | Public Instagram URL |
| `VITE_CONTACT_LOCATION_LABEL` | Public appointment/location placeholder or final text |
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

---

## 11. Shopify Automation Worker (Cloudflare Worker)

The Worker at [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts) deploys alongside Pages (see [`wrangler.toml`](../wrangler.toml) and the `Deploy Shopify Automation Worker` step in `.github/workflows/deploy.yml`, gated to `main`). It provides the read-only Admin proxy route, a webhook receiver, and a daily backup Cron job. See [`docs/shopify-api-architecture.md`](shopify-api-architecture.md) for the full route/architecture reference.

### 11.1 First-Time Worker Setup

1. Create the R2 bucket and KV namespace referenced in `wrangler.toml`:
   ```bash
   npx wrangler r2 bucket create shopify-backups
   npx wrangler kv namespace create BACKUP_INDEX
   ```
   Copy the returned KV namespace `id` into `wrangler.toml`'s `[[kv_namespaces]]` block (replacing `REPLACE_WITH_KV_NAMESPACE_ID`).

2. Set the Worker's non-secret vars in `wrangler.toml` (`SHOPIFY_STORE_DOMAIN`, `ALLOWED_ORIGIN`) to production values.

3. Provision Worker **secrets** out-of-band — never in `wrangler.toml`, never as a `VITE_`-prefixed var, never in CI logs:
   ```bash
   npx wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN
   npx wrangler secret put SHOPIFY_WEBHOOK_SECRET
   ```
   - `SHOPIFY_ADMIN_ACCESS_TOKEN`: Shopify Admin → Settings → Apps and sales channels → Develop apps → (your app) → API credentials. Requires at minimum `read_products` and `read_orders` scopes for the backup export to succeed.
   - `SHOPIFY_WEBHOOK_SECRET`: a secret you generate (e.g. `openssl rand -hex 32`) and reuse when registering webhooks in step 11.3 below.

4. Deploy the Worker manually the first time to verify config:
   ```bash
   npx wrangler deploy
   ```

5. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to GitHub Actions secrets if not already present (shared with the Pages deploy step — see section 4).

### 11.2 Backup / Restore Runbook

**How backups run:** Every day at 03:00 UTC, the Worker's `scheduled()` handler pages through `products`, `collections`, and `orders` via the Admin API (cursor pagination, see [`workers/backup-queries.ts`](../workers/backup-queries.ts)) and writes each resource to R2 at:

```
backups/<YYYY-MM-DD>/products.json
backups/<YYYY-MM-DD>/collections.json
backups/<YYYY-MM-DD>/orders.json
```

After all three resources succeed, the `BACKUP_INDEX` KV namespace's `latest-backup` key is updated with:

```json
{ "date": "2026-01-15", "keys": [ "backups/2026-01-15/products.json", "..." ], "counts": { "products": 42, "collections": 5, "orders": 130 }, "completedAt": "2026-01-15T03:04:12.000Z" }
```

**Checking backup health:**
```bash
npx wrangler tail                      # live logs — look for "backup.complete" or "backup.failed"
npx wrangler kv key get latest-backup --namespace-id=<BACKUP_INDEX id>
npx wrangler r2 object get shopify-backups/backups/<date>/products.json --file=./products.json
```

**Restoring data:** There is no automated restore tool (explicitly out of scope for this iteration). To manually inspect or restore from a snapshot:
1. Download the relevant JSON file with `wrangler r2 object get`.
2. Review the JSON — each resource file is a flat array of the GraphQL `nodes` for that resource.
3. Use the Shopify Admin UI (bulk CSV import for products/collections) or write a one-off script calling the Admin API mutations directly — never route restore mutations through the read-only `/api/shopify/admin` proxy, since it rejects all mutations by design.

**Failure handling:** If a page fails mid-export, the Worker logs a structured `backup.failed` error (including which resource keys were already written) and does **not** update `latest-backup`, so a stale-but-valid previous snapshot remains authoritative. Check `wrangler tail` or the Cloudflare dashboard's Worker logs after 03:00 UTC if backups appear to be missing.

### 11.4 Local Integration Testing

Before deploying Worker changes to production, verify the backup export queries work against a real store using [`scripts/test-backup-export.ts`](../scripts/test-backup-export.ts). This script calls the Shopify Admin API directly — using the same paginated GraphQL queries from [`workers/backup-queries.ts`](../workers/backup-queries.ts) — so it does **not** require a deployed Worker.

**Prerequisites:**
- A Shopify test/dev store (do not run this against production unless intentional — it only reads data, but still counts against API rate limits).
- An Admin API access token with `read_products` and `read_orders` scopes (a custom app token or the same token used for `SHOPIFY_ADMIN_ACCESS_TOKEN` in production works).
- In `.env.local`, set:
  ```ini
  SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_api_access_token
  SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
  ```
  (These are plain, non-`VITE_`-prefixed vars — the script reads them from `.env.local` or the process environment, never bundled into client code.)

**How to run:**
```bash
npm run test:backup-export
# or
npx tsx scripts/test-backup-export.ts
```

**What to expect:**
- Console output logging each resource (`products`, `collections`, `orders`) as it's fetched, with record counts and per-resource timing.
- A summary table at the end showing records/durationMs/status per resource, plus total elapsed time.
- JSON files written to a local `.test-backups/` directory (gitignored, never committed):
  ```
  .test-backups/products.json
  .test-backups/collections.json
  .test-backups/orders.json
  ```
- Exit code `0` on full success, `1` if any resource fails (with the error printed) or if required env vars are missing.

**How to inspect results:**
```bash
cat .test-backups/products.json | jq '. | length'        # record count
cat .test-backups/products.json | jq '.[0]'               # inspect first product's shape
```
Confirm the JSON shape matches what `runScheduledBackup` expects to write to R2 (a flat array of GraphQL `nodes` per resource) before deploying Worker changes that touch the backup queries.

### 11.3 Webhook Registration Runbook

Register the two webhook subscriptions Shopify sends to `https://<your-domain>/api/shopify/webhook`, signed with the same `SHOPIFY_WEBHOOK_SECRET` set in step 11.1:

**Via Shopify Admin UI:**
1. Shopify Admin → Settings → Notifications → Webhooks → Create webhook
2. Event: `Order creation` → Format: JSON → URL: `https://<your-domain>/api/shopify/webhook`
3. Repeat for `Inventory level update`

**Via Admin API (equivalent, scriptable):**
```graphql
mutation {
  webhookSubscriptionCreate(
    topic: ORDERS_CREATE
    webhookSubscription: { callbackUrl: "https://<your-domain>/api/shopify/webhook", format: JSON }
  ) {
    webhookSubscription { id }
    userErrors { field message }
  }
}
```
(Repeat with `topic: INVENTORY_LEVELS_UPDATE`.) Run this via a one-off authenticated request — not through the read-only Worker proxy, which blocks mutations.

**Verifying webhook delivery:**
- Trigger a test event (place a test order, adjust inventory) and check `wrangler tail` for `webhook.orders_create` / `webhook.inventory_levels_update` structured logs.
- A `401` response with `webhook.hmac_invalid` in the logs means the webhook subscription's secret doesn't match `SHOPIFY_WEBHOOK_SECRET` — re-create the subscription or re-run `wrangler secret put SHOPIFY_WEBHOOK_SECRET` with the correct value.
- Shopify retries failed webhooks with backoff; the receiver's side effects (structured log + notification stub) are idempotent, so duplicate deliveries are safe.
