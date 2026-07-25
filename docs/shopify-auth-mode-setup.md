# Shopify Live-Mode Config Contract & Setup Guide

This document covers the required environment variables and deployment configuration for the House of Mornii storefront. The app requires live Shopify Storefront API credentials in all environments (local, UAT, and production) — there is no demo or fixture-data mode.

## Startup Behavior

The app resolves Shopify credentials on startup in [`src/lib/shopify/client.ts`](../src/lib/shopify/client.ts:23). If `VITE_SHOPIFY_STORE_DOMAIN` or `VITE_SHOPIFY_STOREFRONT_TOKEN` is missing or set to a placeholder value, the client throws at module load time — the app will not render a degraded or fixture-backed UI. Every environment (local dev, UAT, production) must point at a real Shopify store (a dev/UAT store or the live store).

```ts
export const STOREFRONT_MODE: StorefrontMode = resolveStorefrontMode() // always 'token'
export const IS_CONFIGURED = true
```

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SHOPIFY_STORE_DOMAIN` | Yes | Your `*.myshopify.com` storefront domain. Example: `house-of-mornii.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Yes | Public Storefront API access token. Required for tags, metafields, and customer APIs. |

Both variables must be prefixed with `VITE_` to be exposed to the Vite build.

## Local Development Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials (use a Shopify development store for local work):
   ```env
   VITE_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=your-storefront-api-public-access-token
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

If either value is missing or a placeholder, the app throws immediately at startup — there is no fallback.

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

## Environments

| Environment | Shopify Store |
|-------------|----------------|
| Local | Shopify development store (recommended, same as UAT or a personal dev store) |
| UAT | Shopify development store |
| Production | Live Shopify store |

## Production Deployment (Cloudflare Pages)

Set environment variables in the Cloudflare Pages dashboard:

1. Go to **Workers & Pages → house-of-mornii-shop → Settings → Environment variables**.
2. Add both variables under **Production** (and **Preview** for UAT).
3. Rebuild the deployment — Vite bakes env vars into the bundle at build time.

> **Important:** The app throws at module load and will not start if `VITE_SHOPIFY_STORE_DOMAIN` or `VITE_SHOPIFY_STOREFRONT_TOKEN` is unset or set to a placeholder value, in every environment including local dev. This is intentional — it prevents a broken or commercially dead storefront from being served.

## CI / GitHub Actions

Pass the variables as GitHub secrets to your build workflow:

```yaml
- name: Build
  env:
    VITE_SHOPIFY_STORE_DOMAIN: ${{ secrets.VITE_SHOPIFY_STORE_DOMAIN }}
    VITE_SHOPIFY_STOREFRONT_TOKEN: ${{ secrets.VITE_SHOPIFY_STOREFRONT_TOKEN }}
  run: npm run build
```

For preview/UAT environments, use a dedicated Shopify **development store** with its own Storefront token so production credentials are never used in non-production builds.

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/shopify/client.ts` | Credential resolution, mode constant, `shopifyFetch` |
| `src/lib/shopify/queries.ts` | GraphQL query/mutation definitions |
| `src/lib/shopify/hooks.ts` | Data-fetching hooks |
| `src/main.tsx` | App bootstrap |
| `.env.example` | Template for local credentials |
