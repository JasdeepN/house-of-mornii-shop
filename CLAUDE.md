# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # TypeScript compile + Vite build (outputs to dist/)
npm run preview      # Serve the dist/ build locally
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
```

Run a single test file:
```bash
npx vitest run src/lib/shopify/client.test.ts
```

## Architecture

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

**Demo mode**: The app runs fully without Shopify credentials. Set `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` in `.env.local` to switch to live data. When unconfigured, `IS_CONFIGURED === false` and every data-fetching path silently uses demo fixtures instead.

### Cart state (`src/context/CartContext.tsx`)
`CartProvider` wraps cart CRUD. In demo mode, cart is managed in-memory. In Shopify mode, cart ID is persisted to `localStorage` under key `hom-cart-id` and synced via Storefront API mutations.

### Path alias
`@/` resolves to `src/`. Configured in both `vite.config.ts` and `vitest.config.ts`.

### Styling
- Tailwind CSS v4 (`@tailwindcss/vite` plugin — no PostCSS config needed).
- `tailwind.config.js` reads `theme.json` at build time to merge custom design tokens.
- Colors use OKLCH throughout (e.g. `oklch(0.10 0.02 210)`). Semantic color tokens (`neutral-*`, `accent-*`, `fg`, `bg`) are CSS variables mapped in Tailwind config.
- Radix UI primitives are wrapped in `src/components/ui/` (shadcn-style).

### Testing
- Vitest + `@testing-library/react` + jsdom.
- Setup file: `src/test/setup.ts` — patches `IntersectionObserver`, stubs `import.meta.env` Shopify vars to empty strings (triggering demo mode).
- Test files live alongside source: `*.test.{ts,tsx}`.

### Analytics (`src/lib/analytics.ts`)
GA4 + Meta Pixel scaffold. Page views are tracked automatically in `AnimatedRoutes`. Replace `G-XXXXXXXXXX` in `index.html` with a real GA4 measurement ID to activate.

## Plane Project

- Workspace slug: `projects`
- Project UUID: `e946ac6c-63b6-4455-abe1-90e59af9a03b`
- API key: `plane_api_f8584e63337f412889c44633ad762a5a`
- Base URL: `https://plane.server.lan/api/v1` (self-signed cert — use `-k`)

**State IDs** (verified 2026-04-14):

| State | ID |
|-------|----|
| Backlog | `ce01ca65-2bdb-47cf-8dbe-2589c9fbbdc9` |
| Todo | `9b6d5027-d776-4ec4-8ad7-449166d64a32` |
| In Progress | `604ad8dd-942e-4e5d-8b2d-d0613488a4a5` |
| Done | `6d91e07f-53ad-4e67-a632-ce25f527c81b` |
| Cancelled | `e1cb02ae-a603-48ba-9d84-3fcf1b52a5bc` |

**Known limitations:** The `/relations/` REST endpoint returns 404 on this instance. The Plane MCP tool also times out (connects to a different host). Document blocking chains as ticket comments instead.
