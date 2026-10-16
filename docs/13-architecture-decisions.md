# Architecture Decisions & Lessons Learned

## Overview

This document captures the key architectural decisions, remediation history, and lessons learned from the House of Mornii storefront development. It consolidates information from the architecture review, remediation plan, and refactoring concerns documents.

## Current Architecture

### Tech Stack

- **React 19** + TypeScript 5.7 + Vite 7
- **React Router DOM 7** for routing
- **TanStack Query** for server state management
- **React Context** (CartContext) for client state
- **Tailwind CSS 4** with OKLCH color system
- **Framer Motion** for animations
- **Cloudflare Pages** for hosting
- **Cloudflare Workers** for backend automation

### Key Architectural Decisions

#### 1. Token-Only Storefront Mode (P0 — Implemented)

**Decision:** All live environments require a public Storefront API token. There is no demo or tokenless fallback.

**Rationale:** The previous architecture treated the Storefront token as optional, while core product queries requested token-gated fields like `tags`. This created a failure path where a domain-only deployment could enter live mode and then break catalog requests. The fix makes live mode explicit and fails closed when credentials are missing or placeholder values are detected.

**Implementation:**
- `STOREFRONT_MODE` is always `'token'`
- `IS_CONFIGURED` is always `true`
- `client.ts` throws at module load if `VITE_SHOPIFY_STORE_DOMAIN` or `VITE_SHOPIFY_STOREFRONT_TOKEN` is missing or a placeholder (`your-store.myshopify.com`, `CHANGE_ME`)

**Files:** `src/lib/shopify/client.ts`, `src/lib/shopify/env-schema.ts`

#### 2. Two-API Architecture: Storefront + Admin Proxy (P0 — Implemented)

**Decision:** Use the Storefront API for all client-side operations and the Admin API only through a server-side Cloudflare Worker proxy.

**Rationale:** Shopify explicitly recommends against calling Admin API from the browser. The Admin API provides richer data (tags, vendor, metafields) and write capabilities, but its secret token must never be exposed. The Worker proxy provides read-only Admin API access, webhook reception, and scheduled backups.

**Implementation:**
- Browser calls `shopifyFetch()` → Storefront API (direct, public token)
- Browser calls `adminProxyFetch()` → `POST /api/shopify/admin` → Cloudflare Worker → Admin API (read-only, mutation-blocked)
- Worker secrets (`SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`) are never `VITE_`-prefixed

**Files:** `src/lib/shopify/client.ts`, `src/lib/shopify/admin-proxy.ts`, `workers/shopify-proxy.ts`

#### 3. Typed Error Handling with Categories (P1 — Implemented)

**Decision:** Introduce a normalized error model with categories (`not_found`, `misconfigured`, `upstream_unavailable`, `query_error`) so page components can distinguish retryable service failures from genuine not-found content.

**Rationale:** Previously, storefront pages collapsed `error` and `!data` into the same not-found UX, making it impossible to distinguish missing content from upstream failure, misconfiguration, or temporary Shopify outages.

**Implementation:**
- `StorefrontError` class with `category` and `statusCode` fields
- Page components use `isServiceError` pattern to render retryable vs non-retryable states
- Error category behavior covered in `src/lib/shopify/client.test.ts`

**Files:** `src/lib/shopify/client.ts`, `src/pages/ProductPage.tsx`, `src/pages/CollectionPage.tsx`, `src/pages/ShopPage.tsx`

#### 4. Provider-Neutral Newsletter Integration (P1 — Implemented)

**Decision:** Keep the newsletter form provider-neutral with a configurable `VITE_NEWSLETTER_ENDPOINT` hook. When blank, the form runs in prototype mode.

**Rationale:** The business has not yet selected a final email provider. The frontend should stay usable for prototype showcases while leaving the final integration open. No discount, early-access promise, or welcome-flow promise is hardcoded.

**Files:** `src/components/NewsletterSignup.tsx`, `src/lib/newsletter.ts`, `src/lib/siteConfig.ts`

#### 5. Serverless-First Deployment (P0 — Implemented)

**Decision:** Deploy the frontend to Cloudflare Pages and backend automation to Cloudflare Workers, with CI/CD via GitHub Actions.

**Rationale:** Cloudflare Pages provides free hosting with automatic HTTPS, global CDN, and preview URLs per PR. Cloudflare Workers provide server-side automation (Admin API proxy, webhooks, backups) without managing servers.

**Files:** `.github/workflows/deploy.yml`, `wrangler.toml`, `workers/shopify-proxy.ts`

## Remediation History

### Phase 1: Critical (Completed)

1. **Build-time production guard** — `client.ts` throws at module load if credentials are missing/placeholder
2. **Runtime environment validation** — `EnvironmentWarning` component displays configuration issues
3. **Deployment pre-flight script** — `scripts/check-env.sh` validates environment before build

### Phase 2: High Priority (Completed)

1. **Token requirements registry** — `src/lib/shopify/token-requirements.ts` documents required scopes
2. **Runtime validation in shopifyFetch** — Validates credentials before making API calls
3. **Build-time query validation** — GraphQL queries validated at build time

### Phase 3: Medium Priority (Completed)

1. **Migrate pages to useErrorHandler** — Pages use typed error handling
2. **Phase out deprecated useShopifyError** — Replaced with `StorefrontError` pattern
3. **Token mode integration tests** — Tests for token-only mode behavior
4. **Error category tests** — Tests for all `StorefrontErrorCategory` values

### Phase 4: Low Priority (Completed)

1. **External monitoring integration** — Cloudflare Health Checks configured
2. **Health check page** — `src/pages/HealthPage.tsx` for monitoring
3. **Security headers** — `public/_headers` with CSP, HSTS, X-Frame-Options
4. **Security headers E2E tests** — `e2e/security-headers.spec.ts`

## Lessons Learned

### 1. Fail Closed, Not Open

The most dangerous failure mode was the silent demo fallback — a deployment could look like a healthy storefront while serving placeholder data and a nonfunctional checkout. The fix makes demo mode explicit and opt-in, and production fails closed when live Shopify configuration is absent or invalid.

### 2. Align Query Shapes with Auth Mode

The original architecture treated the Storefront token as optional while requesting token-gated fields like `tags`. This created an intrinsic failure path. The fix requires a public Storefront token for all live deployments, ensuring query shapes match the supported auth mode.

### 3. Distinguish Error Types at the Data Layer

Error handling belongs in the data layer, not in individual page components. By normalizing errors into categories at the `shopifyFetch` level, every page can render appropriate states without reinventing error heuristics.

### 4. Verify the Revenue Path

The real buyer journey (browse → product → add to cart → checkout) was unverified because automated coverage overwhelmingly forced demo mode. Adding a browser-level smoke test against a real development store provides far more release confidence than expanding demo-mode unit tests alone.

### 5. Keep Secrets Server-Side

The Admin API token must never be `VITE_`-prefixed or committed to the repo. Cloudflare Worker secrets provide secure storage, and the proxy route blocks mutations by design.

### 6. Environment-Driven Configuration

All visible copy, newsletter endpoints, and integration values should be environment-driven. This allows the prototype to proceed without final business decisions while keeping the path open for production activation.

## Future Considerations

### Customer Account API

Customer account integration (login, registration, order history) is planned for a future iteration. The architecture supports adding this via:
1. Customer types in `src/lib/shopify/types.ts`
2. Customer GraphQL queries/mutations in `src/lib/shopify/queries.ts`
3. Customer Auth Context in `src/context/CustomerAuthContext.tsx`
4. UI components for login/register/profile pages

### Full Admin Write Access

If the business requires write/mutation operations from the storefront (e.g., customer account management, order tracking):
1. Add write-capable hooks in `hooks.ts` for mutations
2. Relax the `MUTATION_PATTERN` guard in `workers/shopify-proxy.ts` for specific, vetted operations
3. Add error handling for Admin API-specific errors

### Automated Restore Tooling

Backups are captured daily to R2, but no automated restore tooling exists. A future iteration could add a restore script that reads from R2 snapshots and writes back to Shopify via the Admin API.

## Related Documentation

- `docs/03-shopify-integration.md` — Shopify Storefront API integration
- `docs/08-shopify-automation-worker.md` — Cloudflare Worker architecture
- `docs/09-error-handling.md` — Error handling patterns
- `docs/01-architecture.md` — Application architecture overview
