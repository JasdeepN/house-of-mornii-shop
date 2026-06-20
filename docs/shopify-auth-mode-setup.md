# Shopify Live-Mode Config Contract & Auth Mode Setup Guide

This document covers the three Storefront auth modes, required environment variables, and deployment configuration for the House of Mornii storefront.

## Auth Modes

The app resolves one of three `StorefrontMode` states on startup:

| Mode | Condition | Behavior |
|------|-----------|----------|
| `demo` | `VITE_SHOPIFY_STORE_DOMAIN` absent or set to a placeholder | Fixture data only. No live API calls made. |
| `tokenless` | Domain present, `VITE_SHOPIFY_STOREFRONT_TOKEN` absent | Connects to Shopify with no token. Only un-gated fields (titles, prices, images, variants) are available. Tags and metafields are excluded from queries. |
| `token` | Both domain and token present | Full Storefront API access. Token is sent as `X-Shopify-Storefront-Access-Token`. All fields including tags, metafields, and customer APIs are available. |

Resolution logic lives in `src/lib/shopify/client.ts`:

```ts
export const STOREFRONT_MODE: StorefrontMode = resolveStorefrontMode()
```

## Required Environment Variables

| Variable | Required for live mode | Description |
|----------|------------------------|-------------|
| `VITE_SHOPIFY_STORE_DOMAIN` | Yes | Your `*.myshopify.com` storefront domain. Example: `house-of-mornii.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Recommended | Public Storefront API access token. Unlocks tags, metafields, and customer order APIs. |

Both variables must be prefixed with `VITE_` to be exposed to the Vite build.

## Local Development Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials:
   ```env
   VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=your-storefront-api-public-access-token
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

The console will print a warning if either value is missing, indicating which mode is active.

## How to Get a Storefront Token

1. Log in to your Shopify admin (`your-store.myshopify.com/admin`).
2. Navigate to **Settings → Apps and sales channels**.
3. Click **Develop apps** → **Create an app**.
4. Under **API credentials**, select **Configure Storefront API scopes**.
5. Enable the required scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
6. Click **Install app** and copy the **Public access token**.

## Production Deployment (Cloudflare Pages)

Set environment variables in the Cloudflare Pages dashboard:

1. Go to **Workers & Pages → house-of-mornii-shop → Settings → Environment variables**.
2. Add both variables under **Production** (and **Preview** if desired).
3. Rebuild the deployment — Vite bakes env vars into the bundle at build time.

> **Important:** The app will fail to start in production with a misconfiguration screen if `VITE_SHOPIFY_STORE_DOMAIN` is unset or set to a placeholder value. This is intentional — it prevents a visually healthy but commercially dead storefront from being served to real customers. See [demo-mode-developer-guide.md](./demo-mode-developer-guide.md) for details.

## CI / GitHub Actions

Pass the variables as GitHub secrets to your build workflow:

```yaml
- name: Build
  env:
    VITE_SHOPIFY_STORE_DOMAIN: ${{ secrets.VITE_SHOPIFY_STORE_DOMAIN }}
    VITE_SHOPIFY_STOREFRONT_TOKEN: ${{ secrets.VITE_SHOPIFY_STOREFRONT_TOKEN }}
  run: npm run build
```

For preview environments, use a dedicated Shopify **development store** with its own Storefront token so production credentials are never used in non-production builds.

## Tokenless Mode Caveats

When running in `tokenless` mode the app silently switches to tag-free query variants:

- `PRODUCTS_QUERY_TOKENLESS` — no `tags` field on products
- `COLLECTION_BY_HANDLE_QUERY_TOKENLESS` — no `tags` field
- `PRODUCT_BY_HANDLE_QUERY_TOKENLESS` — no `tags` field

Tag-based search filtering in the Shop page falls back gracefully (matches on title only). No visible error is surfaced to the user, but tag-driven features will be silently absent.

To verify which mode is active at runtime, check the browser console on first load in development. In production, check the Vite build output — `STOREFRONT_MODE` is a compile-time constant.

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/shopify/client.ts` | Credential resolution, mode constant, `shopifyFetch` |
| `src/lib/shopify/queries.ts` | Token-mode and tokenless-mode query variants |
| `src/lib/shopify/hooks.ts` | Data-fetching hooks that select query based on mode |
| `src/main.tsx` | Production demo-mode guard |
| `.env.example` | Template for local credentials |
