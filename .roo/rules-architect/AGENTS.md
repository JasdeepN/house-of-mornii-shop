# Architect Mode Rules (Non-Obvious Only)

This file provides architectural guidance for AI assistants working with this repository.

## Architecture Constraints

### Shopify Storefront API Modes

Three modes via `STOREFRONT_MODE` from `@/lib/shopify/client`: `'demo'`, `'tokenless'`, `'token'`. **Production builds abort** if demo mode detected — never deploy without credentials.

### Data Fetching Pattern

All hooks in `src/lib/shopify/hooks.ts` check `IS_CONFIGURED` and fall back to `demo-data.ts`. This enables dev without credentials but requires explicit config for production.

### Cart Persistence

- **Demo mode**: Cart managed in-memory only.
- **Shopify mode**: Cart ID persisted to `localStorage` under key `hom-cart-id`.

## Non-Obvious Architectural Decisions

### Path Alias Resolution

`@/` resolves to `src/` in both Vite and Vitest, configured in `vite.config.ts` (uses `process.env.PROJECT_ROOT || import.meta.dirname`) and `vitest.config.ts` (uses `__dirname`).

### Styling Architecture

- Tailwind CSS v4 with `@tailwindcss/vite` plugin (no PostCSS config).
- `tailwind.config.js` reads `theme.json` at build time to merge custom design tokens.
- Colors use OKLCH throughout.

### Animation System

- Framer Motion with custom `luxuryEase` cubic-bezier `[0.16, 1, 0.3, 1]`.
- Page transitions use `pageTransition` variant with blur-clearing fade-up effect.

### Performance

- All pages lazy-loaded via `React.lazy` in `src/App.tsx`.
- TanStack Query `staleTime`: collections/products/related products = 5 minutes each.
- Shopify images appended with `&width={size}` for client-side resizing.
