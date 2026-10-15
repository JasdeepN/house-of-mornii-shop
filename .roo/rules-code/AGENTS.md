# Code Mode Rules (Non-Obvious Only)

This file provides coding-specific guidance for AI assistants working with this repository.

## Project-Specific Patterns

- **No demo mode**: `IS_CONFIGURED` is always `true`. All environments (local, UAT, production) require real Shopify credentials — `client.ts` throws at module load otherwise. Test fixtures live in `src/test/fixtures/shopify-fixtures.ts`, used only via mocked `shopifyFetch`.
- **Cart ID key**: `hom-cart-id` in localStorage (not `cart-id` or similar).
- **Customer auth tokens**: localStorage keys are `hom-customer-access-token` and `hom-customer-expires-at` (not `customer-token`).
- **Welcome popup key**: `hom_welcome_shown` in sessionStorage (not `welcome-shown` or similar).
- **Newsletter mode**: Returns `{ mode: 'prototype' | 'endpoint' }` — use this for analytics tracking.

## Custom Utilities & Import Conventions

- **`@/lib/utils.ts`**: Only exports `cn()` — no other utility functions.
- **`@/lib/shopify/index.ts`**: Re-exports all Shopify-related types/functions — import from this barrel, not subpaths.
- **`@/lib/siteConfig.ts`**: Exports `getSiteConfig()`, `absoluteSiteUrl()`, `getContactConfig()`, `getNewsletterConfig()`, `getWelcomePopupConfig()`.
- **`@/lib/shopify/client.ts`**: Exports `shopifyFetch<T>()`, `STOREFRONT_MODE` (always `'token'`), `IS_CONFIGURED` (always `true`), `StorefrontError`, `validateQueryMode()` (no-op).
- **`@/lib/shopify/hooks.ts`**: TanStack Query hooks (`useCollections`, `useCollection`, `useProduct`, `useProducts`, `useRelatedProducts`). All hooks check `ADMIN_PROXY_ENABLED` and route through `adminProxyFetch` when true, otherwise use `shopifyFetch`.
- **`@/lib/shopify/admin-proxy.ts`**: Exports `adminProxyFetch<T>()` and `ADMIN_PROXY_ENABLED` (boolean from `VITE_SHOPIFY_ADMIN_PROXY_ENABLED === 'true'`). Admin API calls go through `/api/shopify/admin` proxy endpoint.
- **`@/lib/shopify/retry.ts`**: Exports `withRetry<T>()` with exponential backoff (3 attempts, 500ms initial delay, retries on 408/429/5xx). All `shopifyFetch` calls are wrapped in retry.

## Styling Conventions

- **OKLCH colors**: All colors use `oklch()` notation (e.g., `oklch(0.60 0.11 78)` for accent gold).
- **Glass panels**: Use `glass-panel` class with `backdrop-blur` and `bg-card/80`.
- **Golden glow**: Soft golden box-shadow via `.golden-glow` class on glass panels (see `GOLDEN_GLOW_GUIDE.md`).
- **French gold frame**: The `.french-gold-frame` CSS class in `index.scss` provides a multi-layered beveled gold frame with corner rosettes, metallic sheen, and hammered metal texture. Apply via `frameVariant` prop on `OrnamentalBorder` or `BaroqueCard`.
- **Framer Motion**: Uses custom `luxuryEase` cubic-bezier `[0.16, 1, 0.3, 1]` from `@/lib/animations.ts`.
- **Theme tokens**: `tailwind.config.js` reads `theme.json` at build time to merge custom design tokens into Tailwind config.

## Gotchas

- **No demo/tokenless mode**: `client.ts` throws immediately if Shopify credentials are missing/placeholder — this happens in every environment, not just production.
- **Test env**: `import.meta.env` Shopify vars stubbed to valid dummy credentials (not empty strings) in `src/test/setup.ts`, since the client throws on missing values. Individual tests can override with `vi.stubEnv()`.
- **Dev server**: `npm run dev` uses `scripts/set-chokidar-polling.js` preload to set `CHOKIDAR_USEPOLLING=true` (avoids EISDIR on WSL/Windows-mounted filesystems).
- **Admin API security**: The Admin API token (`SHOPIFY_ADMIN_ACCESS_TOKEN`) is server-side only in the Cloudflare Worker — never use a `VITE_`-prefixed var for it. Client only knows `VITE_SHOPIFY_ADMIN_PROXY_ENABLED` boolean flag.
- **Cmd+K search**: SearchBar opens with Cmd+K (macOS) or Ctrl+K (Windows).
