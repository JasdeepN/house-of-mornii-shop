# Architect Mode Rules (Non-Obvious Only)

This file provides architectural guidance for AI assistants working with this repository.

## Architecture Constraints

### Shopify Storefront API Modes

The app supports three distinct Shopify integration modes:

1. **Demo mode** (`STOREFRONT_MODE === 'demo'`): No live credentials. App uses fixture data only. This is the default when credentials are absent.

2. **Tokenless mode** (`STOREFRONT_MODE === 'tokenless'`): Domain present but no Storefront token. Only tokenless-safe Storefront API fields may be requested (no tags, metafields, etc.).

3. **Token mode** (`STOREFRONT_MODE === 'token'`): Domain + public Storefront token present. Full token-gated fields (tags, metafields, customer APIs) are available.

**Critical**: Production builds fail loudly if demo mode is detected. Never deploy without credentials.

### Data Fetching Pattern

All data-fetching hooks check `IS_CONFIGURED` and fall back to `demo-data.ts` fixtures when false. This enables full development without Shopify credentials but requires explicit configuration for production.

### Cart Persistence

- **Demo mode**: Cart managed in-memory only
- **Shopify mode**: Cart ID persisted to `localStorage` under key `hom-cart-id`
- Cart state synced via Storefront API mutations

## Non-Obvious Architectural Decisions

### Path Alias Resolution

`@/` resolves to `src/` in both Vite and Vitest. This is configured in:
- `vite.config.ts` (uses `process.env.PROJECT_ROOT` or `import.meta.dirname`)
- `vitest.config.ts` (uses `__dirname`)

### Styling Architecture

- Tailwind CSS v4 with `@tailwindcss/vite` plugin (no PostCSS config needed)
- `tailwind.config.js` reads `theme.json` at build time to merge custom design tokens
- Colors use OKLCH notation throughout (e.g., `oklch(0.60 0.11 78)` for accent)
- Glass panels use `glass-panel` class with `backdrop-blur` and `bg-card/80`

### Animation System

- Framer Motion with custom `luxuryEase` cubic-bezier `[0.16, 1, 0.3, 1]` for premium feel
- Page transitions use `pageTransition` variant with blur-clearing fade-up effect
- Stagger animations for sequential content entrance

### SEO & Analytics

- `useSEO()` hook dynamically updates meta tags and canonical URLs
- GA4 and Meta Pixel are opt-in via environment variables
- Page views tracked automatically in `AnimatedRoutes`

## Performance Considerations

### Code Splitting

All pages are lazy-loaded via `React.lazy` in `src/App.tsx`. This reduces initial bundle size but adds route transition latency.

### Query Caching

TanStack Query `staleTime` defaults per hook:
- Collections: 5 minutes
- Products: 5 minutes
- Related products: 5 minutes

### Image Optimization

Shopify images are appended with `&width={size}` parameter for client-side resizing.
