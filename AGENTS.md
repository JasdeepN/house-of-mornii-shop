# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build & Development

```bash
npm run dev          # Start dev server (Vite, port 5173)
npm run build        # TypeScript compile + Vite build (outputs to dist/)
npm run preview      # Serve the dist/ build locally
npm run lint         # ESLint (flat config via typescript-eslint, no eslint.config.js file)
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
npm run test:e2e     # Playwright E2E tests
```

Run a single test: `npx vitest run src/lib/shopify/client.test.ts`

## Stack

React 19 + TypeScript 5.7 + Vite 7 + React Router DOM 7 + TanStack Query + Tailwind CSS 4 + Framer Motion

## Shopify Integration (Critical)

Three modes detected via `STOREFRONT_MODE` from `@/lib/shopify/client`: `'demo'`, `'tokenless'`, or `'token'`. Check `IS_CONFIGURED` boolean to know if live credentials exist. All data-fetching hooks in `src/lib/shopify/hooks.ts` fall back to `demo-data.ts` when `IS_CONFIGURED` is false. **Production builds abort with exit(1) if demo mode detected** — never deploy without credentials.

## Path Alias

`@/` resolves to `src/` (configured in both `vite.config.ts` and `vitest.config.ts`).

## Testing

- Vitest + `@testing-library/react` + jsdom. Test files alongside source: `*.test.{ts,tsx}`.
- `src/test/setup.ts` patches `IntersectionObserver` (required by framer-motion in jsdom) and stubs Shopify env vars to empty strings.
- In tests, `import.meta.env` vars are writable via `@ts-expect-error` — use `vi.stubEnv()` to override.

## Key Patterns

- **Cart ID**: localStorage key is `hom-cart-id` (not `cart-id`).
- **Welcome popup**: sessionStorage key is `hom_welcome_shown`.
- **Newsletter mode**: Returns `{ mode: 'prototype' | 'endpoint' }` — check this for analytics tracking.
- **Shopify imports**: Use `@/lib/shopify/index.ts` re-export barrel — not individual subpath imports.
- **`@/lib/utils.ts`**: Only exports `cn()` — no other utilities.
- **`@/lib/siteConfig.ts`**: Exports `getSiteConfig()`, `absoluteSiteUrl()`, `getContactConfig()`, `getNewsletterConfig()`, `getWelcomePopupConfig()`.

## Environment Variables

Required for Shopify: `VITE_SHOPIFY_STORE_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN`
Optional: `VITE_GA4_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, `VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_SITE_DESCRIPTION`
