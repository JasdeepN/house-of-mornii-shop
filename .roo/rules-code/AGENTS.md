# Code Mode Rules (Non-Obvious Only)

This file provides coding-specific guidance for AI assistants working with this repository.

## Project-Specific Patterns

- **Demo mode fallback**: All data-fetching hooks check `IS_CONFIGURED` and use `demo-data.ts` fixtures when false
- **Cart ID key**: `hom-cart-id` in localStorage (not `cart-id` or similar)
- **Welcome popup key**: `hom_welcome_shown` in sessionStorage (not `welcome-shown` or similar)
- **Newsletter mode**: Returns `{ mode: 'prototype' | 'endpoint' }` - use this for analytics tracking

## Custom Utilities

- **`@/lib/utils.ts`**: Only exports `cn()` - no other utility functions
- **`@/lib/shopify/index.ts`**: Re-exports all Shopify-related types/functions - use this for imports
- **`@/lib/siteConfig.ts`**: Exports `getSiteConfig()`, `absoluteSiteUrl()`, `getContactConfig()`, `getNewsletterConfig()`, `getWelcomePopupConfig()`

## Non-Standard Conventions

- **Golden glow under-lighting**: Soft golden box-shadow via `.golden-glow` class on glass panels (replaces PNG ornamental border)
- **OKLCH colors**: All colors use `oklch()` notation (e.g., `oklch(0.60 0.11 78)` for accent)
- **Glass panels**: Use `glass-panel` class with `backdrop-blur` and `bg-card/80`
- **Framer Motion**: Uses custom `luxuryEase` cubic-bezier `[0.16, 1, 0.3, 1]` for premium feel

## Gotchas

- **Production demo mode**: Throws error with clear message - never deploy without credentials
- **Tokenless mode**: Only token-safe fields available (no tags, metafields)
- **Test env**: `import.meta.env` vars stubbed to empty strings in `src/test/setup.ts`
- **Cmd+K search**: SearchBar opens with Cmd+K (macOS) or Ctrl+K (Windows)
