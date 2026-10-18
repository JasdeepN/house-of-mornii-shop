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
- Storefront hosting: Workers static assets, one Worker per environment, deployed by `.github/workflows/deploy-site.yml`. `dev-hom` (`wrangler.site.dev.jsonc`, branch `dev`) serves `dev.houseofmornii.com`; `prod-hom` (`wrangler.site.production.jsonc`, branch `main`) serves `houseofmornii.com`. Store credentials are secrets on the GitHub environments `dev` and `production`, each locked to its own branch.
- Workers (secrets via `wrangler secret put`, never committed):
  - `workers/shopify-proxy.ts` (`wrangler.toml`): webhook receiver and daily backup cron. It does not proxy the Admin API.
  - `workers/catalog-sync.ts` (`wrangler.catalog-sync.toml`): nightly prod-to-dev sync of products and collections only.
  - `workers/customer-session.ts` (`wrangler.customer-session.toml`, `--env dev|production`, no top-level config): Customer sign-in on the Customer Account API at `/api/customer/*`, with Customer sessions in KV (`docs/adr/0001`, `0002`). No secrets: the client id is public.
  - `workers/enquiry.ts` (`wrangler.enquiry.toml`, `--env dev|production`, no top-level config): Shopper enquiries at `/api/enquiry`, emailed with the Email Workers `send_email` binding from `notify.houseofmornii.com` to one fixed address (contact@ in production). Turnstile, KV rate limit, dev-only dry run (`docs/17-enquiries.md`). `deploy.yml` passes its secrets with `wrangler deploy --secrets-file`; wrangler-action's `secrets:` input ignores `-c`/`--env` and writes to the wrong Worker.

## Shopify

- Import from the `@/lib/shopify` barrel (`index.ts`), never from subpaths.
- Live credentials `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are required in every environment; `client.ts` throws at module load when they are missing or placeholders (`your-store.myshopify.com`, `CHANGE_ME`). No demo fallback exists.
- Catalog (Products, Variants, Collections): pages take domain shapes (`ProductSummary`, `Product`, `Variant`, `CollectionSummary`, `DisplayPrice`) and hooks (`useProductListing`, `useProduct`, `useCollections`, `useRelatedProducts`) from the barrel; raw `edges`/`priceRange` and `shopifyFetch` for catalog data stay inside `src/lib/shopify`.
- Price display, sort keys (`PRODUCT_SORTS`, `parseProductSort`; Shop URL `?sort=`) and variant picking live in `catalog.ts`. Catalog reads use the Storefront API only (`docs/adr/0003`).
- Optional env: `VITE_GA4_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, `VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_SITE_DESCRIPTION`, `VITE_NEWSLETTER_ENABLED` (off until v1.1; the footer form is hidden), `VITE_CONTACT_EMAIL` (`contact@houseofmornii.com`), `VITE_TURNSTILE_SITE_KEY` (the enquiry forms render only when it is set).

## Conventions

- Storage keys: `hom-cart-id` (localStorage); `hom_welcome_shown` (sessionStorage). The Customer session is the HttpOnly cookie `hom_customer_session`, held in KV by the `customer-session` Worker; no Customer token reaches browser storage. `src/main.tsx` removes the old `hom-customer-*` keys once.
- Customer: import from the `@/lib/customer` barrel (`customerFetch`, `useCustomerSession`, hooks); ESLint rejects `@/lib/customer/*`. Tests mock `customerFetch`.
- `@/lib/utils.ts` exports only `cn()`. `@/lib/siteConfig.ts` exports `getSiteConfig`, `absoluteSiteUrl`, `getContactConfig`, `getNewsletterConfig`, `getWelcomePopupConfig`.
- No "coming soon" placeholders in Shopper-facing UI: omit a detail until it is confirmed. `e2e/read-only/policies-and-404.spec.ts` checks this.
- Newsletter returns `{ mode: 'prototype' | 'endpoint' }`; analytics branch on it.
- Files: components `PascalCase.tsx`, utilities `kebab-case.ts`, tests `*.test.{ts,tsx}` beside source.
- `src/components/ui/` is shadcn: extend through `className` or wrappers, leave the files untouched.

## Design

v1.0 ships light only: `useTheme` always returns light and ignores stored preferences. No dark mode.

- Colors: OKLCH only, via Tailwind tokens (`bg-accent`) or inline `oklch()`. Defined once in `src/tailwind.css` (`:root`, `@theme`): `background` `oklch(0.924 0.027 78.2)`, `foreground` `oklch(0.335 0.045 193.0)`, `card`, `muted`, `muted-foreground`, `border`, `primary`/`accent` teal `oklch(0.336 0.054 200.5)` (#063F42), `primary-hover`, `gold`, `gold-on-teal`.
- Contrast: gold is decoration, never text (2.6:1 on the page). Use `gold-on-teal` for accents on teal only (6.2:1). Text meets WCAG AA (ratios in `PRD.md`).
- Fonts: Noto Serif Display, self-hosted as `Mornii Display` (`font-heading`, weight 400); Arial for text (`font-body`); Great Vibes (`font-script`) for "Mornii" only.
- Header and footer: `.bar-teal` in `src/index.scss`. Teal at 94% with a light blur, champagne text, `gold-on-teal` accents, square corners. It remaps the tokens inside the bar; use `.on-page` to restore page colors.
- Header: a champagne logo row (scrolls away) above the sticky `.bar-teal` bar. The logo's lettering is dark teal, so it never sits on teal. `.glass-panel` sets `position: relative` in unlayered CSS, which overrides Tailwind's `sticky`; the header carries an inline `position: sticky`.
- Brand: logo, tab icon and sharing image come from Shopify Settings > Brand (`shop.brand`), not the repo. The logo and cover image come through `useShopBrand()`; the tab icon and sharing image are also baked into `index.html` at build by `shopifyBrandPlugin` (`src/lib/shopify/brand-head.ts`). Fallbacks: the lettering lockup, the static `public/og-image.png` (logo-free), and no injected tab icon. The stakeholder's logo files never enter this public repo (`docs/assets/brand/` is git-ignored).
- Layout C: `ProductCard` (whole photo on a square panel, Type label, "From" price, sale and Sold out badges, round quick-add button via `QuickAddDialog`) is the only Product card, including related Products. `CollectionCard` reuses it. `ProductGrid` is 3 columns, 2 at 1100px and below.
- Listings: `ShopPage` and `CollectionPage` render `ProductListingLayout` (sidebar on desktop, chips on phones). State lives in the URL: `type`, `available=1`, `sort`; defaults are left out. The rules live in `src/lib/shopify/catalog.ts` (`parseListingFilters`, `withListingFilters`, `viewListing`, `PRODUCT_SORTS`, `quickAdd`).
- No shipping or returns claims (no "Free Shipping", "Easy Returns", "Authenticity Guaranteed").
- `OrnamentalBorder` is a plain glass panel (default padding `p-6 md:p-8 lg:p-10`, glow off); its content needs `relative z-10`.
- Motion: reveals use `duration` 0.6-0.9; stagger list items about 0.12-0.2s.
- Decorative images use `alt=""`.
- Launch rules (enforced by `e2e/read-only/launch-checks.spec.ts`; every change keeps them):
  - No sideways scroll at 320-1440px: long words and links wrap.
  - Touch targets are at least 44x44px at 768px and below.
  - Text contrast is at least 4.5:1 (`--muted-foreground` is `oklch(0.440 0.020 145.3)`).
  - Every control shows the two-tone focus ring from `src/index.scss`.
  - An icon-only button has an accessible name.
  - Reduced motion is respected: `MotionConfig` plus `followReducedMotion()` (`src/lib/reduced-motion.ts`) and the `prefers-reduced-motion` block in `src/index.scss`.

## Testing

- Vitest, Testing Library, jsdom. `src/test/setup.ts` patches `IntersectionObserver` and `ResizeObserver` and stubs Shopify env with dummy credentials (`test-store.myshopify.com`, `test-storefront-token`); empty values would throw.
- Mock `shopifyFetch` from `@/lib/shopify/client` with `src/test/fixtures/shopify-fixtures.ts`; tests that mock the Catalog hooks use `src/test/fixtures/catalog-fixtures.ts`.

### End-to-end (Playwright, `docs/16-end-to-end-tests.md`)

- Two tiers, each run at 1440px and 390px. `e2e/read-only` is safe anywhere. `e2e/dev-only` places real test Orders and signs in; `requireDevTarget` (`e2e/support/env.ts`) throws for any target but `https://dev.houseofmornii.com`.
- `npm run test:e2e` runs both tiers against dev. `npm run test:e2e:read-only` runs the first. `npm run e2e:session` refreshes the saved Customer session.
- Secrets live in the git-ignored `.env.e2e.local`: `E2E_BASE_URL`, `E2E_SHOPIFY_STORE_DOMAIN`, `E2E_STORE_PASSWORD`, `E2E_SHOPIFY_CLIENT_ID`, `E2E_SHOPIFY_CLIENT_SECRET`, `E2E_CUSTOMER_SESSION`. CI runs the suite after every `dev` deploy, with the same names as secrets on the GitHub environment `dev`.
- `e2e/read-only/launch-checks.spec.ts` enforces the launch rules on every `dev` deploy: no sideways scroll, 44px targets, axe, keyboard focus. Locally, against a preview build:
  - `npx vite build --mode development --outDir <scratch-dir>`, then `npx vite preview --outDir <scratch-dir> --port 4173`.
  - `E2E_BASE_URL=http://localhost:4173 npx playwright test e2e/read-only/launch-checks.spec.ts`.
- New journeys:
  - Wait on elements (`expect(...).toBeVisible()`), never `networkidle`.
  - Shopper-facing words say Bag; code says Cart.
  - A dev-only journey cleans up its Orders in a `finally` (`cancelAndArchiveOrder`).

## Issues and domain docs

- Issues: GitHub via `gh`; see `docs/agents/issue-tracker.md`.
- Domain: root `GLOSSARY.md` and `docs/adr/`; see `docs/agents/domain.md`.
- Deeper reference: `docs/00-index.md`, `PRD.md`.
