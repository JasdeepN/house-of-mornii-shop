# Ask Mode Rules (Non-Obvious Only)

This file provides documentation-specific guidance for AI assistants working with this repository.

## Architecture Overview

### Provider hierarchy (`src/main.tsx`)
```
ErrorBoundary
  QueryClientProvider   ← TanStack Query (staleTime defaults per hook)
    CartProvider        ← cart state + Shopify cart mutations
      App               ← BrowserRouter, routes, layout
```

### Routing (`src/App.tsx`)
All page components are **lazy-loaded** via `React.lazy`. Routes: `/`, `/shop`, `/collections`, `/collections/:handle`, `/products/:handle`, `/about`, `/contact`, `/cart`. Page transitions use `framer-motion` `AnimatePresence`.

### Shopify integration (`src/lib/shopify/`)
- **`client.ts`** — thin GraphQL fetch wrapper against `https://{domain}/api/2026-01/graphql.json`. Exports `IS_CONFIGURED` and `shopifyFetch<T>()`.
- **`hooks.ts`** — TanStack Query hooks (`useCollections`, `useCollection`, `useProduct`, `useProducts`, `useRelatedProducts`). Each checks `IS_CONFIGURED` and falls back to demo data.
- **`demo-data.ts`** — in-memory product/collection fixtures.
- **`queries.ts`** — all GraphQL query/mutation strings.
- **`types.ts`** — TypeScript types for Shopify API responses.

### Cart state (`src/context/CartContext.tsx`)
In demo mode, cart is in-memory. In Shopify mode, cart ID persisted to `localStorage` under key `hom-cart-id`.

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point with providers |
| `src/App.tsx` | Router setup with lazy-loaded pages |
| `src/lib/shopify/client.ts` | Shopify API client with demo/tokenless/token modes |
| `src/lib/shopify/hooks.ts` | React Query hooks for data fetching |
| `src/context/CartContext.tsx` | Cart state management |
