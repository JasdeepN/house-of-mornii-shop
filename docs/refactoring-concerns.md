# MVP Refactoring: Analysis of Potential Concerns

This document outlines the identified concerns categorized into Functional, Technical, Operational, and Security domains, discovered during the architectural review of the Shopify Storefront integration.

> **Last Audited**: 2025-07-10  
> **Shopify API Version**: `2026-01` (configured in [`client.ts`](src/lib/shopify/client.ts:8))  
> **Source**: Full codebase audit + official Shopify Storefront API documentation

---

## 1. Functional Concerns

### 1.1 Silent Demo Fallback

**Status**: Confirmed — Active Risk

The application falls back to demo mode when Shopify credentials are absent, determined by the `STOREFRONT_MODE` resolution in [`client.ts`](src/lib/shopify/client.ts:22-28):

```typescript
function resolveStorefrontMode(): StorefrontMode {
  const hasDomain = !!domain && !PLACEHOLDER_DOMAINS.has(domain)
  const hasToken = !!token
  if (!hasDomain) return 'demo'
  if (!hasToken) return 'tokenless'
  return 'token'
}
```

**Impact**: A deployment without credentials renders a fully functional UI with non-live data. The checkout URL defaults to `#` (see [`CartContext.tsx`](src/context/CartContext.tsx:57): `checkoutUrl: '#'`). While e2e tests explicitly verify this ([`buyer-journey.spec.ts:95-97`](e2e/buyer-journey.spec.ts:75-98)), stakeholders and customers may not distinguish demo from live.

**Mitigation in Progress**:
- [`EnvironmentWarning`](src/components/EnvironmentWarning.tsx) banner shows in dev mode only.
- `IS_CONFIGURED` flag gates all data-fetching hooks.

### 1.2 Unverified Buyer Journey in Live Environments

**Status**: Confirmed — Active Risk

The e2e test suite ([`buyer-journey.spec.ts`](e2e/buyer-journey.spec.ts)) validates the full flow (home → collection → product → cart → checkout) but requires live Shopify credentials to execute. Without them, tests pass against demo data which does not exercise:
- Real Storefront API GraphQL queries
- Actual cart creation and Shopify-hosted checkout redirect
- Variant selection with real inventory states

### 1.3 Degraded Error UX — API Failures Masquerading as 404s

**Status**: Partially Addressed

The [`StorefrontError`](src/lib/shopify/client.ts:68-87) class categorizes errors into five distinct types:
- `not_found` — Resource does not exist
- `misconfigured` — Invalid credentials (401/403)
- `upstream_unavailable` — Shopify 5xx or network failure
- `query_error` — GraphQL-level error
- `network_error` — DNS/connection failure

The [`errorMessages.ts`](src/lib/errorMessages.ts:25-71) registry maps each category to user-friendly messages. However, individual pages still implement their own error handling logic that may not fully leverage this system:

| Page | Error Handling Pattern |
|------|----------------------|
| [`ProductPage`](src/pages/ProductPage.tsx:95-128) | Inline error display using `getErrorMessage` + `normalizeErrorCategory` |
| [`CollectionPage`](src/pages/CollectionPage.tsx:136-155) | Same inline pattern, but also has a separate null-check at line 131 |
| [`ShopPage`](src/pages/ShopPage.tsx) | Uses `useErrorHandler` hook (centralized) |

**Gap**: The `ProductPage` and `CollectionPage` have dual error paths — one for `error` (React Query error) and one for null data (`!product`). This can confuse users when an API returns 500 (mapped to `upstream_unavailable`) but the page also renders a "Product Not Found" state if the product field is null.

---

## 2. Technical Concerns

### 2.1 Auth Mode Mismatch — Token-Gated Fields in Tokenless Queries

**Status**: Addressed with Separate Query Variants

Shopify's Storefront API supports **tokenless access** for public fields (products, collections, cart read/write) and requires a `X-Shopify-Storefront-Access-Token` header for token-gated fields (`tags`, `metafields`, customer APIs). Per [official Shopify docs](https://shopify.dev/docs/api/storefront), tokenless queries can access: Products, Collections, Selling Plans, Search, Pages, Blogs, Articles, and Cart.

The codebase correctly implements separate query variants:
- [`PRODUCT_BY_HANDLE_QUERY`](src/lib/shopify/queries.ts:206-240) — includes `tags` (token-only)
- [`PRODUCT_BY_HANDLE_QUERY_TOKENLESS`](src/lib/shopify/queries.ts:242-275) — excludes `tags`

Hooks select the appropriate query based on mode ([`hooks.ts:88-91`](src/lib/shopify/hooks.ts:88-91)):
```typescript
STOREFRONT_MODE === 'token' 
  ? COLLECTION_BY_HANDLE_QUERY 
  : COLLECTION_BY_HANDLE_QUERY_TOKENLESS
```

**Residual Risk**: The `PRODUCT_CARD_FRAGMENT` (used in collection listings) includes `tags` ([`queries.ts:14-30`](src/lib/shopify/queries.ts:14-30)), but the tokenless variant [`PRODUCT_CARD_FRAGMENT_TOKENLESS`](src/lib/shopify/queries.ts:32-48) correctly omits it. The `validateQueryMode` function in [`client.ts:194-200`](src/lib/shopify/client.ts:194-200) logs warnings but does not prevent execution.

### 2.2 Error Handling Inconsistency Across Pages

**Status**: Partially Addressed — Migration Ongoing

A centralized error handling system exists:
- [`useErrorHandler()`](src/lib/errorHandler.ts:91-116) — React hook for component-level errors
- [`handleSyncError()`](src/lib/errorHandler.ts:122-145) — Non-React context handler
- [`ErrorBoundary`](src/components/ErrorBoundary.tsx) — Tree-level error catching
- [`errorMessages.ts`](src/lib/errorMessages.ts) — Centralized message registry

However, the deprecated [`useShopifyError`](src/hooks/useShopifyError.ts) hook is still exported and may be used in legacy code. The `ProductPage` and `CollectionPage` implement their own error display logic rather than using `useErrorHandler`, creating inconsistency.

### 2.3 Test Coverage Gap — Live Mode Under-Tested

**Status**: Confirmed — Active Risk

| Test File | Coverage Area |
|-----------|--------------|
| [`AddToCartButton.test.tsx`](src/components/AddToCartButton.test.tsx) | Demo mode cart logic |
| [`CartFlyout.test.tsx`](src/components/CartFlyout.test.tsx) | UI rendering |
| [`Header.test.tsx`](src/components/Header.test.tsx) | Navigation |
| [`SearchBar.test.tsx`](src/components/SearchBar.test.tsx) | Search UI |
| [`NewsletterSignup.test.tsx`](src/components/NewsletterSignup.test.tsx) | Form validation |
| [`useCart.test.tsx`](src/context/CartContext.test.tsx) | Demo cart state |
| [`client.test.ts`](src/lib/shopify/client.test.ts) | Client configuration |
| [`demo-data.test.ts`](src/lib/shopify/demo-data.test.ts) | Fixture data |
| [`hooks.test.tsx`](src/lib/shopify/hooks.test.tsx) | Hook behavior |
| [`types.test.ts`](src/lib/shopify/types.test.ts) | Type utilities |
| [`ShopPage.test.tsx`](src/pages/ShopPage.test.tsx) | Shop page rendering |
| [`CollectionPage.test.tsx`](src/pages/CollectionPage.test.tsx) | Collection page |

**Gap**: No unit tests exercise:
- Token-gated vs tokenless query selection paths
- `StorefrontError` category mapping in error display
- Cart mutations with real Shopify API responses
- Error boundary behavior with different error categories

---

## 3. Operational Concerns

### 3.1 Misconfiguration Risk — Silent Failure in Production

**Status**: Active Risk — No Production Guardrail

The current architecture allows the app to mount and render in demo mode without any production-level enforcement. The only guard is a dev-mode console warning ([`client.ts:39-44`](src/lib/shopify/client.ts:39-44)):

```typescript
if (STOREFRONT_MODE === 'demo' && import.meta.env.DEV) {
  console.warn('[House of Mornii] Shopify credentials not configured...')
}
```

**Critical Gap**: `import.meta.env.PROD` builds do **not** fail loudly. The [`health.ts`](src/lib/shopify/health.ts:13-28) health check returns `degraded` for demo mode but is not integrated into any deployment verification pipeline.

### 3.2 Incident Diagnosis Difficulty

**Status**: Partially Addressed

The [`logger`](src/lib/logger.ts) provides structured logging with context (component, page, product ID, action). In dev mode, logs include stack traces and colored output. In production, logs are sanitized JSON.

**Gap**: No integration with external monitoring (Sentry, Datadog, etc.). Production logs are written to `console` only, which may be inaccessible in browser-based deployments.

### 3.3 Deployment Complexity

**Status**: Requires Coordination

The refactoring requires alignment across:
1. **Shopify Admin**: Storefront API access token creation with correct scopes
2. **Environment Variables**: `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN`
3. **Build Configuration**: Vite env var prefix (`VITE_`) is baked at build time
4. **Deployment Platform**: Cloudflare Pages (or equivalent) must inject env vars securely

The [`env-schema.ts`](src/lib/shopify/env-schema.ts) validates environment variables but does not enforce production requirements.

---

## 4. Security Concerns

### 4.1 Token-Gated Data Exposure in Tokenless Mode

**Status**: Mitigated — Query Variants Enforced

The codebase maintains separate GraphQL fragments for token-gated vs tokenless fields:
- [`PRODUCT_CARD_FRAGMENT`](src/lib/shopify/queries.ts:14-30) includes `tags`
- [`PRODUCT_CARD_FRAGMENT_TOKENLESS`](src/lib/shopify/queries.ts:32-48) excludes `tags`

The [`token-requirements.ts`](src/lib/shopify/token-requirements.ts) registry tracks which fields require token authentication. The `validateQueryMode` function in [`client.ts`](src/lib/shopify/client.ts:194-200) logs warnings when token-gated patterns are detected in tokenless mode.

**Residual Risk**: If new token-gated fields are added to queries without corresponding tokenless variants, the query will fail at runtime with a GraphQL error rather than being caught at build time.

### 4.2 Production Guardrail Enforcement Missing

**Status**: Active Risk — Requires Implementation

Per the architecture constraints in [AGENTS.md](AGENTS.md):
> "Production builds fail loudly if demo mode is detected. Never deploy without credentials."

**Current State**: This constraint is **documented but not enforced**. No build-time check exists to prevent deployment of a demo-mode bundle.

**Recommended Implementation**:
```typescript
// In vite.config.ts or a pre-build script
if (import.meta.env.PROD && STOREFRONT_MODE === 'demo') {
  throw new Error('Cannot build for production in demo mode')
}
```

### 4.3 Security Header Management

**Status**: Partially Implemented

The [`public/_headers`](public/_headers) file configures Cloudflare Pages headers:

```
# Cache static assets aggressively
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Security headers for all pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Missing Headers**:
| Header | Status | Recommendation |
|--------|--------|---------------|
| `Content-Security-Policy` | Missing | Add CSP with `script-src` for GA4/Meta Pixel |
| `Strict-Transport-Security` (HSTS) | Missing | Add `max-age=31536000; includeSubDomains` |
| `Cross-Origin-Opener-Policy` | Missing | Consider `same-origin` for isolation |
| `Cross-Origin-Resource-Policy` | Missing | Not needed for SPA |

---

## 5. Additional Findings from Codebase Audit

### 5.1 API Version Staleness Risk

The app pins API version to `2026-01` ([`client.ts:8`](src/lib/shopify/client.ts:8)). Shopify releases new API versions quarterly. Unupdated versions will receive deprecation warnings and eventual sunset.

**Recommendation**: Subscribe to [Shopify API release notes](https://shopify.dev/docs/api/release-notes) and establish a quarterly review process.

### 5.2 Cart ID Persistence Key Hardcoded

The cart ID is persisted in `localStorage` under key `hom-cart-id` ([`CartContext.tsx:22`](src/context/CartContext.tsx:22)). This is acceptable for a single-application deployment but could conflict if multiple apps share the same domain.

### 5.3 Demo Data Uses Placeholder Images

Demo products use `placehold.co` URLs ([`demo-data.ts:17-24`](src/lib/shopify/demo-data.ts:17-24)). These are external dependencies that could fail or be replaced without notice. Consider bundling placeholder assets locally for offline development.

### 5.4 Deprecated Hook Still Exported

The [`useShopifyError`](src/hooks/useShopifyError.ts) hook is marked `@deprecated` but still exported from the main Shopify module ([`index.ts:37`](src/lib/shopify/index.ts:37)). It should be removed in the next major version.

---

## 6. Recommended Remediation Priorities

| Priority | Concern | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Production guardrail enforcement | Low | Critical — prevents silent demo deployments |
| P0 | Security headers (CSP, HSTS) | Low | Critical — protects against XSS and downgrade attacks |
| P1 | Error handling consistency | Medium | High — improves user experience during failures |
| P1 | Live-mode e2e test pipeline | Medium | High — verifies end-to-end buyer journey |
| P2 | Token-gated field build-time checks | Medium | Medium — prevents runtime query failures |
| P2 | External monitoring integration | Medium | Medium — improves incident diagnosis |
| P3 | API version update process | Low | Medium — prevents future deprecation issues |
| P3 | Demo asset bundling | Low | Low — improves offline development |

---

## 7. Architecture Decision Records

### ADR-001: Three-Mode Storefront Architecture

**Decision**: Support `demo`, `tokenless`, and `token` modes with automatic fallback.

**Rationale**: Enables full development without Shopify credentials while supporting progressive enhancement in production.

**Consequences**:
- Requires maintaining separate query variants for token-gated fields
- Increases testing complexity (three execution paths)
- Risk of silent demo deployment if not guarded

**Status**: Active  
**Date**: 2025-07-10

### ADR-002: Centralized Error Handling with Category Mapping

**Decision**: Use `StorefrontError` class with category-based message registry.

**Rationale**: Provides consistent error UX and enables operational monitoring by error type.

**Consequences**:
- Requires all pages to adopt `useErrorHandler` hook
- Deprecated `useShopifyError` must be phased out
- Error messages need localization for non-English markets

**Status**: In Progress  
**Date**: 2025-07-10
