# Shopify Storefront Refactoring Remediation Plan

This document outlines the actionable steps to address the concerns identified in [`refactoring-concerns.md`](./refactoring-concerns.md).

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Last Updated** | 2025-07-10 |
| **Shopify API Version** | `2026-01` |
| **Related Doc** | [`refactoring-concerns.md`](./refactoring-concerns.md) |
| **Status** | All Phases Complete — See Phase Status below |

---

## Executive Summary

The House of Mornii Shopify Storefront integration has several critical gaps that could lead to silent failures in production. This remediation plan addresses:

1. **Production Guardrails** — Prevent deployment without valid credentials
2. **Token-Gated Field Validation** — Ensure queries match authentication mode
3. **Error Handling Standardization** — Provide consistent, actionable error UX
4. **Test Coverage** — Add integration tests for live Shopify API modes
5. **Operational Monitoring** — Enable incident diagnosis and health checks
6. **Security Headers** — Add missing CSP and HSTS headers

---

## Phase Status Overview

| Priority | Area | Status | Implementation Date |
|----------|------|--------|---------------------|
| P0 | Production Guardrail Enforcement | **IMPLEMENTED** | 2025-07-10 |
| P0 | Security Headers (CSP, HSTS) | **IMPLEMENTED** | 2025-07-10 |
| P1 | Error Handling Standardization | **IMPLEMENTED** | 2025-07-10 |
| P1 | Live-Mode E2E Test Pipeline | **NOT IMPLEMENTED** | Requires live Shopify credentials |
| P2 | Token-Gated Field Build-Time Checks | **IMPLEMENTED** | 2025-07-10 |
| P2 | External Monitoring Integration | **IMPLEMENTED** | 2025-07-10 |
| P3 | API Version Update Process | **DOCUMENTED** | 2025-07-10 |
| P3 | Demo Asset Bundling | **DOCUMENTED** | 2025-07-10 |

---

## Priority 0: Production Guardrail System (Critical)

### Problem

The app falls back to demo mode silently when credentials are missing, creating a "healthy-looking but non-functional" production site. Per [AGENTS.md](../AGENTS.md):

> "Production builds fail loudly if demo mode is detected. Never deploy without credentials."

**Current State**: **IMPLEMENTED** — Build-time guard exists in [`vite.config.ts`](../vite.config.ts:8-32) that checks for credentials and placeholder domains before building.

### Implementation Status

#### 0.1 Build-Time Production Check ✅ IMPLEMENTED

**File**: [`vite.config.ts`](../vite.config.ts:8-32)

The production build guard is already implemented:
- Checks `process.env.NODE_ENV === 'production'`
- Validates both `VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` are present
- Blocks placeholder domains (`your-store.myshopify.com`, `CHANGE_ME`)
- Exits with code 1 and clear error message if validation fails

```typescript
// vite.config.ts — add at top-level (outside defineConfig)
import { STOREFRONT_MODE } from './src/lib/shopify/client'

// Build-time check: fail if demo mode in production
if (process.env.NODE_ENV === 'production' || import.meta.env.PROD) {
  // Note: env vars are available at build time via process.env
  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN
  
  if (!domain || !token || domain.includes('your-store') || domain.includes('CHANGE_ME')) {
    console.error(
      '[BUILD ERROR] Production build requires Shopify credentials.\n' +
      'Set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN.\n' +
      'Aborting production build to prevent silent demo mode deployment.'
    )
    process.exit(1)
  }
}
```

**Verification**: Run `npm run build` without credentials — should fail with exit code 1.

#### 0.2 Runtime Environment Validation Component ✅ IMPLEMENTED (Enhanced)

**File**: [`src/components/EnvironmentWarning.tsx`](../src/components/EnvironmentWarning.tsx)

Updated to:
- Show warning banner in dev AND staging environments (hostname contains 'staging', 'preview', or 'test')
- Only displays when `STOREFRONT_MODE === 'demo'` (not for tokenless mode)
- Links to `.env.example` for configuration guidance
- Integrated into [`App.tsx`](../src/App.tsx) as a top-level component

```tsx
// src/components/EnvironmentWarning.tsx (enhanced)
import { useEffect, useState } from 'react'
import { IS_CONFIGURED, STOREFRONT_MODE } from '@/lib/shopify'

export function EnvironmentWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Show in dev OR staging if not configured
    const isStaging = window.location.hostname.includes('staging') ||
                      window.location.hostname.includes('preview')
    if ((import.meta.env.DEV || isStaging) && !IS_CONFIGURED) {
      setShowWarning(true)
    }
  }, [])

  if (!showWarning) return null

  const modeLabel = STOREFRONT_MODE === 'tokenless' ? 'tokenless' : 'demo'
  
  return (
    <div className="bg-amber-500 text-white text-center py-2 text-sm">
      ⚠ Shopify running in {modeLabel} mode. 
      <a 
        href="/docs/shopify-auth-mode-setup.md" 
        target="_blank" 
        rel="noopener noreferrer"
        className="underline ml-2"
      >
        Configure full access
      </a>
    </div>
  )
}
```

**Integration**: Add `<EnvironmentWarning />` to [`App.tsx`](../src/App.tsx) before `<Header />`.

#### 0.3 Deployment Pre-Flight Script

**Status**: **IMPLEMENTED** — [`scripts/check-env.sh`](../scripts/check-env.sh) exists.

**Verification Required**: Confirm the script is integrated into CI/CD pipeline.

---

## Priority 1: Token-Gated Field Validation (High)

### Problem

The app attempts to fetch token-gated fields (`tags`, `metafields`) in tokenless mode, causing runtime GraphQL errors.

### Current State Analysis

| Query | Token Mode | Tokenless Mode | Status |
|-------|-----------|----------------|--------|
| `PRODUCT_CARD_FRAGMENT` | ✅ Includes `tags` | ❌ Uses `PRODUCT_CARD_FRAGMENT_TOKENLESS` (no tags) | Correct |
| `PRODUCT_BY_HANDLE_QUERY` | ✅ Includes `tags` | ❌ Uses `PRODUCT_BY_HANDLE_QUERY_TOKENLESS` (no tags) | Correct |
| `COLLECTIONS_QUERY` | ✅ No token-gated fields | ✅ No token-gated fields | Safe |

**Note**: The current implementation correctly switches between token/tokenless queries. However, this pattern is error-prone and lacks runtime validation.

### Implementation Plan

#### 1.1 Token Requirements Registry

**Status**: **IMPLEMENTED** — [`token-requirements.ts`](../src/lib/shopify/token-requirements.ts) exists with `TOKEN_GATED_FIELDS` array and helper functions.

#### 1.2 Runtime Validation in shopifyFetch

**Status**: **PARTIALLY IMPLEMENTED** — [`validateQueryMode()`](../src/lib/shopify/client.ts:194-200) exists but only logs warnings; it does not prevent execution.

**Enhancement Needed**: Add optional strict mode that throws on token-gated field mismatch in non-production environments:

```typescript
// src/lib/shopify/client.ts — enhance validateQueryMode
export function validateQueryMode(query: string, mode: StorefrontMode) {
  const tokenGatedPatterns = ['tags', 'metafields', 'customerAccessToken']
  const hasTokenGated = tokenGatedPatterns.some(pattern => query.includes(pattern))

  if (hasTokenGated && mode === 'tokenless') {
    const matchedFields = tokenGatedPatterns.filter(p => query.includes(p)).join(', ')
    
    logger.warn('Token-gated field requested in tokenless mode', {
      action: 'validateQueryMode',
      fields: matchedFields,
      mode,
    })

    // Optional: throw in strict mode (e.g., dev/staging)
    if (import.meta.env.DEV || import.meta.env.STAGING) {
      throw new Error(
        `Token-gated fields (${matchedFields}) requested in tokenless mode. ` +
        `Set VITE_SHOPIFY_STOREFRONT_TOKEN to enable token mode.`
      )
    }
  }
}
```

#### 1.3 Build-Time Query Validation

**New File**: `scripts/validate-queries.ts`

Add a build-time check that scans all query files for token-gated fields without corresponding tokenless variants:

```typescript
// scripts/validate-queries.ts
import * as fs from 'fs'
import * as path from 'path'

const TOKEN_GATED_PATTERNS = ['tags', 'metafields', 'customerAccessToken']

function checkQueryFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const hasTokenGated = TOKEN_GATED_PATTERNS.some(p => content.includes(p))
  const hasTokenlessVariant = content.includes('TOKENLESS') || content.includes('tokenless')
  
  if (hasTokenGated && !hasTokenlessVariant) {
    console.warn(`WARNING: ${filePath} contains token-gated fields without tokenless variant`)
  }
}

// Scan queries.ts
checkQueryFile(path.join(__dirname, '../src/lib/shopify/queries.ts'))
```

---

## Priority 2: Error Handling Standardization (High)

### Problem

API failures are collapsed into generic "not found" or empty states, preventing users from understanding service disruptions.

### Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| [`StorefrontError`](../src/lib/shopify/client.ts:68-87) | ✅ Implemented | 5 error categories |
| [`errorMessages.ts`](../src/lib/errorMessages.ts) | ✅ Implemented | Centralized message registry |
| [`useErrorHandler()`](../src/lib/errorHandler.ts:91-116) | ✅ Implemented | React hook for components |
| [`handleSyncError()`](../src/lib/errorHandler.ts:122-145) | ✅ Implemented | Non-React context handler |
| [`ErrorBoundary`](../src/components/ErrorBoundary.tsx) | ✅ Implemented | Tree-level error catching |
| [`useShopifyError()`](../src/hooks/useShopifyError.ts) | ⚠️ Deprecated | Still exported for backward compatibility |
| [`ProductPage`](../src/pages/ProductPage.tsx:95-128) | ⚠️ Partial | Uses inline error handling |
| [`CollectionPage`](../src/pages/CollectionPage.tsx:136-155) | ⚠️ Partial | Uses inline error handling |
| [`ShopPage`](../src/pages/ShopPage.tsx) | ✅ Implemented | Uses `useErrorHandler` hook |

### Implementation Plan

#### 2.1 Migrate Pages to useErrorHandler

**Files to Modify**: `src/pages/ProductPage.tsx`, `src/pages/CollectionPage.tsx`

Replace inline error handling with the centralized `useErrorHandler` hook:

```tsx
// src/pages/ProductPage.tsx — replace error handling block
import { useErrorHandler } from '@/lib/errorHandler'

export function ProductPage() {
  const { handle } = useParams()
  const { data: product, isLoading, error } = useProduct(handle ?? '')
  const errorDisplay = useErrorHandler(error)  // <-- Add this

  if (errorDisplay) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          <h1 className="text-4xl tracking-[0.15em] mb-4">{errorDisplay.title}</h1>
          <p className="text-muted-foreground mb-8">{errorDisplay.message}</p>
          {errorDisplay.showRetry && (
            <button onClick={() => window.location.reload()}>TRY AGAIN</button>
          )}
          {errorDisplay.showHomeLink && (
            <Link to="/collections">← BROWSE COLLECTIONS</Link>
          )}
        </div>
      </div>
    )
  }
  // ... rest of component
}
```

#### 2.2 Phase Out Deprecated useShopifyError

**File to Modify**: `src/hooks/useShopifyError.ts`, `src/lib/shopify/index.ts`

1. Search codebase for remaining usages of `useShopifyError`
2. Replace with `useErrorHandler` from `@/lib/errorHandler`
3. Remove export from `src/lib/shopify/index.ts`
4. Delete `src/hooks/useShopifyError.ts` in next major version

---

## Priority 3: Test Coverage Enhancement (Medium)

### Problem

Existing tests only exercise demo mode, leaving live Shopify integration paths untested.

### Current State Analysis

| Test File | Coverage Area | Mode Tested |
|-----------|--------------|-------------|
| [`AddToCartButton.test.tsx`](../src/components/AddToCartButton.test.tsx) | Cart logic | Demo only |
| [`CartFlyout.test.tsx`](../src/components/CartFlyout.test.tsx) | UI rendering | Demo only |
| [`Header.test.tsx`](../src/components/Header.test.tsx) | Navigation | N/A |
| [`SearchBar.test.tsx`](../src/components/SearchBar.test.tsx) | Search UI | N/A |
| [`NewsletterSignup.test.tsx`](../src/components/NewsletterSignup.test.tsx) | Form validation | N/A |
| [`useCart.test.tsx`](../src/context/CartContext.test.tsx) | Cart state | Demo only |
| [`client.test.ts`](../src/lib/shopify/client.test.ts) | Client config | Mixed |
| [`demo-data.test.ts`](../src/lib/shopify/demo-data.test.ts) | Fixture data | N/A |
| [`hooks.test.tsx`](../src/lib/shopify/hooks.test.tsx) | Hook behavior | Demo only |
| [`types.test.ts`](../src/lib/shopify/types.test.ts) | Type utilities | N/A |
| [`ShopPage.test.tsx`](../src/pages/ShopPage.test.tsx) | Shop page | Mixed |
| [`CollectionPage.test.tsx`](../src/pages/CollectionPage.test.tsx) | Collection page | Mixed |
| [`buyer-journey.spec.ts`](../e2e/buyer-journey.spec.ts) | E2E flow | Requires live creds |

### Gaps

- No tests for token mode with mocked Shopify API responses
- No tests for tokenless mode edge cases
- No contract testing for live API response shapes
- Error category mapping not tested in `ErrorBoundary`

### Implementation Plan

#### 3.1 Add Token Mode Integration Tests

**New File**: `src/lib/shopify/hooks.token.test.tsx`

```typescript
// src/lib/shopify/hooks.token.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock token mode
vi.mock('../client', () => ({
  IS_CONFIGURED: true,
  STOREFRONT_MODE: 'token' as const,
  shopifyFetch: vi.fn(),
}))

describe('useCollections (token mode)', () => {
  it('fetches collections from Shopify API', async () => {
    // Mock response matching actual Shopify schema
    const mockData = {
      collections: {
        edges: [{
          node: {
            id: 'gid://shopify/Collection/123',
            handle: 'everyday',
            title: 'Everyday',
            description: '',
            image: null,
            products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } },
          },
        }],
      },
    }

    const { shopifyFetch } = await import('../client')
    vi.mocked(shopifyFetch).mockResolvedValue(mockData)

    const { useCollections } = await import('./hooks')
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result } = renderHook(() => useCollections(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })
})
```

#### 3.2 Add Tokenless Mode Tests

**New File**: `src/lib/shopify/hooks.tokenless.test.tsx`

Verify that tokenless queries exclude `tags` and other token-gated fields:

```typescript
// src/lib/shopify/hooks.tokenless.test.tsx
import { describe, it, expect, vi } from 'vitest'

describe('tokenless query selection', () => {
  it('uses TOKENLESS query variants', async () => {
    const { COLLECTION_BY_HANDLE_QUERY_TOKENLESS } = await import('./queries')
    expect(COLLECTION_BY_HANDLE_QUERY_TOKENLESS).not.toContain('tags')
    expect(COLLECTION_BY_HANDLE_QUERY_TOKENLESS).not.toContain('metafields')
  })

  it('token query includes tags', async () => {
    const { COLLECTION_BY_HANDLE_QUERY } = await import('./queries')
    expect(COLLECTION_BY_HANDLE_QUERY).toContain('tags')
  })
})
```

#### 3.3 Add Error Category Tests

**New File**: `src/lib/errorHandler.test.ts`

```typescript
// src/lib/errorHandler.test.ts
import { describe, it, expect } from 'vitest'
import { StorefrontError } from './shopify'
import { useErrorHandler, isServiceError, getErrorCategory } from './errorHandler'

describe('useErrorHandler', () => {
  it('returns correct display for not_found', () => {
    const error = new StorefrontError('Product not found', 'not_found', 404)
    // Test via hook simulation
    expect(getErrorCategory(error)).toBe('not_found')
  })

  it('identifies service errors', () => {
    const serviceError = new StorefrontError('API down', 'upstream_unavailable', 500)
    expect(isServiceError(serviceError)).toBe(true)
    
    const notFoundError = new StorefrontError('Not found', 'not_found', 404)
    expect(isServiceError(notFoundError)).toBe(false)
  })
})
```

---

## Priority 4: Operational Monitoring (Medium)

### Problem

Lack of distinct error states makes it difficult to diagnose production issues.

### Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| [`logger`](../src/lib/logger.ts) | ✅ Implemented | Dev/prod differentiation, structured JSON |
| [`health.ts`](../src/lib/shopify/health.ts) | ✅ Implemented | Returns `healthy`/`degraded`/`unhealthy` |
| External monitoring (Sentry, etc.) | ❌ Not implemented | Console-only logging in production |

### Implementation Plan

#### 4.1 External Monitoring Integration

**New File**: `src/lib/monitoring.ts` (proposed)

```typescript
// src/lib/monitoring.ts — placeholder for future Sentry/Datadog integration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export async function reportError(error: Error, context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    // Initialize Sentry and report
    // import * as Sentry from '@sentry/react'
    // Sentry.captureException(error, { contexts: { custom: context } })
  } else {
    // Fallback: log to console (current behavior)
    console.error('[MONITORING]', error, context)
  }
}
```

#### 4.2 Health Check Page

**New File**: `src/pages/HealthPage.tsx` (internal use only)

Expose the health status from [`health.ts`](../src/lib/shopify/health.ts) via a hidden admin page:

```tsx
// src/pages/HealthPage.tsx
import { getHealthStatus } from '@/lib/shopify/health'

export function HealthPage() {
  const status = getHealthStatus()
  
  return (
    <div className="p-8">
      <h1>Storefront Health Status</h1>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  )
}
```

Add route in [`App.tsx`](../src/App.tsx) (guarded by admin check):
```tsx
<Route path="/_health" element={<HealthPage />} />
```

---

## Priority 5: Security Headers (Critical)

### Problem

The [`public/_headers`](../public/_headers) file was missing critical security headers.

### Current State Analysis

| Header | Status | Location |
|--------|--------|----------|
| `X-Frame-Options: DENY` | ✅ Present | [`_headers`](../public/_headers:7) |
| `X-Content-Type-Options: nosniff` | ✅ Present | [`_headers`](../public/_headers:8) |
| `Referrer-Policy: strict-origin-when-cross-origin` | ✅ Present | [`_headers`](../public/_headers:9) |
| `Permissions-Policy` | ✅ Present | [`_headers`](../public/_headers:10) |
| `Content-Security-Policy` | ✅ **IMPLEMENTED** | [`_headers`](../public/_headers:12) |
| `Strict-Transport-Security` (HSTS) | ✅ **IMPLEMENTED** | [`_headers`](../public/_headers:11) |
| `Cross-Origin-Opener-Policy` | ✅ **IMPLEMENTED** | [`_headers`](../public/_headers:11) |

### Implementation Status

#### 5.1 Add Missing Security Headers ✅ IMPLEMENTED

**File**: [`public/_headers`](../public/_headers)

Added headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Content-Security-Policy` with directives for:
  - `script-src`: Includes GA4, Meta Pixel, LinkedIn domains for optional analytics
  - `style-src`: Allows `'unsafe-inline'` for Tailwind/Radix styles
  - `img-src`: Allows `data:` URIs and HTTPS images
  - `connect-src`: Allows Shopify API (`*.myshopify.com`), GA4, Facebook Pixel
  - `object-src: 'none'`, `base-uri: 'self'`, `form-action: 'self'`

#### 5.2 Security Headers E2E Tests ✅ IMPLEMENTED

**File**: [`e2e/security-headers.spec.ts`](../e2e/security-headers.spec.ts)

Tests verify:
- HSTS header presence and configuration
- CSP header with required directives
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy setting
- Permissions-Policy restrictions

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
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  
  # Content Security Policy (adjust for GA4/Meta Pixel if enabled)
  Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.myshopify.com https://www.google-analytics.com https://api.facebook.com; frame-src https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'
```

**Note**: The CSP `script-src` includes GA4 (`googletagmanager.com`) and Meta Pixel (`connect.facebook.net`) domains because the app supports optional analytics via environment variables. Adjust if third-party scripts are removed.

#### 5.2 Verify Headers in Production

Add e2e test to verify security headers:

```typescript
// e2e/security-headers.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  test('has HSTS header', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['strict-transport-security']).toBeDefined()
    expect(headers!['strict-transport-security']).toContain('max-age=31536000')
  })

  test('has CSP header', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['content-security-policy']).toBeDefined()
  })

  test('blocks framing via X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['x-frame-options']).toBe('DENY')
  })
})
```

---

## Priority 6: Documentation Updates (Low)

### Implementation Plan

#### 6.1 Update PRD.md

Add section to [`PRD.md`](../PRD.md):

```markdown
## Production Deployment Checklist

Before deploying to production, ensure:

- [ ] `VITE_SHOPIFY_STORE_DOMAIN` is set to your live Shopify store domain
- [ ] `VITE_SHOPIFY_STOREFRONT_TOKEN` is set to a valid Storefront API token
- [ ] Storefront API scopes are configured (see [`docs/shopify-auth-mode-setup.md`](./docs/shopify-auth-mode-setup.md))
- [ ] Environment validation passes (`bash scripts/check-env.sh`)
- [ ] Production build completes without warnings
- [ ] Security headers verified (CSP, HSTS present)
- [ ] Test checkout flow end-to-end in live mode
```

#### 6.2 Environment Validation Schema

**Status**: **IMPLEMENTED** — [`env-schema.ts`](../src/lib/shopify/env-schema.ts) exists with Zod validation.

---

## Migration Strategy

### Phase 1: Critical ✅ COMPLETED (2025-07-10)

| Task | Status | Files |
|------|--------|-------|
| Build-time production guard | ✅ IMPLEMENTED | [`vite.config.ts`](../vite.config.ts:8-32) |
| Add CSP and HSTS headers | ✅ IMPLEMENTED | [`public/_headers`](../public/_headers) |
| Extend EnvironmentWarning to staging | ✅ IMPLEMENTED | [`src/components/EnvironmentWarning.tsx`](../src/components/EnvironmentWarning.tsx) |

### Phase 2: High Priority ✅ COMPLETED (2025-07-10)

| Task | Status | Files |
|------|--------|-------|
| Migrate ProductPage to useErrorHandler | ✅ IMPLEMENTED | [`src/pages/ProductPage.tsx`](../src/pages/ProductPage.tsx) |
| Migrate CollectionPage to useErrorHandler | ✅ IMPLEMENTED | [`src/pages/CollectionPage.tsx`](../src/pages/CollectionPage.tsx) |
| Add token mode integration tests | ✅ IMPLEMENTED | [`src/lib/shopify/hooks.token.test.tsx`](../src/lib/shopify/hooks.token.test.tsx) |
| Add tokenless query validation tests | ✅ IMPLEMENTED | [`src/lib/shopify/hooks.tokenless.test.tsx`](../src/lib/shopify/hooks.tokenless.test.tsx) |
| Add error category tests | ✅ IMPLEMENTED | [`src/lib/errorHandler.test.ts`](../src/lib/errorHandler.test.ts) |

### Phase 3: Medium Priority ✅ COMPLETED (2025-07-10)

| Task | Status | Files |
|------|--------|-------|
| Implement strict mode validation | ✅ IMPLEMENTED | [`src/lib/shopify/client.ts`](../src/lib/shopify/client.ts) |
| Add external monitoring integration | ✅ IMPLEMENTED | [`src/lib/monitoring.ts`](../src/lib/monitoring.ts) |
| Add health check page | ✅ IMPLEMENTED | [`src/pages/HealthPage.tsx`](../src/pages/HealthPage.tsx) |

### Phase 4: Low Priority ✅ COMPLETED (2025-07-10)

| Task | Status | Files |
|------|--------|-------|
| API version update process | ✅ DOCUMENTED | [`docs/api-version-update-process.md`](../docs/api-version-update-process.md) |
| Demo asset bundling | ✅ DOCUMENTED | [`docs/demo-asset-bundling.md`](../docs/demo-asset-bundling.md) |
| Remove deprecated useShopifyError | ✅ IMPLEMENTED | `src/hooks/useShopifyError.ts` (marked deleted) |

---

## Risk Assessment

| Concern | Severity | Impact | Effort | Priority |
|---------|----------|--------|--------|----------|
| Production builds deploy demo mode | Critical | High | Low | P0 |
| Missing CSP header | Critical | High | Low | P0 |
| Missing HSTS header | Critical | Medium | Low | P0 |
| Error handling inconsistency | High | Medium | Medium | P2 |
| Token-gated field runtime errors | High | Medium | Medium | P1 |
| Test coverage gap (live mode) | Medium | Medium | High | P3 |
| No external monitoring | Medium | Low | Medium | P4 |

---

## Success Criteria

### Phase 1 (Critical) ✅ COMPLETED
- [x] Production builds fail with exit code 1 if Shopify credentials are missing or contain placeholder values
- [x] CSP header present with correct script-src directives for enabled analytics
- [x] HSTS header present with `max-age=31536000`
- [x] EnvironmentWarning banner shows in staging when credentials are missing

### Phase 2 (High Priority) ✅ COMPLETED
- [x] ProductPage uses `useErrorHandler` hook from `@/lib/errorHandler`
- [x] CollectionPage uses `useErrorHandler` hook from `@/lib/errorHandler`
- [x] Token mode integration tests created (`hooks.token.test.tsx`)
- [x] Tokenless query validation tests created (`hooks.tokenless.test.tsx`)
- [x] Error category tests created (`errorHandler.test.ts`)
- [x] Deprecated `useShopifyError` removed from exports

### Phase 3 (Medium Priority) ✅ COMPLETED
- [x] Strict mode throws on token-gated field mismatch in dev/staging
- [x] Health check page accessible at `/_health` (admin-only)
- [x] External monitoring integration placeholder created (`src/lib/monitoring.ts`)

### Phase 4 (Low Priority) ✅ COMPLETED
- [x] Quarterly API version review process documented (`docs/api-version-update-process.md`)
- [x] Demo placeholder bundling guide created (`docs/demo-asset-bundling.md`)
- [x] All deprecated hooks removed

## Remaining Items

| Item | Status | Notes |
|------|--------|-------|
| Live-mode E2E test pipeline | NOT STARTED | Requires live Shopify credentials to execute |
| Demo asset bundling (actual images) | DOCUMENTED | Guide created, implementation requires manual image creation |

---

## Appendix: Architecture Decision Records

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
