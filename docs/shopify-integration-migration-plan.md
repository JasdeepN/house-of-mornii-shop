# Shopify Integration Migration Plan

> **Status:** Draft  
> **Created:** 2025  
> **Priority:** High (Security + Best Practices)

## Overview

This document outlines the migration plan to align the House of Mornii Shop codebase with Shopify's official headless best practices, as documented in:

- [Building with the Storefront API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api)
- [Building with the Customer Account API](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api)

## Current State Analysis

### What's Working Well

| Area | Status | Notes |
|------|--------|-------|
| Storefront SDK usage | ✅ Partial | `@shopify/storefront-api-client` used in token mode |
| GraphQL queries | ✅ Good | Proper fragment usage, cursor-based pagination |
| Cart mutations | ✅ Good | Follows Storefront API cart patterns |
| Demo mode fallback | ✅ Good | Graceful degradation when credentials absent |
| Environment validation | ✅ Good | Build-time checks prevent demo deployment |

### Critical Issues to Fix

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Admin API token exposed in browser | 🔴 Critical | Full store access if token leaked |
| 2 | Tokenless mode fallback | 🟠 High | Limited capabilities, inconsistent API surface |
| 3 | No retry logic for transient errors | 🟡 Medium | Poor resilience during Shopify outages |
| 4 | No customer account support | 🟢 Low (current) | Blocks future account features |

---

## Phase 1: Remove Admin API from Client-Side Code

**Priority:** Critical — Security fix  
**Estimated effort:** 2 days  
**Risk:** Medium (requires backend proxy setup)

### Problem

The `VITE_SHOPIFY_ADMIN_ACCESS_TOKEN` is read from environment variables and sent directly from the browser to Shopify's Admin API:

```typescript
// src/lib/shopify/client.ts:35-53 — CURRENT (INSECURE)
export async function adminFetch<T = unknown>(options: AdminFetchOptions): Promise<T> {
  response = await fetch(endpoint, {
    headers: {
      'X-Shopify-Access-Token': adminAccessToken as string, // ⚠️ EXPOSED IN BROWSER
    },
    body: JSON.stringify({ query, variables }),
  })
}
```

This is used in 4 React Query hooks (`useCollections`, `useCollection`, `useProduct`, `useProducts`) as a "simpler auth" fallback.

### Solution: Cloudflare Worker Proxy

Deploy a Cloudflare Worker that acts as a secure proxy for Admin API calls. The worker holds the Admin token server-side and forwards authenticated requests to Shopify.

#### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│ Cloudflare Worker │────▶│  Shopify    │
│  (React)    │     │  (/api/shopify/*) │     │  Admin API  │
└─────────────┘     └──────────────────┘     └─────────────┘
                          │
                  Holds VITE_SHOPIFY_ADMIN_ACCESS_TOKEN
                  (server-side only, never in browser)
```

#### Implementation Steps

**Step 1: Create Cloudflare Worker**

Create `workers/shopify-proxy.ts`:

```typescript
// workers/shopify-proxy.ts
const API_VERSION = '2026-01'

interface ProxyRequest {
  query: string
  variables?: Record<string, unknown>
}

export default {
  async fetch(request: Request): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      })
    }

    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
    if (!adminToken) {
      return new Response('Admin token not configured', { status: 500 })
    }

    // Only allow POST to /api/shopify/admin
    const url = new URL(request.url)
    if (url.pathname !== '/api/shopify/admin' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 })
    }

    let body: ProxyRequest
    try {
      body = await request.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    // Forward to Shopify Admin API
    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({ query: body.query, variables: body.variables }),
      }
    )

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
```

**Step 2: Update `vite.config.ts` Dev Proxy**

Add local proxy for development so the worker isn't required locally:

```typescript
// vite.config.ts — add to server.proxy
server: {
  proxy: {
    '/api/shopify': {
      target: 'http://localhost:8787', // Cloudflare dev server
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/shopify/, ''),
    },
  },
}
```

**Step 3: Create Admin API Proxy Client**

Create `src/lib/shopify/admin-proxy.ts`:

```typescript
// src/lib/shopify/admin-proxy.ts — NEW FILE
import { logger } from '@/lib/logger'

interface AdminFetchOptions {
  query: string
  variables?: Record<string, unknown>
}

/**
 * Execute a GraphQL query against the Shopify Admin API via Cloudflare Worker proxy.
 * The Admin token is held server-side in the Worker — never exposed to the browser.
 */
export async function adminProxyFetch<T = unknown>(options: AdminFetchOptions): Promise<T> {
  const { query, variables = {} } = options

  try {
    const response = await fetch('/api/shopify/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`Admin proxy error: ${response.status} ${response.statusText}`)
    }

    const json: { data: T; errors?: { message: string }[] } = await response.json()

    if (json.errors?.length) {
      const messages = json.errors.map((e) => e.message).join(', ')
      throw new Error(`Admin API GraphQL errors: ${messages}`)
    }

    return json.data
  } catch (error) {
    logger.error('Admin proxy fetch failed', {
      action: 'adminProxyFetch',
    })
    throw error
  }
}
```

**Step 4: Update Hooks to Use Proxy**

Replace all `adminFetch` calls in `src/lib/shopify/hooks.ts` with `adminProxyFetch`:

```typescript
// BEFORE (hooks.ts line ~167)
if (HAS_ADMIN_CREDENTIALS) {
  const data = await adminFetch<{ collections: { edges: { node: ShopifyCollection }[] } }>({
    query: ADMIN_COLLECTIONS_QUERY,
  })
}

// AFTER
if (import.meta.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN) {
  const data = await adminProxyFetch<{ collections: { edges: { node: ShopifyCollection }[] } }>({
    query: ADMIN_COLLECTIONS_QUERY,
  })
}
```

**Step 5: Update Exports**

Update `src/lib/shopify/index.ts`:

```typescript
// REMOVE these exports:
export { shopifyFetch, IS_CONFIGURED, STOREFRONT_MODE, StorefrontError, validateQueryMode } from './client'
export type { StorefrontMode, StorefrontErrorCategory } from './client'

// ADD adminProxyFetch export:
export { adminProxyFetch } from './admin-proxy'
```

**Step 6: Remove Insecure `adminFetch`**

Delete the `adminFetch` function from `src/lib/shopify/client.ts` and remove `HAS_ADMIN_CREDENTIALS` export.

#### Files to Modify

| File | Action |
|------|--------|
| `workers/shopify-proxy.ts` | **Create** — Cloudflare Worker |
| `src/lib/shopify/admin-proxy.ts` | **Create** — Browser client for proxy |
| `src/lib/shopify/client.ts` | **Modify** — Remove `adminFetch`, `HAS_ADMIN_CREDENTIALS` |
| `src/lib/shopify/hooks.ts` | **Modify** — Replace `adminFetch` with `adminProxyFetch` |
| `src/lib/shopify/index.ts` | **Modify** — Update exports |
| `src/lib/shopify/client.test.ts` | **Modify** — Remove Admin API tests |
| `src/lib/shopify/hooks.test.tsx` | **Modify** — Update mocks |

#### Files to Delete

| File | Reason |
|------|--------|
| (none) | All files are refactored, not deleted |

---

## Phase 2: SDK-Only Storefront API Migration

**Priority:** High — Consistency fix  
**Estimated effort:** 1 day  
**Risk:** Low

### Problem

The codebase uses two different methods to call the Storefront API:

1. **SDK mode** (`shopifyFetchWithSdk`) — Uses `@shopify/storefront-api-client` ✅
2. **Tokenless mode** (`shopifyFetchTokenless`) — Raw `fetch()` without auth ⚠️

This creates an inconsistent API surface and limits capabilities when tokenless.

### Solution: Require Storefront Token

Remove the tokenless fallback path. The app will run in either `token` mode (full SDK) or `demo` mode (fixture data).

#### Implementation Steps

**Step 1: Remove Tokenless Function**

Delete `shopifyFetchTokenless()` from `src/lib/shopify/client.ts`.

**Step 2: Simplify `shopifyFetch` Router**

```typescript
// src/lib/shopify/client.ts — SIMPLIFIED
export async function shopifyFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  context?: LogContext,
): Promise<T> {
  if (STOREFRONT_MODE === 'demo') {
    throw new Error(
      'Shopify is not configured. The app should be using demo data — this call should not happen.',
    )
  }

  // Only token mode remains — SDK handles everything
  if (STOREFRENT_MODE === 'token' && storefrontClient) {
    return await shopifyFetchWithSdk<T>(query, variables, context)
  }

  // Should never reach here if STOREFRONT_MODE is correctly resolved
  throw new Error('Unexpected storefront mode')
}
```

**Step 3: Remove Tokenless Query Variants**

Delete from `src/lib/shopify/queries.ts`:
- `COLLECTION_BY_HANDLE_QUERY_TOKENLESS`
- `PRODUCTS_QUERY_TOKENLESS`
- `PRODUCT_BY_HANDLE_HOOK_QUERY_TOKENLESS`
- `PRODUCT_CARD_FRAGMENT_TOKENLESS`

**Step 4: Update Hooks to Remove Tokenless Branch**

In `src/lib/shopify/hooks.ts`, replace all:

```typescript
// BEFORE
STOREFRONT_MODE === 'token' 
  ? COLLECTION_BY_HANDLE_QUERY 
  : COLLECTION_BY_HANDLE_QUERY_TOKENLESS
```

With:

```typescript
// AFTER
COLLECTION_BY_HANDLE_QUERY
```

**Step 5: Update Mode Resolution**

Simplify `resolveStorefrontMode()` in `src/lib/shopify/client.ts`:

```typescript
function resolveStorefrontMode(): StorefrontMode {
  const hasDomain = !!domain && !PLACEHOLDER_DOMAINS.has(domain)
  const hasToken = !!storefrontToken
  
  if (!hasDomain) return 'demo'
  if (!hasToken) return 'demo' // Changed from 'tokenless' to 'demo'
  return 'token'
}
```

#### Files to Modify

| File | Action |
|------|--------|
| `src/lib/shopify/client.ts` | **Modify** — Remove tokenless function, simplify mode resolution |
| `src/lib/shopify/queries.ts` | **Modify** — Delete `_TOKENLESS` variants |
| `src/lib/shopify/hooks.ts` | **Modify** — Remove tokenless branches |
| `src/lib/shopify/client.test.ts` | **Modify** — Remove tokenless tests |
| `src/lib/shopify/hooks.tokenless.test.tsx` | **Delete** — No longer needed |

---

## Phase 3: Error Handling Improvements

**Priority:** Medium — Resilience fix  
**Estimated effort:** 1 day  
**Risk:** Low

### Problem

Current error handling categorizes errors but doesn't retry transient failures (5xx, network timeouts). Shopify's documentation recommends exponential backoff for retryable errors.

### Solution: Add Retry Logic

#### Implementation Steps

**Step 1: Create Retry Utility**

Create `src/lib/shopify/retry.ts`:

```typescript
// src/lib/shopify/retry.ts — NEW FILE

export interface RetryConfig {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  multiplier?: number
  retryableStatuses?: number[]
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  multiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

/**
 * Execute an async function with exponential backoff retry.
 * Only retries on network errors or configured HTTP status codes.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs, multiplier, retryableStatuses } = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  let lastError: Error | unknown
  let delay = initialDelayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      const shouldRetry = isRetryableError(error, retryableStatuses)
      if (!shouldRetry || attempt === maxAttempts) {
        throw error
      }

      await sleep(delay)
      delay = Math.min(delay * multiplier, maxDelayMs)
    }
  }

  throw lastError
}

function isRetryableError(error: Error | unknown, retryableStatuses: number[]): boolean {
  // Network errors are always retryable
  if (error instanceof TypeError && 'code' in error) {
    return (error as any).code === 'ENOTFOUND' || (error as any).code === 'ECONNRESET'
  }

  // HTTP errors with retryable status codes
  if (error instanceof Error && 'statusCode' in error) {
    return retryableStatuses.includes((error as any).statusCode)
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

**Step 2: Integrate Retry into SDK Fetch**

Update `shopifyFetchWithSdk()` in `src/lib/shopify/client.ts`:

```typescript
import { withRetry } from './retry'

async function shopifyFetchWithSdk<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
  context?: LogContext,
): Promise<T> {
  return withRetry(async () => {
    const response = await storefrontClient!.request(query, { variables })

    if (response.errors) {
      // Non-retryable GraphQL errors should be thrown immediately
      const graphqlErrors = response.errors?.graphQLErrors ?? []
      const messages = graphqlErrors.map((e: any) => e.message).join(', ')
      
      throw new StorefrontError(
        `Shopify GraphQL errors: ${messages || JSON.stringify(response.errors)}`,
        'query_error',
        response.errors?.networkStatusCode,
        context,
      )
    }

    return response.data as T
  })
}
```

#### Files to Modify

| File | Action |
|------|--------|
| `src/lib/shopify/retry.ts` | **Create** — Retry utility |
| `src/lib/shopify/client.ts` | **Modify** — Integrate retry into SDK fetch |

---

## Phase 4: Customer Account API Readiness (Future)

**Priority:** Low — Future-proofing  
**Estimated effort:** 3 days  
**Risk:** Low (planning phase only)

### When to Implement

Implement this phase when:
- Customer accounts are in the product roadmap
- You need order history, saved addresses, or wishlists
- You want to merge anonymous carts with customer accounts

### Recommended Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Browser   │────▶│  Cloudflare      │────▶│ Customer Account  │
│  (React)    │     │  Worker          │────▶│ API               │
└─────────────┘     │  (/api/auth/*)   │     └───────────────────┘
                    └──────────────────┘
                            │
                    Stores x-shopify-customer-access-token
                    in httpOnly cookie (never localStorage)
```

### Implementation Outline

**Step 1: Create Auth Worker Routes**

```typescript
// workers/shopify-proxy.ts — ADD routes
// POST /api/auth/login     — Customer login via OAuth
// POST /api/auth/logout    — Invalidate customer token
// GET  /api/auth/session   — Check current customer session
```

**Step 2: Create Auth Hooks**

Create `src/lib/shopify/customer-auth.ts`:

```typescript
// src/lib/shopify/customer-auth.ts — NEW FILE (future)

/**
 * Authenticate a customer and store the access token in an httpOnly cookie.
 * Per Shopify Customer Account API docs:
 * https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api
 */
export async function loginCustomer(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  if (!response.ok) {
    throw new Error('Login failed')
  }
  
  // Token is set in httpOnly cookie by the Worker
  // Read session status from /api/auth/session
}

export async function getCustomerSession() {
  const response = await fetch('/api/auth/session')
  return response.json()
}
```

**Step 3: Implement Cart Merge Flow**

When a customer logs in, merge their anonymous cart (from localStorage) with their customer cart:

```typescript
// src/lib/cart.ts — ADD function (future)

/**
 * Merge anonymous cart into customer account after login.
 * Per Shopify best practices: https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/merge-carts
 */
export async function mergeAnonymousCartIntoCustomer(cartId: string, accessToken: string) {
  // Fetch anonymous cart lines from localStorage
  // Call Customer Account API to get customer's existing cart
  // Merge lines (resolve conflicts by quantity addition)
  // Delete anonymous cart, return merged cart ID
}
```

#### Files to Create (Future)

| File | Purpose |
|------|---------|
| `workers/shopify-proxy.ts` (routes) | Auth endpoints |
| `src/lib/shopify/customer-auth.ts` | Customer auth hooks |
| `src/lib/cart.ts` (merge function) | Cart merge logic |

---

## Deployment Checklist

### Phase 1: Admin API Proxy

- [ ] Create Cloudflare Worker (`workers/shopify-proxy.ts`)
- [ ] Add `SHOPIFY_ADMIN_ACCESS_TOKEN` to Cloudflare Worker environment variables
- [ ] Configure CORS to allow only `https://houseofmornii.com`
- [ ] Deploy Worker and note URL (e.g., `shopify-proxy.houseofmornii.com`)
- [ ] Update `/api/shopify/*` route in Cloudflare Pages to proxy to Worker
- [ ] Update `vite.config.ts` dev proxy for local testing
- [ ] Remove `adminFetch` from `src/lib/shopify/client.ts`
- [ ] Replace all `adminFetch` calls with `adminProxyFetch`
- [ ] Update tests in `src/lib/shopify/client.test.ts`
- [ ] Verify Admin API calls work through proxy
- [ ] **Verify NO Admin token appears in browser DevTools → Network tab**

### Phase 2: SDK-Only Migration

- [ ] Remove `shopifyFetchTokenless()` from `client.ts`
- [ ] Delete `_TOKENLESS` query variants from `queries.ts`
- [ ] Update hooks to remove tokenless branches
- [ ] Change `resolveStorefrontMode()` to return `'demo'` when no token
- [ ] Delete `hooks.tokenless.test.tsx`
- [ ] Update `.env.example` to note token is required (no tokenless fallback)
- [ ] Run full test suite: `npm run test:run`
- [ ] Verify app works in token mode and demo mode

### Phase 3: Error Handling

- [ ] Create `src/lib/shopify/retry.ts`
- [ ] Integrate retry into `shopifyFetchWithSdk()`
- [ ] Add retry config to React Query hooks (staleTime, retry count)
- [ ] Test retry behavior with simulated 503 errors
- [ ] Document retry behavior in `docs/03-shopify-integration.md`

### Phase 4: Customer Account API (Future)

- [ ] Add auth routes to Cloudflare Worker
- [ ] Implement OAuth flow per Shopify docs
- [ ] Create customer auth hooks
- [ ] Implement cart merge flow
- [ ] Add "My Account" page to React Router
- [ ] Update navigation to show "Account" link when logged in

---

## Rollback Plan

If any phase introduces critical issues:

1. **Phase 1 rollback:** Revert `adminFetch` to client-side implementation (temporary)
2. **Phase 2 rollback:** Restore `_TOKENLESS` query variants and `shopifyFetchTokenless()`
3. **Phase 3 rollback:** Remove `withRetry` wrapper, revert to direct SDK calls
4. **Phase 4 rollback:** No risk — new features only

---

## Testing Strategy

### Unit Tests

- [ ] Test `adminProxyFetch` mocks `/api/shopify/admin` endpoint
- [ ] Test `withRetry` retries on 503, doesn't retry on 400
- [ ] Test `resolveStorefrontMode()` returns correct mode for all env combos

### Integration Tests

- [ ] Verify Admin API calls go through proxy (check Network tab in E2E)
- [ ] Verify Storefront SDK is used for all token-mode queries
- [ ] Verify demo mode still works without any Shopify credentials

### Security Tests

- [ ] Confirm Admin token never appears in browser DevTools → Application → Local Storage
- [ ] Confirm Admin token never appears in browser DevTools → Network → Request Headers
- [ ] Confirm CSP blocks unauthorized script injection
- [ ] Confirm CORS headers restrict to allowed origins only

---

## References

- [Shopify Storefront API Docs](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api)
- [Shopify Customer Account API Docs](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Shopify GraphQL API Reference](https://shopify.dev/docs/api/graphql-admin-2026-01)
- [React Query Retry Configuration](https://tanstack.com/query/latest/docs/react/guides/retries)
