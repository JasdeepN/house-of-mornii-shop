# Code Mode Rules (Non-Obvious Only)

This file provides coding-specific guidance for AI assistants working with this repository.

## Project-Specific Patterns

- **No demo mode**: `IS_CONFIGURED` is always `true`. All environments (local, UAT, production) require real Shopify credentials — `client.ts` throws at module load otherwise. Test fixtures live in `src/test/fixtures/shopify-fixtures.ts`, used only via mocked `shopifyFetch`.
- **Cart ID key**: `hom-cart-id` in localStorage (not `cart-id` or similar).
- **Welcome popup key**: `hom_welcome_shown` in sessionStorage (not `welcome-shown` or similar).
- **Newsletter mode**: Returns `{ mode: 'prototype' | 'endpoint' }` — use this for analytics tracking.

## Custom Utilities & Import Conventions

- **`@/lib/utils.ts`**: Only exports `cn()` — no other utility functions.
- **`@/lib/shopify/index.ts`**: Re-exports all Shopify-related types/functions — import from this barrel, not subpaths.
- **`@/lib/siteConfig.ts`**: Exports `getSiteConfig()`, `absoluteSiteUrl()`, `getContactConfig()`, `getNewsletterConfig()`, `getWelcomePopupConfig()`.

## Styling Conventions

- **OKLCH colors**: All colors use `oklch()` notation (e.g., `oklch(0.60 0.11 78)` for accent).
- **Glass panels**: Use `glass-panel` class with `backdrop-blur` and `bg-card/80`.
- **Golden glow**: Soft golden box-shadow via `.golden-glow` class on glass panels.
- **Framer Motion**: Uses custom `luxuryEase` cubic-bezier `[0.16, 1, 0.3, 1]` for premium feel.

## Gotchas

- **No demo/tokenless mode**: `client.ts` throws immediately if Shopify credentials are missing/placeholder — this happens in every environment, not just production.
- **Test env**: `import.meta.env` Shopify vars stubbed to valid dummy credentials (not empty strings) in `src/test/setup.ts`, since the client throws on missing values.
- **Cmd+K search**: SearchBar opens with Cmd+K (macOS) or Ctrl+K (Windows).
