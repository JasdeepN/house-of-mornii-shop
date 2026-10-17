# Shopify Automation Worker

## Overview

The Cloudflare Worker at `workers/shopify-proxy.ts` provides two server-side automation capabilities alongside the storefront frontend:

1. **Webhook receiver** — HMAC-verified Shopify webhook ingress
2. **Scheduled backup** — daily Cron export of products/collections/orders to R2

The Admin token (`SHOPIFY_ADMIN_ACCESS_TOKEN`) and webhook secret (`SHOPIFY_WEBHOOK_SECRET`) are stored as Cloudflare Worker secrets — never `VITE_`-prefixed, never in the repo.

The Worker no longer proxies the Admin API: the storefront reads the Catalog through the Storefront API only ([ADR 0003](./adr/0003-catalog-reads-use-the-storefront-api-only.md)).

## Architecture

```
Browser (React SPA)
  └── shopifyFetch() → Storefront API (direct, public token)

Cloudflare Worker (workers/shopify-proxy.ts)
  ├── fetch()
  │   └── POST /api/shopify/webhook → HMAC-verified webhook receiver
  └── scheduled() — Cron "0 3 * * *"
      └── Export products + collections + orders → R2 + KV index
```

## Route Reference

| Route/Trigger | Purpose | Guard |
|---|---|---|
| `POST /api/shopify/webhook` | Webhook receiver (`orders/create`, `inventory_levels/update`) | HMAC-SHA256 verification via Web Crypto, constant-time compare, 401 on mismatch |
| `scheduled()` — Cron `0 3 * * *` | Daily backup export to R2 | try/catch with structured `console.error`; aborts cleanly if Admin token or R2 binding missing |

## Backup Export

- Paginated Admin API GraphQL queries in `workers/backup-queries.ts` — cursor pagination via `pageInfo.hasNextPage` / `endCursor` against `/admin/api/2026-01/graphql.json`
- Each resource written to R2 as `backups/<ISO-date>/<resource>.json`
- `BACKUP_INDEX` KV namespace's `latest-backup` key updated with `{ date, keys, counts, completedAt }`
- Backups are read-only exports for disaster recovery — no automated restore tooling exists

### Checking Backup Health

```bash
npx wrangler tail                      # live logs — look for "backup.complete" or "backup.failed"
npx wrangler kv key get latest-backup --namespace-id=<BACKUP_INDEX id>
npx wrangler r2 object get shopify-backups/backups/<date>/products.json --file=./products.json
```

### Manual Backup Testing

```bash
npm run test:backup-export
# or
npx tsx scripts/test-backup-export.ts
```

Requires `SHOPIFY_ADMIN_ACCESS_TOKEN` and `SHOPIFY_STORE_DOMAIN` in `.env.local` (non-`VITE_`-prefixed).

## Webhook Receiver

- HMAC verification and topic dispatch in `workers/webhook.ts`
- On valid signature, branches on `X-Shopify-Topic` (`orders/create`, `inventory_levels/update`) to structured-log + notification-stub side effects
- Returns `200` immediately on valid webhooks so Shopify does not retry
- Invalid/missing signatures return `401` and are logged as `webhook.hmac_invalid`

### Webhook Registration

Register in Shopify Admin → Settings → Notifications → Webhooks, or via Admin API:

```graphql
mutation {
  webhookSubscriptionCreate(
    topic: ORDERS_CREATE
    webhookSubscription: { callbackUrl: "https://<domain>/api/shopify/webhook", format: JSON }
  ) {
    webhookSubscription { id }
    userErrors { field message }
  }
}
```

## Worker Security Model

- Admin token and webhook secret never leave the Cloudflare edge (Worker secrets, never `VITE_`-prefixed)
- CORS headers allow browser requests from the Pages-deployed frontend on the admin proxy route only
- The admin proxy route rejects `mutation` operations (403) and only accepts `POST`
- The webhook route requires a valid HMAC-SHA256 signature (401 on mismatch/missing) and returns 200 quickly on success
- All other paths return 404

## Deployment

### First-Time Setup

1. Create R2 bucket and KV namespace:
   ```bash
   npx wrangler r2 bucket create shopify-backups
   npx wrangler kv namespace create BACKUP_INDEX
   ```
   Copy the returned KV namespace `id` into `wrangler.toml`'s `[[kv_namespaces]]` block.

2. Set non-secret vars in `wrangler.toml` (`SHOPIFY_STORE_DOMAIN`) to production values.

3. Provision Worker secrets out-of-band:
   ```bash
   npx wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN
   npx wrangler secret put SHOPIFY_WEBHOOK_SECRET
   ```
   - `SHOPIFY_ADMIN_ACCESS_TOKEN`: Requires `read_products` and `read_orders` scopes for backup export
   - `SHOPIFY_WEBHOOK_SECRET`: Generate with `openssl rand -hex 32`

4. Deploy manually to verify:
   ```bash
   npx wrangler deploy
   ```

### CI/CD

Worker deployment is automated in `.github/workflows/deploy.yml` (gated to `main`) via `cloudflare/wrangler-action@v3` running `wrangler deploy`. Worker secrets are provisioned once out-of-band via `wrangler secret put` — never in CI logs.

## Key Files

| File | Role |
|---|---|
| `workers/shopify-proxy.ts` | Cloudflare Worker router: admin proxy, webhook receiver, scheduled backup |
| `workers/backup-queries.ts` | Paginated Admin API GraphQL queries for products/collections/orders |
| `workers/webhook.ts` | Webhook HMAC verification + topic dispatch |
| `wrangler.toml` | Worker deployment config: entry, Cron trigger, R2/KV bindings, vars |
| `.github/workflows/deploy.yml` | CI/CD: builds frontend, deploys to Pages, deploys the Worker (main only) |

## Out of Scope

- Any admin UI (merchant uses Shopify's own dashboard)
- Write/mutation automation to Shopify (proxy route remains mutation-blocked; backups are read-only)
- Automated restore tooling (backups are captured now; a restore script is a future iteration)
- External notification integrations beyond the log-based stub in `webhook.ts`
