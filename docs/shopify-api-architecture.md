# Shopify API Architecture

**Last updated:** 2025-01 (API version 2026-01)

## Overview

This project uses **two distinct Shopify APIs** with clearly separated roles:

| API | Purpose | Auth Token | Where It Runs |
|-----|---------|------------|---------------|
| **Storefront API** | Public product browsing, cart operations, collection listing | `VITE_SHOPIFY_STOREFRONT_TOKEN` (public) | Browser (client-side) |
| **Admin API** | Full product/collection metadata, tags, vendor info | `VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` (secret) | Cloudflare Worker proxy only |

### Why Two APIs?

- **Storefront API** is designed for client-side use. Its public token has limited scope — it can read products and manage carts but cannot modify store data or access admin features.
- **Admin API** requires a secret access token that must never be exposed in the browser. It provides richer data (tags, vendor, metafields) and write capabilities.

## Current Architecture: Storefront-First with Optional Admin Proxy

### Deployment State

| Component | Deployed? | Notes |
|-----------|-----------|-------|
| **Cloudflare Pages** (frontend) | Yes | Serves the React SPA; calls Storefront API directly from browser |
| **Cloudflare Worker** (Shopify Automation Worker) | Yes | Deployed via `wrangler.toml`; see [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts) |

The storefront is a **storefront-first** application. All customer-facing data flows through the Storefront API. The Worker now provides three server-side automation capabilities in addition to the optional client-facing Admin proxy: (1) the read-only Admin proxy route, (2) scheduled backups to R2, and (3) a webhook receiver. None of these write to Shopify or expose secrets to the browser.

### Why the Client-Facing Admin Proxy Route Remains Read-Only

1. **Store-only business model**: This is a storefront-only shop. There are no day-to-day admin operations (inventory management, order processing) needed from the browser.
2. **Security best practice**: Shopify explicitly recommends against calling Admin API from the browser:
   > "Use the Storefront API for all client-side operations. The Admin API should never be called from the browser."
   > — [Shopify Docs](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api)
3. **Tokenless mode removed**: Earlier iterations supported a tokenless storefront mode. Per Shopify best practices, this was removed — all live environments now require a storefront token.

## Shopify Automation Worker (Deployed)

The Worker at [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts:1) is a multi-route Cloudflare Worker deployed via [`wrangler.toml`](../wrangler.toml). It dispatches on `url.pathname` and exposes an additional `scheduled()` Cron handler:

| Route/Trigger | Purpose | Guard |
|----------------|---------|-------|
| `POST /api/shopify/admin` | Read-only Admin API proxy (existing behavior, unchanged) | `MUTATION_PATTERN` blocks any `mutation` operation (403); CORS allowlist via `ALLOWED_ORIGIN` |
| `POST /api/shopify/webhook` | Shopify webhook receiver (`orders/create`, `inventory_levels/update`) | HMAC-SHA256 verification (`SHOPIFY_WEBHOOK_SECRET`) via Web Crypto, constant-time compare, 401 on mismatch/missing signature |
| `scheduled()` — Cron `0 3 * * *` | Daily backup export of products/collections/orders to R2 | try/catch with structured `console.error`; aborts cleanly and logs if the Admin token or R2 binding is missing |

### Backup Export

- Paginated Admin API GraphQL queries live in [`workers/backup-queries.ts`](../workers/backup-queries.ts) — cursor pagination via `pageInfo.hasNextPage` / `endCursor` against `/admin/api/2026-01/graphql.json`.
- Each resource (`products`, `collections`, `orders`) is written as `backups/<ISO-date>/<resource>.json` to the `SHOPIFY_BACKUPS` R2 bucket.
- After all resources complete, the `BACKUP_INDEX` KV namespace's `latest-backup` key is updated with `{ date, keys, counts, completedAt }`.
- Backups are **read-only** exports for disaster-recovery/audit purposes — no automated restore tooling exists yet (see Out of Scope below).

### Webhook Receiver

- HMAC verification and topic dispatch live in [`workers/webhook.ts`](../workers/webhook.ts).
- On a valid signature, the Worker branches on `X-Shopify-Topic` (`orders/create`, `inventory_levels/update`) to a structured-log + notification-stub side effect, then returns `200` immediately so Shopify does not retry.
- Invalid or missing signatures return `401` and are logged as `webhook.hmac_invalid`.

### Out of Scope (current iteration)

- Any admin UI (merchant uses Shopify's own dashboard).
- Write/mutation automation to Shopify — the proxy route remains mutation-blocked; backups are read-only.
- Automated restore tooling — backups are captured now; a restore script is a future iteration.
- External notification integrations beyond the log-based stub in `webhook.ts`.

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                          │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │ Components│───▶│ React Query  │    │ CartContext (localStorage)│ │
│  │ (ShopPage │    │ Hooks        │    │ hom-cart-id              │ │
│  │  etc.)   │    │              │    │                          │ │
│  └──────────┘    └──────┬───────┘    └──────────────────────────┘  │
│                         │                                           │
│              ┌──────────▼──────────┐                               │
│              │  shopifyFetch()     │ ← Storefront API (always)     │
│              │  adminProxyFetch()  │ ← Admin API (if token set)    │
│              └──────────┬──────────┘                               │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
          ┌───────────────┴────────────────┐
          │                                │
    POST /api/shopify/admin           Direct HTTPS
    (Cloudflare Worker proxy)           (browser → Shopify)
          │                                │
          │  SHOPIFY_ADMIN_ACCESS_TOKEN    VITE_SHOPIFY_STOREFRONT_TOKEN
          │  (server-side only)            (public token)
          │                                │
          ▼                                ▼
┌───────────────────────┐      ┌───────────────────────────┐
│  Shopify Admin API    │      │  Shopify Storefront API   │
│  /admin/api/2026-01/  │      │  /api/{token}/graphql.json│
│  (full metadata)      │      │  (product + cart data)    │
└───────────────────────┘      └───────────────────────────┘
```

### Component Breakdown

```
src/lib/shopify/
├── client.ts          # Core storefront GraphQL client using SDK
├── sdk-client.ts      # @shopify/storefront-api-client singleton
├── admin-proxy.ts     # Browser client for Admin API via Worker proxy
├── hooks.ts           # React Query hooks (useCollections, useProducts, etc.)
├── queries.ts         # GraphQL query definitions
├── retry.ts           # Retry logic wrapper
├── types.ts           # TypeScript type definitions
└── index.ts           # Barrel exports
```

### Hook Resolution Order (each hook checks in this order)

1. **Admin API available** (`VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` set): Call `adminProxyFetch()` → Cloudflare Worker → Admin API
2. **Token mode** (default live path): Call `shopifyFetch()` → SDK → Storefront API

## Environment Variables

### Required (Storefront API)

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify store subdomain (e.g., `house-of-mornii.myshopify.com`) | `client.ts`, `sdk-client.ts` |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Public Storefront API access token | `client.ts`, `sdk-client.ts` |

### Server-Side Only (Cloudflare Worker Secrets — Deployed)

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API access token (secret) | `hooks.ts` (conditional), `workers/shopify-proxy.ts` (required) |

### Runtime Mode Detection

```typescript
// client.ts — resolved at module load time; throws if credentials missing/placeholder
STOREFRONT_MODE = 'token'
IS_CONFIGURED = true
```

- **`token`**: Domain and storefront token present (required in every environment) → live Storefront API calls. Missing/placeholder credentials throw at module load rather than falling back.

## Cloudflare Worker: Shopify Automation Worker (Deployed)

The file `workers/shopify-proxy.ts` implements a multi-route Worker (see the dedicated section above for the full route table):

```typescript
// workers/shopify-proxy.ts
// POST /api/shopify/admin    → Forward to Shopify Admin API (read-only, mutation-blocked)
// POST /api/shopify/webhook  → HMAC-verified Shopify webhook receiver
// scheduled()                → Daily Cron backup export to R2 + KV index
// Holds SHOPIFY_ADMIN_ACCESS_TOKEN / SHOPIFY_WEBHOOK_SECRET server-side in Worker secrets
```

### Deploying / Redeploying the Worker

Deployment is automated in CI (`.github/workflows/deploy.yml`, gated to `main`) via `cloudflare/wrangler-action@v3` running `wrangler deploy`, which reads [`wrangler.toml`](../wrangler.toml). To deploy manually:

```bash
npx wrangler deploy
```

Worker secrets are provisioned once, out-of-band (never via CI):

```bash
npx wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN
npx wrangler secret put SHOPIFY_WEBHOOK_SECRET
```

See [`docs/deployment-runbook.md`](deployment-runbook.md) for the full secrets/backup/webhook runbook.

### Worker Security Model

- Admin token and webhook secret never leave the Cloudflare edge (Worker secrets, never `VITE_`-prefixed)
- CORS headers allow browser requests from the Pages-deployed frontend on the admin proxy route only
- The admin proxy route rejects `mutation` operations (403) and only accepts `POST`
- The webhook route requires a valid HMAC-SHA256 signature (401 on mismatch/missing) and returns 200 quickly on success
- All other paths return 404
- GraphQL errors are forwarded with appropriate status codes

## Future: If Full Admin Write Access Is Needed

### Scenario: Full Admin Integration

If the business requires write/mutation operations from the storefront (e.g., customer account management, order tracking) — currently explicitly out of scope:

1. **Add write-capable hooks** in `hooks.ts` for mutations (create orders, update customer data)
2. **Relax the `MUTATION_PATTERN` guard** in `workers/shopify-proxy.ts` for the specific, vetted mutation operations needed (never remove it wholesale)
3. **Add error handling** for Admin API-specific errors (unauthorized, rate limits)
4. The Worker already deploys alongside Pages via CI — no additional CI wiring needed

### Scenario: Direct Admin API from Server-Side

If server-side rendering or backend services are added later:

- Move Admin API calls to a backend service (Node.js, Cloudflare Workers D1, etc.)
- Keep Storefront API for client-side cart operations (Admin API has no cart support)

## Key Files Reference

| File | Role |
|------|------|
| [`src/lib/shopify/client.ts`](../src/lib/shopify/client.ts) | Core storefront GraphQL client, mode detection |
| [`src/lib/shopify/sdk-client.ts`](../src/lib/shopify/sdk-client.ts) | `@shopify/storefront-api-client` singleton |
| [`src/lib/shopify/admin-proxy.ts`](../src/lib/shopify/admin-proxy.ts) | Browser client for Admin API via Worker |
| [`src/lib/shopify/hooks.ts`](../src/lib/shopify/hooks.ts) | React Query hooks with 3-path resolution |
| [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts) | Cloudflare Worker router: admin proxy, webhook receiver, scheduled backup |
| [`workers/backup-queries.ts`](../workers/backup-queries.ts) | Paginated Admin API GraphQL queries for backup export |
| [`workers/webhook.ts`](../workers/webhook.ts) | Webhook HMAC verification + topic dispatch |
| [`wrangler.toml`](../wrangler.toml) | Worker deployment config: entry, Cron trigger, R2/KV bindings, vars |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | CI/CD: builds frontend, deploys to Pages, deploys the Worker (main only) |

## Dependencies

- `@shopify/storefront-api-client` — Official Shopify GraphQL client SDK
- `@tanstack/react-query` — Data fetching and caching layer
- React 19 + TypeScript 5.7 + Vite 7 (project stack)
