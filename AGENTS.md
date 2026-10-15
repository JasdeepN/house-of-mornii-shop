# AGENTS.md

Single source of truth for agents. `CLAUDE.md` imports this file.

## Commands

- `npm run dev` (port 5173), `npm run build`, `npm run lint`, `npm run test:run`
- One test file: `npx vitest run src/lib/shopify/client.test.ts`
- Done means the narrowest relevant test passed; UI changes also pass `npm run build` (see `.github/instructions/verification-bar-before-done.instructions.md`).

## Stack

React 19, TypeScript, Vite 7, React Router 7, TanStack Query, Tailwind CSS 4, Framer Motion. `@/` resolves to `src/`.

## Architecture

- Providers (`src/main.tsx`): `ErrorBoundary` > `QueryClientProvider` > `CartProvider` > `App`.
- Routes (`src/App.tsx`): all pages lazy-loaded; `AnimatePresence` transitions; page views tracked in `AnimatedRoutes` via `src/lib/analytics.ts`.
- Cart: `src/context/CartContext.tsx`, synced through Storefront API mutations.
- Workers (secrets via `wrangler secret put`, never committed):
  - `workers/shopify-proxy.ts` (`wrangler.toml`): Admin API proxy, webhook receiver, daily backup cron.
  - `workers/catalog-sync.ts` (`wrangler.catalog-sync.toml`): nightly prod-to-dev sync of products and collections only.

## Shopify

- Import from the `@/lib/shopify` barrel (`index.ts`), never from subpaths.
- Live credentials `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are required in every environment; `client.ts` throws at module load when they are missing or placeholders (`your-store.myshopify.com`, `CHANGE_ME`). No demo fallback exists.
- Optional env: `VITE_GA4_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, `VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_SITE_DESCRIPTION`, `VITE_SHOPIFY_ADMIN_PROXY_ENABLED`.

## Conventions

- Storage keys: `hom-cart-id`, `hom-customer-access-token`, `hom-customer-expires-at` (localStorage); `hom_welcome_shown` (sessionStorage).
- `@/lib/utils.ts` exports only `cn()`. `@/lib/siteConfig.ts` exports `getSiteConfig`, `absoluteSiteUrl`, `getContactConfig`, `getNewsletterConfig`, `getWelcomePopupConfig`.
- Newsletter returns `{ mode: 'prototype' | 'endpoint' }`; analytics branch on it.
- Files: components `PascalCase.tsx`, utilities `kebab-case.ts`, tests `*.test.{ts,tsx}` beside source.
- `src/components/ui/` is shadcn: extend through `className` or wrappers, leave the files untouched.

## Design

- Colors: OKLCH only, via Tailwind tokens (`bg-accent`) or inline `oklch()`. Gold is muted: `oklch(0.60 0.11 78)`. Teal `oklch(0.45 0.08 210)`, background `oklch(0.15 0.02 210)`, card `oklch(0.22 0.03 210)`.
- Fonts: Cinzel headings (uppercase, tracking 0.12-0.15em), Cormorant Garamond body, Great Vibes (`font-script`) for "Mornii" only.
- Wrap framed content in `OrnamentalBorder` (PNG frame, padding `p-12 md:p-16 lg:p-20`); its content needs `relative z-10`.
- Motion: `duration: 0.8`, stagger list items 0.15-0.2s.
- Decorative images use `alt=""`; text meets WCAG AA (ratios in `PRD.md`).

## Testing

- Vitest, Testing Library, jsdom. `src/test/setup.ts` patches `IntersectionObserver` and `ResizeObserver` and stubs Shopify env with dummy credentials (`test-store.myshopify.com`, `test-storefront-token`); empty values would throw.
- Mock `shopifyFetch` from `@/lib/shopify/client` with `src/test/fixtures/shopify-fixtures.ts`.

## Issues and domain docs

- Issues: GitHub via `gh`; see `docs/agents/issue-tracker.md`.
- Domain: root `GLOSSARY.md` and `docs/adr/`; see `docs/agents/domain.md`.
- Deeper reference: `docs/00-index.md`, `PRD.md`.
