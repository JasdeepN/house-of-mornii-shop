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
- **`client.ts`** — thin GraphQL fetch wrapper against `https://{domain}/api/2026-01/graphql.json`. Exports `IS_CONFIGURED` (boolean) and `shopifyFetch<T>()`.
- **`hooks.ts`** — TanStack Query hooks: `useCollections`, `useCollection`, `useProduct`, `useProducts`, `useRelatedProducts`. Each hook checks `IS_CONFIGURED` and falls back to demo data when false.
- **`demo-data.ts`** — in-memory product/collection fixtures used when Shopify credentials are absent.
- **`queries.ts`** — all GraphQL query/mutation strings.
- **`types.ts`** — TypeScript types for Shopify API responses.

### Cart state (`src/context/CartContext.tsx`)
`CartProvider` wraps cart CRUD. In demo mode, cart is managed in-memory. In Shopify mode, cart ID is persisted to `localStorage` under key `hom-cart-id` and synced via Storefront API mutations.

### Styling
- Tailwind CSS v4 (`@tailwindcss/vite` plugin — no PostCSS config needed)
- `tailwind.config.js` reads `theme.json` at build time to merge custom design tokens
- Colors use OKLCH throughout (e.g., `oklch(0.10 0.02 210)`)
- Semantic color tokens (`neutral-*`, `accent-*`, `fg`, `bg`) are CSS variables mapped in Tailwind config
- Radix UI primitives wrapped in `src/components/ui/` (shadcn-style)

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point with providers |
| `src/App.tsx` | Router setup with lazy-loaded pages |
| `src/lib/shopify/client.ts` | Shopify API client with demo/tokenless/token modes |
| `src/lib/shopify/hooks.ts` | React Query hooks for data fetching |
| `src/lib/shopify/demo-data.ts` | Demo data fixtures |
| `src/context/CartContext.tsx` | Cart state management |
| `src/lib/siteConfig.ts` | Site configuration from env vars |
| `src/lib/analytics.ts` | GA4 + Meta Pixel analytics |
| `src/lib/newsletter.ts` | Newsletter subscription logic |

## Environment Variables

Required for Shopify mode:
- `VITE_SHOPIFY_STORE_DOMAIN`
- `VITE_SHOPIFY_STOREFRONT_TOKEN`

Optional:
- `VITE_GA4_MEASUREMENT_ID` (analytics)
- `VITE_META_PIXEL_ID` (Meta Pixel)
- `VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_SITE_DESCRIPTION`

## Testing

- **Unit tests**: Vitest + `@testing-library/react` + jsdom
- **E2E tests**: Playwright with Chromium
- Test files live alongside source: `*.test.{ts,tsx}`
- Setup file patches `IntersectionObserver` and stubs Shopify env vars
