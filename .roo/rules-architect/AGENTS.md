# Architect Mode Rules (Non-Obvious Only)

This file provides architectural guidance for AI assistants working with this repository.

## Architecture Constraints

### Shopify Storefront API

Only `'token'` mode exists — `STOREFRONT_MODE` from `@/lib/shopify/client` is always `'token'` and `IS_CONFIGURED` is always `true`. `client.ts` throws at module load if `VITE_SHOPIFY_STORE_DOMAIN` or `VITE_SHOPIFY_STOREFRONT_TOKEN` is missing or a placeholder value (`your-store.myshopify.com`, `CHANGE_ME`). No demo/tokenless fallback exists in any environment.

### Data Fetching Pattern

All hooks in `src/lib/shopify/hooks.ts` check `ADMIN_PROXY_ENABLED` (from `VITE_SHOPIFY_ADMIN_PROXY_ENABLED === 'true'`) and route through `adminProxyFetch` when true, otherwise use `shopifyFetch`. There is no demo data fallback — hooks always call the real Storefront API.

### Cart Persistence

Cart ID persisted to `localStorage` under key `hom-cart-id` and always synced via Storefront API mutations. On customer authentication, the anonymous cart is merged into the customer's account cart via `cartBuyerIdentityUpdate` mutation, then the local cart ID is cleared.

## Non-Obvious Architectural Decisions

### Path Alias Resolution

`@/` resolves to `src/` in both Vite and Vitest, configured in `vite.config.ts` (uses `process.env.PROJECT_ROOT || import.meta.dirname`) and `vitest.config.ts` (uses `__dirname`).

### Animation System

Framer Motion with custom `luxuryEase` cubic-bezier `[0.16, 1, 0.3, 1]` from `@/lib/animations.ts`. Page transitions use `pageTransition` variant with blur-clearing fade-up effect.

### Performance

- All pages lazy-loaded via `React.lazy` in `src/App.tsx`.
- TanStack Query `staleTime`: collections/products/related products = 5 minutes each; single product = 2 minutes.
- Shopify images appended with `&width={size}` for client-side resizing.

### Worker Architecture

Two separate Cloudflare Workers with distinct configs:
- `wrangler.toml` → `workers/shopify-proxy.ts`: Admin API proxy (read-only, mutation-blocked), webhook receiver, daily backup cron. Dev and production environments.
- `wrangler.catalog-sync.toml` → `workers/catalog-sync.ts`: Nightly prod→dev catalog sync (products + collections only, no PII). No HTTP route — scheduled() only.

### Security

- Admin API token (`SHOPIFY_ADMIN_ACCESS_TOKEN`) is server-side only in the Cloudflare Worker — never use a `VITE_`-prefixed var for it.
- Client only knows `VITE_SHOPIFY_ADMIN_PROXY_ENABLED` boolean flag.
- Webhook HMAC verification uses constant-time comparison via Web Crypto API in `workers/webhook.ts`.
