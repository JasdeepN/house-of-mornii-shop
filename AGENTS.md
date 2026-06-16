# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build & Development

```bash
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # TypeScript compile + Vite build (outputs to dist/)
npm run preview      # Serve the dist/ build locally
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
npm run test:e2e     # Playwright E2E tests
```

Run a single test:
```bash
npx vitest run src/lib/shopify/client.test.ts
```

## Stack

- **Framework**: React 19 + TypeScript 5.7 + Vite 7
- **Routing**: React Router DOM 7 with lazy-loaded pages
- **State**: TanStack Query for data fetching, React Context for cart
- **Styling**: Tailwind CSS 4 (no PostCSS), OKLCH color system
- **Animations**: Framer Motion with custom "luxury" easing
- **UI Components**: Radix UI primitives wrapped in shadcn-style components

## Shopify Integration

- **Demo mode**: App runs fully without Shopify credentials using fixture data
- **Tokenless mode**: Domain present but no Storefront token (limited fields)
- **Token mode**: Full access with Storefront token
- Check `STOREFRONT_MODE` or `IS_CONFIGURED` from `@/lib/shopify/client`
- Production builds fail loudly if demo mode is detected

## Path Alias

`@/` resolves to `src/` (configured in vite.config.ts and vitest.config.ts)

## Testing

- **Unit tests**: Vitest + `@testing-library/react` + jsdom
- **E2E tests**: Playwright with Chromium
- Test files live alongside source: `*.test.{ts,tsx}`
- Setup file patches `IntersectionObserver` and stubs Shopify env vars

## Key Patterns

- **Baroque border system**: `OrnamentalBorder` component uses PNG/SVG border images
- **Cart ID persistence**: Stored in `localStorage` under key `hom-cart-id`
- **Welcome popup**: Shows once per session (4s delay), uses `sessionStorage`
- **SEO hook**: `useSEO()` dynamically updates meta tags and canonical URLs
- **Newsletter**: Falls back to prototype mode if endpoint not configured

## Environment Variables

Required for Shopify mode:
- `VITE_SHOPIFY_STORE_DOMAIN`
- `VITE_SHOPIFY_STOREFRONT_TOKEN`

Optional:
- `VITE_GA4_MEASUREMENT_ID` (analytics)
- `VITE_META_PIXEL_ID` (Meta Pixel)
- `VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_SITE_DESCRIPTION`
