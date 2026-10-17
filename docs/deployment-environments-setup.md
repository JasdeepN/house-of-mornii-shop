# Deployment Environments Setup Guide

**Status:** Reflects the implemented workflow in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), [`wrangler.toml`](../wrangler.toml), and [`wrangler.catalog-sync.toml`](../wrangler.catalog-sync.toml).
**Last updated:** 2026-05

---

## Dev Is an Isolated, Nightly-Synced Store (Approach A)

`dev.houseofmornii.com` is **not** a preview of the live production store. It is a
**fully isolated environment** backed by its **own free Shopify development store**,
with no live connection to production. A separate Cloudflare Worker
([`workers/catalog-sync.ts`](../workers/catalog-sync.ts)) runs nightly and copies
**catalog data only** — products and collections, including images, descriptions,
variants, options, and pricing — from the **production** store into the **dev**
store via the Admin API. See [`docs/dev-snapshot-environment-plan.md`](./dev-snapshot-environment-plan.md)
for the full rationale (Approach A vs. B).

Key guarantees:

- **Catalog only, never PII.** The sync reads/writes products and collections
  exclusively. Orders and customers are **never** fetched from production and
  **never** written to dev — see the "no orders/customers" test coverage in
  [`workers/catalog-sync.test.ts`](../workers/catalog-sync.test.ts).
- **Idempotent, matched by handle.** Every nightly run **updates** existing dev
  products/collections (matched by `handle`) rather than creating duplicates —
  via the `productSet` mutation's `identifier: { handle }` and a
  `collectionByHandle` lookup before `collectionCreate`/`collectionUpdate`.
- **Images are referenced, not re-uploaded.** Dev products point at the
  production CDN image URLs directly (`originalSource`) — acceptable for a dev
  environment and avoids downloading/re-uploading binaries.
- **~24h data freshness.** The sync runs nightly at **02:00 UTC** — one hour
  before the existing 03:00 UTC backup Cron Trigger in `wrangler.toml` — so dev
  reflects roughly a day-old copy of the production catalog.
- **Frontend code is unchanged.** The app always talks to a real Storefront
  API; dev just uses the dev store's own domain + Storefront token. Cart and
  checkout work natively on dev because it's a genuine (if disposable) Shopify
  store.

### One-time manual setup — dev catalog store

1. **Create a free Shopify development store** at
   [partners.shopify.com](https://partners.shopify.com) — no subscription
   required. Record its `*.myshopify.com` domain.
2. **Create two custom apps in the dev store**:
   - One with **Storefront API** access → captures the dev **Storefront**
     token (`DEV_VITE_SHOPIFY_STOREFRONT_TOKEN` — used by the frontend build).
   - One with **Admin API** access (`read_products`, `write_products`,
     `read_content`, `write_content` scopes at minimum) → captures the dev
     **Admin** token (`DEV_ADMIN_ACCESS_TOKEN` — used only by the Catalog Sync
     Worker, never by the frontend).
3. **Create (or reuse) a production-side Admin API app** on the production
   store with **read-only** `read_products`/`read_content` scopes → captures
   `PROD_ADMIN_ACCESS_TOKEN` (used only by the Catalog Sync Worker to read the
   catalog; the sync never writes to production).
4. Set `DEV_VITE_SHOPIFY_STORE_DOMAIN` / `DEV_VITE_SHOPIFY_STOREFRONT_TOKEN` as
   GitHub Actions secrets (Step 3 below) so the dev frontend build points at
   the dev store.
5. Provision the Catalog Sync Worker's secrets and vars — see
   "Step 2b: Configure the Catalog Sync Worker" below.

### Running and observing the sync

The sync runs automatically on its Cron Trigger (`0 2 * * *`, UTC). To watch
it run in real time or trigger it manually:

```bash
# Tail live logs from the Catalog Sync Worker (structured JSON log lines —
# catalog_sync.product_upserted, catalog_sync.collection_upsert_failed, etc.)
npx wrangler tail --config wrangler.catalog-sync.toml

# Trigger an ad-hoc run without waiting for the cron (dev/local testing only —
# invokes the deployed Worker's scheduled handler)
npx wrangler deploy --config wrangler.catalog-sync.toml --dry-run   # validate config
```

Each run logs a structured summary (`catalog_sync.complete`) with per-resource
counts of succeeded/failed upserts, and a `catalog_sync.*_failed` /
`catalog_sync.*_exception` line for every individual failure — so partial
failures (e.g. one bad product) are observable without aborting the whole run.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GitHub Actions                             │
│                                                                       │
│  push to dev  branch ──→ test-and-build ──→ deploy-dev              │
│  push to main branch ──→ test-and-build ──→ deploy-production       │
│                                                                       │
│  Both deploys are AUTOMATIC on push — no manual approval by default │
│  (add "Required reviewers" on the `production` GitHub Environment   │
│  if you want an approval gate before prod deploys — see Step 3).    │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
          ┌─────────────────┴──────────────────┐
          │                                     │
   deploy-dev job                        deploy-production job
          │                                     │
   ┌──────┴───────┐                      ┌──────┴───────┐
   │ Pages: dev   │                      │ Pages: prod  │
   │ Worker: dev  │                      │ Worker: prod │
   └──────┬───────┘                      └──────┬───────┘
          │                                     │
  Cloudflare Pages                      Cloudflare Pages
  Project: house-of-mornii-dev          Project: house-of-mornii
  + custom domain:                      + custom domain:
    dev.houseofmornii.com                 houseofmornii.com
          │                                     │
  Cloudflare Worker                     Cloudflare Worker
  shopify-automation-worker-dev         shopify-automation-worker-production
  Route: dev.houseofmornii.com/         Route: houseofmornii.com/
         api/shopify/*                         api/shopify/*
```

### Key Design Decisions

1. **Single workflow file, two jobs.** [`deploy.yml`](../.github/workflows/deploy.yml) has one shared `test-and-build` job, then two independent deploy jobs (`deploy-dev`, `deploy-production`) each gated by `if: github.ref_name == '<branch>'`. Only one deploy job runs per push.
2. **Fully automatic deploys on push.** Pushing to `dev` deploys to dev automatically; pushing to `main` deploys to production automatically. There is no manual `workflow_dispatch` gate by default — add GitHub Environment protection rules (Step 3) if you want a manual approval step before production goes live.
3. **Shared build artifact.** The `test-and-build` job runs once (tests + build) and uploads `dist/` as an artifact scoped to the branch name; the deploy job downloads it rather than rebuilding, so what was tested is exactly what ships.
4. **Two Cloudflare Pages projects.** `house-of-mornii-dev` and `house-of-mornii` are independent Pages projects with separate secrets, branches, and custom domains.
5. **One Cloudflare Worker, two named `wrangler.toml` environments.** The Shopify Automation Worker ([`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts)) is deployed twice under `[env.dev]` and `[env.production]` in [`wrangler.toml`](../wrangler.toml) — each with its own R2 bucket, KV namespace, store domain, and route. Bindings are **not inherited** between Wrangler environments; each environment section declares everything it needs.

---

## Step 1: Create Cloudflare Pages Projects

### Dev Project (house-of-mornii-dev)

1. Go to **Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git**
2. Select your GitHub repository
3. **Project name:** `house-of-mornii-dev`
4. **Production branch:** `dev` (or leave build settings empty — the build runs in GitHub Actions and is uploaded via `wrangler pages deploy`)
5. **Build output directory:** `dist`
6. **Environment variables:** Set dev-specific values:
   ```
   VITE_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=dev-storefront-token
   VITE_SITE_NAME=House of Mornii (Dev)
   VITE_SITE_URL=https://dev.houseofmornii.com
   ```
7. **Custom domain:** Add `dev.houseofmornii.com` as a custom domain (Settings → Custom Domains → Set up a custom domain)

### Prod Project (house-of-mornii)

1. Same flow, but:
2. **Project name:** `house-of-mornii`
3. **Production branch:** `main`
4. **Environment variables:** Set production values:
   ```
   VITE_SHOPIFY_STORE_DOMAIN=your-prod-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=prod-storefront-token
   VITE_SITE_NAME=House of Mornii
   VITE_SITE_URL=https://houseofmornii.com
   ```
5. **Custom domain:** `houseofmornii.com` should already be configured

---

## Step 2: Configure the Cloudflare Worker (Shopify Automation)

The Worker in [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts) deploys under two named environments defined in [`wrangler.toml`](../wrangler.toml): `env.dev` and `env.production`. Each needs its own R2 bucket, KV namespace, and route created once before the first deploy.

### One-time setup — dev

```bash
# Create the R2 bucket used for scheduled backups
npx wrangler r2 bucket create shopify-backups-dev

# Create the KV namespace used for the backup index
npx wrangler kv namespace create BACKUP_INDEX --env dev
# → copy the returned "id" into wrangler.toml under [[env.dev.kv_namespaces]]

# Provision secrets (never stored in wrangler.toml or the repo)
npx wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN --env dev
npx wrangler secret put SHOPIFY_WEBHOOK_SECRET --env dev
```

### One-time setup — production

```bash
npx wrangler r2 bucket create shopify-backups-production

npx wrangler kv namespace create BACKUP_INDEX --env production
# → copy the returned "id" into wrangler.toml under [[env.production.kv_namespaces]]

npx wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN --env production
npx wrangler secret put SHOPIFY_WEBHOOK_SECRET --env production
```

### Routes

Each environment in `wrangler.toml` declares a route so the Worker intercepts `/api/shopify/*` on its own subdomain:

```toml
[env.dev]
routes = [
  { pattern = "dev.houseofmornii.com/api/shopify/*", zone_name = "houseofmornii.com" }
]

[env.production]
routes = [
  { pattern = "houseofmornii.com/api/shopify/*", zone_name = "houseofmornii.com" }
]
```

Both `dev.houseofmornii.com` and `houseofmornii.com` must already exist as active zones/records in the same Cloudflare account (added as custom domains on their respective Pages projects in Step 1) before these routes will resolve.

### Manual deploy (optional — CI does this automatically)

```bash
npx wrangler deploy --env dev
npx wrangler deploy --env production
```

---

## Step 2b: Configure the Catalog Sync Worker (dev only)

[`workers/catalog-sync.ts`](../workers/catalog-sync.ts) is a **separate**
Worker deployed via its own config file,
[`wrangler.catalog-sync.toml`](../wrangler.catalog-sync.toml) — not via
`wrangler.toml`'s `[env.*]` blocks — because it is a distinct entrypoint
(`main`) with its own cron trigger and an asymmetric pair of Admin credentials
(prod read + dev write). Wrangler only supports one `main` per top-level
config, so a second config file is the cleaner option here. It has no HTTP
route and only meaningfully runs for **dev** (it writes catalog data into the
dev store) — there is no production variant of this Worker.

```bash
# Provision secrets (never stored in wrangler.catalog-sync.toml or the repo)
npx wrangler secret put PROD_ADMIN_ACCESS_TOKEN --config wrangler.catalog-sync.toml
npx wrangler secret put DEV_ADMIN_ACCESS_TOKEN --config wrangler.catalog-sync.toml

# Manual deploy (optional — CI's deploy-dev job does this automatically)
npx wrangler deploy --config wrangler.catalog-sync.toml

# Tail logs to observe the nightly sync (or an ad-hoc manual run)
npx wrangler tail --config wrangler.catalog-sync.toml
```

Update the `PROD_SHOPIFY_STORE_DOMAIN` and `DEV_SHOPIFY_STORE_DOMAIN` vars in
`wrangler.catalog-sync.toml` to your real store domains before deploying (the
checked-in file has placeholder `your-store.myshopify.com` values).

> **PII guarantee:** `PROD_ADMIN_ACCESS_TOKEN` should be scoped read-only
> (`read_products`, `read_content`) — the sync never writes to production and
> never requests order/customer data. `DEV_ADMIN_ACCESS_TOKEN` needs write
> scopes (`write_products`, `write_content`) since dev is the only store this
> Worker ever writes to.

---

## Step 3: Configure GitHub Actions Secrets and Variables

### Required Repository Secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Used By | Description |
|--------|---------|--------------|
| `CLOUDFLARE_API_TOKEN` | Both deploy jobs | API token with Pages Edit + Workers Scripts Edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Both deploy jobs | Your Cloudflare account ID |
| `DEV_VITE_SHOPIFY_STORE_DOMAIN` | test-and-build (dev) | Dev Shopify store domain |
| `DEV_VITE_SHOPIFY_STOREFRONT_TOKEN` | test-and-build (dev) | Dev Storefront API public token |
| `PROD_VITE_SHOPIFY_STORE_DOMAIN` | test-and-build (prod) | Production Shopify store domain |
| `PROD_VITE_SHOPIFY_STOREFRONT_TOKEN` | test-and-build (prod) | Production Storefront API public token |

> The Worker secrets (`SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`) are **not** GitHub Actions secrets — they are provisioned directly on Cloudflare per environment via `wrangler secret put --env <dev|production>` (Step 2) and are never referenced in the workflow file.
>
> Likewise, the Catalog Sync Worker's secrets (`PROD_ADMIN_ACCESS_TOKEN`, `DEV_ADMIN_ACCESS_TOKEN`) are **not** GitHub Actions secrets — they are provisioned directly on Cloudflare via `wrangler secret put --config wrangler.catalog-sync.toml` (Step 2b) and never referenced in the workflow file. Neither is ever prefixed with `VITE_` — real Admin API tokens must stay server-side only, inside the Worker.

### Optional: GitHub Environments for approval gates

By default both `deploy-dev` and `deploy-production` run automatically on push with no manual approval. If you want production to require a human sign-off before going live:

1. Go to **Settings → Environments → New environment** → name it `production`
2. Enable **"Required reviewers"** and add 1–2 approvers
3. Because `deploy-production` in [`deploy.yml`](../.github/workflows/deploy.yml) already declares `environment: production`, GitHub will now pause that job for approval before it runs
4. Repeat with a `dev` environment if you want the same gate on dev (not recommended, since dev is meant to auto-deploy for fast iteration)

---

## Step 4: Verify Workflow Triggers

### Auto-deploy to dev

```bash
git checkout dev
# make changes
git push origin dev
```

This triggers `test-and-build` → `deploy-dev`, publishing:
- Frontend to Cloudflare Pages project `house-of-mornii-dev` → `https://dev.houseofmornii.com`
- Worker to `shopify-automation-worker-dev`, routed at `https://dev.houseofmornii.com/api/shopify/*`

### Auto-deploy to production

```bash
git checkout main
git merge dev   # or your usual release flow
git push origin main
```

This triggers `test-and-build` → `deploy-production`, publishing:
- Frontend to Cloudflare Pages project `house-of-mornii` → `https://houseofmornii.com`
- Worker to `shopify-automation-worker-production`, routed at `https://houseofmornii.com/api/shopify/*`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Pages deploy fails with "project not found" | Ensure Cloudflare Pages projects are created with exact names `house-of-mornii-dev` and `house-of-mornii` (Step 1) |
| Worker deploy fails with "route already assigned" | Another Worker/Pages project may already own that route pattern — check **Cloudflare Dashboard → Workers Routes** for conflicts |
| Worker deploy fails with "Unknown environment" | Confirm `wrangler.toml` contains matching `[env.dev]` / `[env.production]` sections and the workflow uses `deploy --env <name>` |
| Build fails with Shopify credential error | Set `DEV_VITE_SHOPIFY_STORE_DOMAIN`/`DEV_VITE_SHOPIFY_STOREFRONT_TOKEN` (or the `PROD_` equivalents) as repository secrets |
| Custom domain not resolving | Verify DNS records in Cloudflare dashboard; the Pages custom domain must exist before the Worker route pattern using the same zone will validate |
| KV/R2 bind errors on Worker deploy | Run the one-time `wrangler r2 bucket create` / `wrangler kv namespace create` commands in Step 2 and paste the real IDs into `wrangler.toml` (the checked-in file has `REPLACE_WITH_..._ID` placeholders) |
| Secrets not available in job | Ensure secrets are named exactly as listed in Step 3 and scoped at the repository (or environment) level in GitHub Actions settings |

---

## Rollback Instructions

### Cloudflare Pages rollback

1. Go to **Cloudflare Dashboard → Workers & Pages → Your Project → Deployments**
2. Find the previous working deployment
3. Click **"Rollback to this deployment"**

### Cloudflare Worker rollback

1. Go to **Cloudflare Dashboard → Workers & Pages → shopify-automation-worker-\<dev|production\> → Deployments**
2. Select a previous version and roll back, or redeploy from a previous commit:
   ```bash
   git checkout <previous-commit> -- workers/ wrangler.toml
   npx wrangler deploy --env production
   ```

### GitHub Actions rollback

```bash
# Find previous commit
git log --oneline -10

# Revert and push — this re-triggers the same automatic deploy pipeline
git revert <commit-hash>
git push origin main   # or dev
```

---

## Post-Deployment Verification Checklist

After each deployment:

- [ ] Visit the environment URL (`https://dev.houseofmornii.com` or `https://houseofmornii.com`) — verify page loads, no console errors
- [ ] Test Shopify product data displays correctly
- [ ] Verify cart functionality works
- [ ] Confirm the webhook route responds: `curl -i -X POST https://<domain>/api/shopify/webhook` should return a 401 (HMAC check fails), not a 404 from the static assets
- [ ] Check `wrangler tail --env <dev|production>` for Worker errors after a webhook or the next scheduled backup
- [ ] Run E2E tests against the new URL if applicable
