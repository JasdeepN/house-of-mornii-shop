# Ask Mode Rules (Non-Obvious Only)

This file provides documentation-specific guidance for AI assistants working with this repository.

## Architecture Overview

### Provider hierarchy (`src/main.tsx`)
```
ErrorBoundary
  QueryClientProvider   ← TanStack Query (staleTime defaults per hook)
    App                 ← BrowserRouter, routes, layout
      CustomerAuthProvider
        CartProvider
```
Note: `CartProvider` and `CustomerAuthProvider` are nested inside `App`, not at the root level. Auth modal state (`showLogin`, `showRegister`, `showRecovery`) is managed in `AppContent` and rendered outside the `zIndex: 2` container to avoid stacking context trapping.

### Shopify integration (`src/lib/shopify/`)
- **`client.ts`** — GraphQL fetch wrapper using `@shopify/storefront-api-client` SDK against `https://{domain}/api/2026-01/graphql.json`. Exports `IS_CONFIGURED` (always `true`), `STOREFRONT_MODE` (always `'token'`), `shopifyFetch<T>()`, `StorefrontError`, `validateQueryMode()` (no-op). Throws at module load if credentials are missing/placeholder — no fallback in any environment.
- **`hooks.ts`** — TanStack Query hooks: `useCollections`, `useCollection`, `useProduct`, `useProducts`, `useRelatedProducts`. All hooks check `ADMIN_PROXY_ENABLED` and route through `adminProxyFetch` when true, otherwise use `shopifyFetch`. No demo data fallback.
- **`queries.ts`** — all GraphQL query/mutation strings (Storefront + Admin API variants).
- **`types.ts`** — TypeScript types for Shopify API responses. Also exports `flattenEdges()` and `formatMoney()` helpers.
- **`admin-proxy.ts`** — Browser client for Admin API via Cloudflare Worker proxy. Exports `adminProxyFetch<T>()` and `ADMIN_PROXY_ENABLED`.
- **`retry.ts`** — `withRetry<T>()` with exponential backoff (3 attempts, 500ms initial delay, retries on 408/429/5xx). All `shopifyFetch` calls are wrapped in retry.
- **`sdk-client.ts`** — Creates the singleton `@shopify/storefront-api-client` instance.
- **`env-schema.ts`** — Zod-based env validation (skipped in test mode).
- **`health.ts`** — Health check utilities for deployment verification.
- **`token-requirements.ts`** — Token-gated field registry (`tags`, `metafields`, `customer`).

### Cart state (`src/context/CartContext.tsx`)
Cart ID persisted to `localStorage` under key `hom-cart-id`. On customer authentication, anonymous cart is merged into customer's account cart via `cartBuyerIdentityUpdate` mutation.

### Customer auth (`src/context/CustomerAuthContext.tsx`)
Tokens stored in `localStorage` under keys `hom-customer-access-token` and `hom-customer-expires-at`. Token renewal uses `customerAccessTokenRenew` — expired tokens cannot be renewed, customer must re-login.

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point with providers |
| `src/App.tsx` | Router setup with lazy-loaded pages |
| `src/lib/shopify/client.ts` | Shopify API client (token mode only, throws on missing creds) |
| `src/lib/shopify/hooks.ts` | React Query hooks for data fetching |
| `src/context/CartContext.tsx` | Cart state management |
| `src/context/CustomerAuthContext.tsx` | Customer auth state management |
| `src/lib/siteConfig.ts` | Site config, contact, newsletter, welcome popup config |
| `src/lib/analytics.ts` | GA4 + Meta Pixel analytics |
| `src/lib/errorHandler.ts` | Centralized error handling with `useErrorHandler` hook |
| `src/lib/logger.ts` | Structured logging (dev: colored console, prod: JSON) |
