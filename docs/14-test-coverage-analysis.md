# Test Coverage Analysis

> History: a snapshot from before the Customer Account API migration (#15). `CustomerAuthContext` no longer exists; see [06 - Testing](./06-testing.md) for the current Customer tests.

## Overview

This document provides a comprehensive analysis of the test coverage across the House of Mornii shop codebase. It identifies well-tested areas, coverage gaps, and recommendations for improvement.

## Test Infrastructure

### Framework & Configuration

- **Unit/Integration:** Vitest 4.1.10 with jsdom environment
- **E2E:** Playwright with Chromium
- **Test runner config:** `vitest.config.ts` — includes `src/**/*.test.{ts,tsx}` and `workers/**/*.test.{ts,tsx}`
- **Setup file:** `src/test/setup.ts` — polyfills (IntersectionObserver, ResizeObserver, matchMedia), env stubs
- **Test utilities:** `src/test/utils.tsx` — `renderWithProviders`, `renderWithRouter` wrappers
- **Fixtures:** `src/test/fixtures/shopify-fixtures.ts` — product/collection fixture data

### Test Files (22 total)

| Test File | Type | Tests |
|-----------|------|-------|
| `src/lib/shopify/client.test.ts` | Unit | STOREFRONT_MODE, shopifyFetch, StorefrontError, retry |
| `src/lib/shopify/hooks.test.tsx` | Integration | useCollections, useProduct, useProductListing, useRelatedProducts |
| `src/lib/shopify/hooks.token.test.tsx` | Integration | Token mode hook integration |
| `src/lib/shopify/types.test.ts` | Unit | flattenEdges, formatMoney |
| `src/context/CartContext.test.tsx` | Integration | Cart state, addToCart, updateLineItem, removeLineItem, clearCart |
| `src/context/CustomerAuthContext.test.tsx` | Integration | _Removed with the Customer Account API migration (#15); see `src/lib/customer/*.test.tsx`_ |
| `src/components/AddToCartButton.test.tsx` | Component | Analytics tracking |
| `src/components/CartFlyout.test.tsx` | Component | Empty state, checkout validation, debounced updates |
| `src/components/Header.test.tsx` | Component | Nav links, routes, bag icon |
| `src/components/NewsletterSignup.test.tsx` | Component | Prototype mode, form submission |
| `src/components/SearchBar.test.tsx` | Component | Pagination, query reset, selection |
| `src/pages/AccountDetailsPage.test.tsx` | Component | Auth guard, form submission, error handling |
| `src/pages/AddressesPage.test.tsx` | Component | CRUD operations, auth guard, empty state |
| `src/pages/CollectionPage.test.tsx` | Component | Hook-order error prevention |
| `src/pages/ShopPage.test.tsx` | Component | Analytics tracking |
| `src/lib/animations.test.ts` | Unit | Animation constants |
| `src/lib/cart.test.ts` | Unit | isValidCheckoutUrl |
| `src/lib/errorHandler.test.ts` | Unit | Error categorization, display |
| `src/lib/newsletter.test.ts` | Unit | Prototype/endpoint modes |
| `src/test/phase1-bugfixes.test.tsx` | Integration | Copy verification, page headings |
| `workers/shopify-proxy.test.ts` | Unit | HMAC, mutation guard, webhook dispatch, backup |
| `workers/catalog-sync.test.ts` | Unit | Transform, upsert, orchestration, no-PII |

### E2E Tests (8 spec files, two tiers; see [16 - End-to-End Tests](./16-end-to-end-tests.md))

Each spec runs at desktop (1440px) and phone (390px) widths against https://dev.houseofmornii.com, after every `dev` deploy and on demand.

| Test File | Tier | Coverage |
|-----------|------|----------|
| `e2e/read-only/shop-filters.spec.ts` | Read-only | Type, Hide sold out and Sort filters write the address; Back restores them |
| `e2e/read-only/product-page.spec.ts` | Read-only | Variants and availability; Add to bag twice (#42) |
| `e2e/read-only/quick-add.spec.ts` | Read-only | Quick add for one Variant, several Variants, and sold out |
| `e2e/read-only/bag.spec.ts` | Read-only | Bag flyout + / - / remove, Bag page subtotal, checkout link domain |
| `e2e/read-only/security-headers.spec.ts` | Read-only | Security header validation |
| `e2e/read-only/env-guard.spec.ts` | Read-only | The dev-target guard accepts only the dev origin |
| `e2e/dev-only/sign-in.spec.ts` | Dev-only | Sign in reaches Shopify's page; the saved session shows the Customer (phone sign-in waits on #47) |
| `e2e/dev-only/checkout.spec.ts` | Dev-only | Bogus Gateway checkout as the test Customer; the Order is checked in Admin and on `/account/orders`, then cancelled and archived |

Not covered end to end: the home page, Collection pages, and the Customer's other account pages.

---

## Well-Tested Areas

### 1. Shopify Client Layer (`src/lib/shopify/`)

**Coverage: Excellent**

- `client.test.ts` — Tests `STOREFRONT_MODE` resolution, `shopifyFetch` with SDK mock, `StorefrontError` classification, retry behavior
- `hooks.test.tsx` — Tests the Catalog hooks (`useCollections`, `useProduct`, `useProductListing`, `useRelatedProducts`) with mocked `shopifyFetch` and fixture data
- `hooks.token.test.tsx` — Token mode integration tests for hooks (fetch by handle, pagination, null handling)
- `types.test.ts` — Tests `flattenEdges` and `formatMoney` helpers

### 2. State Management Contexts

**Coverage: Excellent**

- `CartContext.test.tsx` — Comprehensive: empty cart, `addToCart` (same variant, different products), `updateLineItem`, `removeLineItem`, `clearCart`, `openCart`/`setCartOpen`, error handling
- `CustomerAuthContext.test.tsx` (removed in #15; `src/lib/customer/*.test.tsx` and `workers/customer-session.test.ts` replace it) — Very thorough: `createAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress` with success paths, `customerUserErrors` handling, generic fallback errors, unauthenticated no-op behavior

### 3. Workers

**Coverage: Excellent**

- `shopify-proxy.test.ts` — HMAC verification (valid/invalid/missing/wrong-secret), mutation guard, webhook dispatch, scheduled backup, CORS
- `catalog-sync.test.ts` — Transform functions, upsert idempotency, orchestration, no-PII guarantee, scheduled-only deployment

### 4. Components

**Coverage: Good**

- `AddToCartButton.test.tsx` — Analytics tracking payload verification
- `CartFlyout.test.tsx` — Empty state, checkout URL validation, debounced quantity updates
- `Header.test.tsx` — Nav links, routes, bag icon
- `NewsletterSignup.test.tsx` — Prototype mode copy, form submission
- `SearchBar.test.tsx` — Pagination, query reset, selection/clear behavior

### 5. Pages

**Coverage: Good**

- `AccountDetailsPage.test.tsx` — Loading state, auth guard, form pre-population, profile update (with/without password), error toast
- `AddressesPage.test.tsx` — Loading, auth guard, empty state, address list rendering, CRUD operations, error handling
- `CollectionPage.test.tsx` — Hook-order error prevention
- `ShopPage.test.tsx` — Analytics `view_item_list` tracking refire

### 6. Library Utilities

**Coverage: Good**

- `animations.test.ts` — `luxuryEase`, `fadeSlideUp`, `staggerContainer`, `staggerItem`, `pageTransition`, `viewportOnce`
- `cart.test.ts` — `isValidCheckoutUrl` validation
- `errorHandler.test.ts` — `getErrorCategory`, `isServiceError`, `useErrorHandler`, `handleSyncError`
- `newsletter.test.ts` — Prototype mode, endpoint mode, error rejection

---

## Coverage Gaps

### Source Files with NO Tests (13 files)

| File | Lines | What's Missing |
|------|-------|----------------|
| `src/lib/analytics.ts` | ~120 | `initGA4`, `initMetaPixel`, `trackEvent`, `trackViewItem`, `trackAddToCart`, `trackViewItemList`, `trackBeginCheckout` |
| `src/lib/errorMessages.ts` | ~145 | `getErrorMessage`, `normalizeErrorCategory`, error category definitions |
| `src/lib/logger.ts` | ~181 | `formatDevEntry`, `formatProdEntry`, `createChildLogger`, logger instance |
| `src/lib/monitoring.ts` | ~128 | `reportError`, `reportWarning`, `reportInfo`, `setUserContext`, `addTags` |
| `src/lib/siteConfig.ts` | ~117 | `getSiteConfig`, `absoluteSiteUrl`, `getContactConfig`, `getNewsletterConfig`, `getWelcomePopupConfig` |
| `src/lib/utils.ts` | ~10 | `cn()` function |
| `src/lib/shopify/sdk-client.ts` | ~35 | `createClient`, `storefrontClient` |
| `src/lib/shopify/env-schema.ts` | ~42 | `validateEnv` |
| `src/lib/shopify/health.ts` | ~25 | `getHealthStatus` |
| `src/lib/shopify/queries.ts` | — | GraphQL query strings |
| `src/lib/shopify/token-requirements.ts` | ~33 | `getRequiredModeForFields`, `hasTokenGatedFields` |
| `src/lib/shopify/retry.ts` | ~76 | `withRetry`, `isRetryableError` (only indirectly tested) |

### UI Components with NO Tests (26 components)

`AboutSection`, `BaroqueCard`, `BrandLockup`, `CollectionsSection`, `ContactSection`, `CustomerMenu`, `ErrorBoundary`, `FAQAccordion`, `Footer`, `FreeShippingBar`, `HeroSection`, `JewelryImage`, `JsonLd`, `LoginModal`, `OrnamentalBorder`, `PageBreadcrumb`, `PageTransition`, `PasswordRecoveryModal`, `ProductCard`, `ProductGallery`, `ProductGrid`, `RegisterModal`, `ScrollToHash`, `TrustBadges`, `VariantSelector`, `WelcomePopup`

### Pages with NO Tests (8 pages)

`AboutPage`, `AccountPage`, `CartPage`, `ContactPage`, `HealthPage`, `HomePage`, `OrderDetailPage`, `OrdersPage`, `ProductPage`

### Hooks with NO Tests

`use-mobile.ts`, `useTheme.ts`, `useSEO.ts`

### Workers with NO Tests

`workers/webhook.ts`, `workers/backup-queries.ts`

---

## Documentation Issues

1. **Stale references:** `docs/06-testing.md` references `src/lib/analytics.test.ts` which does not exist
2. **Missing test files in docs:** The docs table omits several test files that do exist: `hooks.token.test.tsx`, `CustomerAuthContext.test.tsx`, `errorHandler.test.ts`, `newsletter.test.ts`, `phase1-bugfixes.test.tsx`, `cart.test.ts`
3. **Missing coverage metrics:** No coverage thresholds are configured in `vitest.config.ts`

---

## Recommendations

### Priority 1: Fix Test Execution

The test suite cannot execute due to Vitest 4.1.10 + Node v24 incompatibility. Upgrade Vitest to v5+ or downgrade Node to v22.

### Priority 2: Add Missing Tests

1. **`src/lib/analytics.ts`** — Critical tracking code with zero coverage. Add tests for `initGA4`, `initMetaPixel`, `trackEvent`, `trackViewItem`, `trackAddToCart`, `trackViewItemList`, `trackBeginCheckout`
2. **`src/lib/siteConfig.ts`** — All config getters are untested. Add tests for `getSiteConfig`, `getContactConfig`, `getNewsletterConfig`, `getWelcomePopupConfig`
3. **`src/lib/shopify/retry.ts`** — Add direct unit tests for `withRetry` and `isRetryableError`
4. **`src/lib/shopify/token-requirements.ts`** — Add tests for `getRequiredModeForFields` and `hasTokenGatedFields`

### Priority 3: Add Coverage Thresholds

Add coverage thresholds to `vitest.config.ts` to prevent coverage regression:

```typescript
test: {
  // ...existing config
  coverage: {
    thresholds: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
}
```

### Priority 4: Update Documentation

Update `docs/06-testing.md` to reflect the actual test files and remove stale references.
