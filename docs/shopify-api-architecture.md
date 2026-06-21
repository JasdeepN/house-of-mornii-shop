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
| **Cloudflare Worker** (admin proxy) | No | Code exists in `workers/shopify-proxy.ts` but is not deployed |

The storefront is a **storefront-first** application. All customer-facing data flows through the Storefront API. The Admin API layer exists in code as an optional enhancement that activates when `VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` is set.

### Why Admin API Is Not Deployed

1. **Store-only business model**: This is a storefront-only shop. There are no day-to-day admin operations (inventory management, order processing) needed from the browser.
2. **Security best practice**: Shopify explicitly recommends against calling Admin API from the browser:
   > "Use the Storefront API for all client-side operations. The Admin API should never be called from the browser."
   > — [Shopify Docs](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api)
3. **Tokenless mode removed**: Earlier iterations supported a tokenless storefront mode. Per Shopify best practices, this was removed — all live environments now require a storefront token.

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
├── demo-data.ts       # Fixture data when credentials absent
├── retry.ts           # Retry logic wrapper
├── types.ts           # TypeScript type definitions
└── index.ts           # Barrel exports
```

### Hook Resolution Order (each hook checks in this order)

1. **Demo mode** (`!IS_CONFIGURED`): Return fixture data from `demo-data.ts`
2. **Admin API available** (`VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` set): Call `adminProxyFetch()` → Cloudflare Worker → Admin API
3. **Token mode** (default live path): Call `shopifyFetch()` → SDK → Storefront API

## Environment Variables

### Required (Storefront API)

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `VITE_SHOPIFY_STORE_DOMAIN` | Shopify store subdomain (e.g., `house-of-mornii.myshopify.com`) | `client.ts`, `sdk-client.ts` |
| `VITE_SHOPIFY_STOREFRONT_TOKEN` | Public Storefront API access token | `client.ts`, `sdk-client.ts` |

### Optional (Admin API Proxy — Not Deployed)

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API access token (secret) | `hooks.ts` (conditional), `workers/shopify-proxy.ts` (required) |

### Runtime Mode Detection

```typescript
// client.ts — determines mode at module load time
STOREFRONT_MODE = 'demo' | 'token'
IS_CONFIGURED = STOREFRONT_MODE !== 'demo'  // true only in 'token' mode
```

- **`demo`**: Missing domain or storefront token → app uses `demo-data.ts` fixtures
- **`token`**: Both domain and storefront token present → live Storefront API calls

## Cloudflare Worker Proxy (Optional, Not Deployed)

The file `workers/shopify-proxy.ts` implements a secure Admin API proxy:

```typescript
// workers/shopify-proxy.ts
// POST /api/shopify/admin → Forward to Shopify Admin API
// Holds SHOIPIFY_ADMIN_ACCESS_TOKEN server-side in Worker env vars
```

### To Deploy the Worker (Future)

1. Set `SHOPIFY_ADMIN_ACCESS_TOKEN` in Cloudflare Worker environment variables
2. Set `SHOPIFY_STORE_DOMAIN` in Worker environment variables
3. Deploy with Wrangler:
   ```bash
   npx wrangler deploy workers/shopify-proxy.ts
   ```
4. Update DNS/routing so `/api/shopify/admin` reaches the Worker

### Worker Security Model

- Admin token never leaves the Cloudflare edge
- CORS headers allow browser requests from the Pages-deployed frontend
- Only `POST /api/shopify/admin` is accepted; all other paths return 404
- GraphQL errors are forwarded with appropriate status codes

## Future: If Admin API Is Needed

### Scenario: Full Admin Integration

If the business requires admin operations from the storefront (e.g., customer account management, order tracking):

1. **Deploy the Cloudflare Worker** (steps above)
2. **Add write-capable hooks** in `hooks.ts` for mutations (create orders, update customer data)
3. **Add error handling** for Admin API-specific errors (unauthorized, rate limits)
4. **Update CI/CD** to deploy the Worker alongside Pages

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
| [`workers/shopify-proxy.ts`](../workers/shopify-proxy.ts) | Cloudflare Worker Admin API proxy |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | CI/CD: builds frontend, deploys to Pages |

## Dependencies

- `@shopify/storefront-api-client` — Official Shopify GraphQL client SDK
- `@tanstack/react-query` — Data fetching and caching layer
- React 19 + TypeScript 5.7 + Vite 7 (project stack)
