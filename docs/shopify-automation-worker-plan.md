# Shopify Automation Worker Plan

> Status checklist
>
> - [x] Add `wrangler.toml` with Worker config, Cron Trigger, R2 + KV bindings
> - [x] Refactor `workers/shopify-proxy.ts` into a router (proxy + backup + webhook routes)
> - [x] Implement scheduled backup exporter (`scheduled` handler → R2 snapshots)
> - [x] Implement webhook receiver route with HMAC verification
> - [x] Add Admin API GraphQL query definitions for backup export
> - [x] Add Worker unit tests (backup serialization, HMAC verify, mutation guard)
> - [x] Add CI job to deploy the Worker via Wrangler
> - [x] Update env docs and `.env.example` with new server-side vars
> - [x] Update architecture docs to reflect deployed Worker

## Overview

Repurpose the currently-undeployed [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts:1) from a dead read-only Admin proxy into a deployed, multi-route **Shopify Automation Worker** on Cloudflare. The Worker gains two new capabilities alongside the existing read proxy: (1) **scheduled backups** — a Cron Trigger periodically exports products, collections, and orders from the Admin API and writes timestamped JSON snapshots to Cloudflare R2 (with a KV index of the latest snapshot); and (2) **webhook-driven automation** — a route that receives Shopify webhooks (order created, inventory updates), verifies their HMAC signature, and triggers side effects (structured logging, optional external notification). The merchant continues to manage the store in Shopify's own admin; this Worker is backend automation only, never a UI.

## Objectives

- Deploy the Worker for the first time with a reproducible `wrangler.toml` (bindings + Cron).
- Provide automated, versioned, off-Shopify **backups** of catalog and order data to R2 as a disaster-recovery/audit safety net.
- Provide a secure **webhook ingress** with mandatory HMAC verification to power event-driven automation.
- Keep the Admin token strictly server-side (never `VITE_`-prefixed), preserving the existing security posture.
- Preserve the existing read-proxy behavior and its mutation-block guard for backward compatibility.
- Wire Worker deployment into CI so it ships alongside the Pages frontend.

## Architecture

```
Cloudflare Worker (workers/shopify-proxy.ts → router)
├── fetch()  — HTTP routes
│   ├── POST /api/shopify/admin      → existing read-only Admin proxy (mutation-blocked)
│   └── POST /api/shopify/webhook    → HMAC-verified Shopify webhook receiver
└── scheduled()  — Cron Trigger (e.g. daily 03:00 UTC)
    └── export products + collections + orders (Admin API, paginated)
        → write JSON to R2:  backups/YYYY-MM-DD/{products,collections,orders}.json
        → update KV:         latest-backup → { date, keys, counts }

Bindings (wrangler.toml):
  - R2 bucket:   SHOPIFY_BACKUPS
  - KV namespace: BACKUP_INDEX
  - Secrets:      SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_WEBHOOK_SECRET
  - Vars:         SHOPIFY_STORE_DOMAIN, ALLOWED_ORIGIN
```

## Steps

1. **Create [`wrangler.toml`](../wrangler.toml)** at repo root defining: `main = "workers/shopify-proxy.ts"`, compatibility date, `[triggers] crons = ["0 3 * * *"]`, an `[[r2_buckets]]` binding (`SHOPIFY_BACKUPS`), a `[[kv_namespaces]]` binding (`BACKUP_INDEX`), and `[vars]` for `SHOPIFY_STORE_DOMAIN` / `ALLOWED_ORIGIN`. Document that `SHOPIFY_ADMIN_ACCESS_TOKEN` and `SHOPIFY_WEBHOOK_SECRET` are set as secrets via `wrangler secret put`, not in the file.

2. **Refactor [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts:41)** into an exported object with both `fetch` and `scheduled` handlers. Split the current inline logic into a small internal router that dispatches on `url.pathname`: keep the existing `/api/shopify/admin` behavior (including the `MUTATION_PATTERN` guard and CORS allowlist) intact, and add a `/api/shopify/webhook` branch.

3. **Add Admin API query definitions** for the backup export (new file `workers/backup-queries.ts` or inline constants): paginated GraphQL queries for `products`, `collections`, and `orders` using cursor pagination (`pageInfo.hasNextPage` / `endCursor`) against `/admin/api/2026-01/graphql.json` (matching the API version already in the Worker at line 113).

4. **Implement the `scheduled()` handler**: iterate each resource type, page through all records, assemble a JSON array per resource, and `PUT` each to R2 under `backups/<ISO-date>/<resource>.json`. After all writes succeed, update the `BACKUP_INDEX` KV key `latest-backup` with `{ date, keys, counts, completedAt }`. Add try/catch with structured `console.error` logging so a partial failure is observable (Worker logs via `wrangler tail`).

5. **Implement the `/api/shopify/webhook` route**: read the raw request body, compute the HMAC-SHA256 using `SHOPIFY_WEBHOOK_SECRET` via the Web Crypto API (`crypto.subtle`), constant-time compare against the `X-Shopify-Hmac-Sha256` header, and reject with `401` on mismatch. On success, branch on the `X-Shopify-Topic` header (e.g. `orders/create`, `inventory_levels/update`) and dispatch to a side-effect function (initially: structured log + optional outbound notification stub). Always return `200` quickly on valid webhooks so Shopify does not retry.

6. **Add Worker tests** (`workers/shopify-proxy.test.ts`, Vitest, run in the existing suite): cover HMAC verification (valid/invalid/missing signature), the mutation-block guard still rejecting mutations on the proxy route, webhook topic dispatch, and backup snapshot key/serialization shape (mock R2/KV bindings and `fetch`).

7. **Add a CI deploy job**: extend [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml:35) (or a new `deploy-worker.yml`) with a `wrangler-action@v3` step running `deploy` (Worker), gated to `main`, using `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets. Ensure Worker secrets (`SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`) are provisioned once out-of-band via `wrangler secret put` (documented, not in CI logs).

8. **Register the webhook in Shopify**: document (runbook) creating the `orders/create` and `inventory_levels/update` webhook subscriptions in the Shopify admin (or via Admin API) pointing at `https://<domain>/api/shopify/webhook`, using the same shared secret stored as `SHOPIFY_WEBHOOK_SECRET`.

9. **Update documentation and env samples**: revise [`docs/shopify-api-architecture.md`](../docs/shopify-api-architecture.md:26) to mark the Worker as deployed and describe the backup + webhook routes; add the new server-side vars/secrets to [`.env.example`](../.env.example:8) comments (as documentation only — secrets never committed); add a short backup/restore runbook section.

## File Changes

| File | Change |
|------|--------|
| [`wrangler.toml`](../wrangler.toml) | **Create** — Worker entry, Cron trigger, R2 + KV bindings, vars |
| [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts:1) | **Modify** — add `scheduled()` handler + webhook route; refactor into router; keep existing proxy + mutation guard |
| `workers/backup-queries.ts` | **Create** — paginated Admin API GraphQL queries for products/collections/orders |
| `workers/webhook.ts` | **Create** — HMAC verification + topic dispatch helpers (keeps main file lean) |
| `workers/shopify-proxy.test.ts` | **Create** — Vitest coverage for HMAC, mutation guard, webhook dispatch, backup shape |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml:35) | **Modify** — add Worker deploy step/job (or add `deploy-worker.yml`) |
| [`.env.example`](../.env.example:8) | **Modify** — document `SHOPIFY_WEBHOOK_SECRET` + R2/KV binding names (comments only) |
| [`docs/shopify-api-architecture.md`](../docs/shopify-api-architecture.md:26) | **Modify** — mark Worker deployed; document backup + webhook routes |
| [`docs/deployment-runbook.md`](../docs/deployment-runbook.md:1) | **Modify** — add Worker secrets setup, backup/restore + webhook registration runbook |

## Risks

- **Admin API scopes**: Exporting orders/customers requires read scopes (`read_orders`, `read_products`) on the Admin token. *Mitigation*: verify scopes before first run; the `scheduled()` handler logs and aborts cleanly on `403`.
- **Cron execution limits / large catalogs**: Very large stores could approach Worker CPU/time limits during a full export. *Mitigation*: cursor pagination with bounded page sizes; if needed, split the export across resources or move heavy runs to a queue/step in a later iteration.
- **PII in backups**: Order data contains customer PII. *Mitigation*: restrict the R2 bucket to server-side access only (no public bucket), document retention/lifecycle rules, and consider excluding/omitting sensitive fields if not needed for the backup's purpose.
- **Webhook secret handling**: A leaked `SHOPIFY_WEBHOOK_SECRET` allows spoofed events. *Mitigation*: store only as a Wrangler secret, never in the repo or `VITE_` vars; constant-time HMAC compare; reject unverified requests with `401`.
- **CORS/route regression on the existing proxy**: Refactoring into a router could break the current `/api/shopify/admin` behavior. *Mitigation*: preserve existing tests and add explicit route tests before merging.
- **Double-trigger / retry idempotency**: Shopify retries webhooks; side effects must tolerate duplicates. *Mitigation*: keep initial side effects idempotent (logging/notification) and note idempotency requirements for any future stateful automation.
- **CI secret exposure**: Worker deploy must not print secrets. *Mitigation*: provision secrets via `wrangler secret put` out-of-band; CI only needs the Cloudflare API token.

## Out of Scope (this iteration)

- Any admin **UI** — the merchant uses Shopify's dashboard directly.
- **Write/mutation** automation to Shopify (the proxy route remains mutation-blocked; backups are read-only).
- Automated **restore** tooling (backups are captured now; a restore script can be a follow-up).
- External integrations beyond a notification stub (Slack/email wiring can follow once the ingress is proven).
