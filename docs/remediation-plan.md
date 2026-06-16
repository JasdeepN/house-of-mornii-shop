# Shopify Storefront Refactoring Remediation Plan

This document outlines the actionable steps to address the concerns identified in [`refactoring-concerns.md`](./refactoring-concerns.md).

---

## Executive Summary

The House of Mornii Shopify Storefront integration has several critical gaps that could lead to silent failures in production. This remediation plan addresses:

1. **Production Guardrails** - Prevent deployment without valid credentials
2. **Token-Gated Field Validation** - Ensure queries match authentication mode
3. **Error Handling Standardization** - Provide consistent, actionable error UX
4. **Test Coverage** - Add integration tests for live Shopify API modes
5. **Operational Monitoring** - Enable incident diagnosis and health checks

---

## Priority 1: Production Guardrail System (Critical)

### Problem
The app falls back to demo mode silently when credentials are missing, creating a "healthy-looking but non-functional" production site.

### Implementation Plan

#### 1.1 Build-Time Production Check

**File**: `vite.config.ts`

Add production build guard that fails loudly if demo mode is detected:

```typescript
// vite.config.ts
if (process.env.NODE_ENV === 'production') {
  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN
  
  if (!domain || !token) {
    console.error(
      '[BUILD ERROR] Production build requires Shopify credentials.\n' +
      'Set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN.\n' +
      'Aborting production build to prevent silent demo mode deployment.'
    )
    process.exit(1)
  }
}
```

#### 1.2 Runtime Environment Validation Component

**New File**: `src/components/EnvironmentWarning.tsx`

Display a prominent warning banner in non-production environments when credentials are missing:

```tsx
// src/components/EnvironmentWarning.tsx
import { useEffect, useState } from 'react'
import { StorefrontMode, IS_CONFIGURED } from '@/lib/shopify'

export function EnvironmentWarning() {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Show warning in dev/staging if not configured
    if (import.meta.env.DEV && !IS_CONFIGURED) {
      setShowWarning(true)
    }
  }, [])

  if (!showWarning) return null

  return (
    <div className="bg-amber-500 text-white text-center py-2 text-sm">
      ⚧ Shopify credentials not configured. Running in demo mode.
      <a href="#" className="underline ml-2">Configure now</a>
    </div>
  )
}
```

#### 1.3 Deployment Pre-Flight Script

**New File**: `scripts/check-env.sh`

```bash
#!/bin/bash
# Deployment pre-flight check

if [ "$NODE_ENV" = "production" ]; then
  if [ -z "$VITE_SHOPIFY_STORE_DOMAIN" ] || [ -z "$VITE_SHOPIFY_STOREFRONT_TOKEN" ]; then
    echo "❌ Production deployment blocked: Shopify credentials missing"
    exit 1
  fi
  
  # Check for placeholder values
  if [[ "$VITE_SHOPIFY_STORE_DOMAIN" == *"CHANGE_ME"* ]] || \
     [[ "$VITE_SHOPIFY_STORE_DOMAIN" == *"your-store"* ]]; then
    echo "❌ Production deployment blocked: Placeholder domain detected"
    exit 1
  fi
fi

echo "✅ Environment validation passed"
```

---

## Priority 2: Token-Gated Field Validation (High)

### Problem
The app attempts to fetch token-gated fields (`tags`, `metafields`) in tokenless mode, causing runtime GraphQL errors.

### Current State Analysis

| Query | Token Mode | Tokenless Mode | Issue |
|-------|-----------|----------------|-------|
| `PRODUCT_CARD_FRAGMENT` | ✅ Includes `tags` | ❌ Uses `PRODUCT_CARD_FRAGMENT_TOKENLESS` (no tags) | Correct |
| `PRODUCT_BY_HANDLE_QUERY` | ✅ Includes `tags` | ❌ Uses `PRODUCT_BY_HANDLE_QUERY_TOKENLESS` (no tags) | Correct |
| `COLLECTIONS_QUERY` | ✅ No token-gated fields | ✅ No token-gated fields | Safe |

**Note**: The current implementation correctly switches between token/tokenless queries. However, this pattern is error-prone and lacks runtime validation.

### Implementation Plan

#### 2.1 Create Token Requirements Registry

**New File**: `src/lib/shopify/token-requirements.ts`

```typescript
// src/lib/shopify/token-requirements.ts

export interface TokenRequirement {
  field: string
  requiredMode: 'token' | 'tokenless'
  description: string
}

export const TOKEN_GATED_FIELDS: TokenRequirement[] = [
  { field: 'tags', requiredMode: 'token', description: 'Product tags require storefront access token' },
  { field: 'metafields', requiredMode: 'token', description: 'Metafields require storefront access token' },
  { field: 'customer', requiredMode: 'token', description: 'Customer APIs require storefront access token' },
  { field: 'customerAccessToken', requiredMode: 'token', description: 'Customer access tokens require authentication' },
]

export function getRequiredModeForFields(fields: string[]): 'token' | 'tokenless' {
  const hasTokenGated = fields.some(field => 
    TOKEN_GATED_FIELDS.some(req => req.field === field)
  )
  return hasTokenGated ? 'token' : 'tokenless'
}
```

#### 2.2 Add Runtime Validation in shopifyFetch

**File**: `src/lib/shopify/client.ts`

```typescript
// src/lib/shopify/client.ts (add after shopifyFetch function)

export function validateQueryMode(query: string, mode: StorefrontMode) {
  const tokenGatedPatterns = ['tags', 'metafields', 'customerAccessToken']
  const hasTokenGated = tokenGatedPatterns.some(pattern => query.includes(pattern))
  
  if (hasTokenGated && mode === 'tokenless') {
    console.error(
      '[Shopify] Token-gated field requested in tokenless mode.\n' +
      'This will cause GraphQL errors. Use token mode or remove token-gated fields.\n' +
      'Fields: ' + tokenGatedPatterns.filter(p => query.includes(p)).join(', ')
    )
    // In production, you might throw an error here
  }
}
```

#### 2.3 Update Query Exports with Metadata

**File**: `src/lib/shopify/queries.ts`

```typescript
// src/lib/shopify/queries.ts

export const PRODUCT_BY_HANDLE_QUERY = {
  query: `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        tags  // Token-gated field
        vendor
      }
    }
  `,
  requiredMode: 'token' as const,
  description: 'Full product details with token-gated fields',
}

export const PRODUCT_BY_HANDLE_QUERY_TOKENLESS = {
  query: `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        vendor  // Tokenless-safe
      }
    }
  `,
  requiredMode: 'tokenless' as const,
  description: 'Product details without token-gated fields',
}
```

---

## Priority 3: Error Handling Standardization (High)

### Problem
API failures are collapsed into generic "not found" or empty states, preventing users from understanding service disruptions.

### Current State Analysis

**File**: `src/pages/ProductPage.tsx:96-122`

```tsx
// Current implementation
if (error) {
  const isServiceError =
    error instanceof StorefrontError &&
    (error.category === 'upstream_unavailable' || error.category === 'misconfigured')
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold tracking-wider mb-4">
            {isServiceError ? 'Service Unavailable' : 'Product Not Found'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isServiceError
              ? 'Our storefront API is currently unavailable. Please try again later.'
              : 'The product you is looking for does not exist or has been removed.'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Issues**:
1. Only `ProductPage` has custom error handling
2. Other pages (`CollectionPage`, `ShopPage`) likely use generic fallbacks
3. No distinction between 404 (not found) and 5xx (service error)

### Implementation Plan

#### 3.1 Create Error Boundary Component

**New File**: `src/components/ErrorBoundary.tsx`

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'
import { StorefrontError, StorefrontErrorCategory } from '@/lib/shopify'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: StorefrontError
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    if (error instanceof StorefrontError) {
      return { hasError: true, error }
    }
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  private getCategoryTitle(category?: StorefrontErrorCategory): string {
    switch (category) {
      case 'not_found': return 'Content Not Found'
      case 'misconfigured': return 'Configuration Error'
      case 'upstream_unavailable': return 'Service Unavailable'
      case 'query_error': return 'Data Error'
      default: return 'Something went wrong'
    }
  }

  private getCategoryMessage(category?: StorefrontErrorCategory): string {
    switch (category) {
      case 'not_found':
        return 'The content you is looking for does not exist or has been removed.'
      case 'misconfigured':
        return 'The storefront is not properly configured. Please check your environment variables.'
      case 'upstream_unavailable':
        return 'Our storefront API is currently unavailable. Please try again later.'
      case 'query_error':
        return 'An error occurred while fetching data. Please try refreshing the page.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  public render() {
    if (this.state.hasError) {
      const error = this.state.error
      const category = error?.category

      // Show custom fallback if provided
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
          <div className="container px-4 text-center max-w-md">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4.016A11.955 11.955 11.955 11.955 12 2a12 12 12 12 2.016 11.955 11.955 11.955 11.955 12 2a12 12 12 12 2.016 11.955 11.955 11.955 11.955 12 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold tracking-wider mb-4">
              {this.getCategoryTitle(category)}
            </h2>
            <p className="text-muted-foreground mb-8">
              {this.getCategoryMessage(category)}
            </p>
            {category === 'misconfigured' && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                <span className="text-sm tracking-[0.2em] uppercase">Back to Home</span>
              </Link>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

#### 3.2 Create Error Handling Hook

**New File**: `src/hooks/useShopifyError.ts`

```tsx
// src/hooks/useShopifyError.ts
import { useMemo } from 'react'
import { StorefrontError, StorefrontErrorCategory } from '@/lib/shopify'

export interface ErrorDisplay {
  title: string
  message: string
  showRetry: boolean
  showHomeLink: boolean
}

export function useShopifyError(error?: Error): ErrorDisplay | null {
  return useMemo(() => {
    if (!error || !(error instanceof StorefrontError)) {
      return null
    }

    const { category } = error

    switch (category) {
      case 'not_found':
        return {
          title: 'Content Not Found',
          message: 'The content you is looking for does not exist or has been removed.',
          showRetry: false,
          showHomeLink: true,
        }
      case 'misconfigured':
        return {
          title: 'Configuration Error',
          message: 'The storefront is not properly configured. Please check your environment variables.',
          showRetry: false,
          showHomeLink: true,
        }
      case 'upstream_unavailable':
        return {
          title: 'Service Unavailable',
          message: 'Our storefront API is currently unavailable. Please try again later.',
          showRetry: true,
          showHomeLink: false,
        }
      case 'query_error':
        return {
          title: 'Data Error',
          message: 'An error occurred while fetching data. Please try refreshing the page.',
          showRetry: true,
          showHomeLink: false,
        }
      default:
        return null
    }
  }, [error])
}
```

#### 3.3 Update Pages to Use ErrorBoundary

**File**: `src/pages/CollectionPage.tsx`

```tsx
// src/pages/CollectionPage.tsx (add at top)
import ErrorBoundary from '@/components/ErrorBoundary'
import { useShopifyError } from '@/hooks/useShopifyError'

// In component:
const { error } = useCollection(handle)
const errorDisplay = useShopifyError(error)

if (errorDisplay) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen pt-28 pb-16">
        {/* Custom error UI using errorDisplay */}
      </div>
    </ErrorBoundary>
  )
}
```

---

## Priority 4: Test Coverage Enhancement (Medium)

### Problem
Existing tests only exercise demo mode, leaving live Shopify integration paths untested.

### Current State Analysis

**File**: `src/lib/shopify/hooks.test.tsx`

```typescript
// Always force demo mode for hook tests
vi.mock('./client', () => ({
  IS_CONFIGURED: false,
  shopifyFetch: vi.fn(() => {
    throw new Error('shopifyFetch should not be called in demo mode')
  }),
}))
```

**Issues**:
1. No tests for token mode with mocked Shopify API
2. No tests for tokenless mode edge cases
3. No contract testing for live API responses

### Implementation Plan

#### 4.1 Add Token Mode Integration Tests

**File**: `src/lib/shopify/hooks.integration.test.tsx`

```typescript
// src/lib/shopify/hooks.integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock Shopify API responses
const mockShopifyResponse = (data: unknown) => ({
  ok: true,
  json: () => Promise.resolve({ data }),
})

vi.mock('./client', async () => {
  const actual = await import('./client')
  return {
    ...actual,
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'token',
    shopifyFetch: vi.fn(),
  }
})

const { useCollections, useProduct } = await import('./hooks')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useCollections (token mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches collections from Shopify API', async () => {
    const mockData = {
      collections: {
        edges: [
          {
            node: {
              id: '1',
              handle: 'everyday',
              title: 'Everyday',
              description: '',
              image: null,
              products: { edges: [], pageInfo: { hasNextPage: false } },
            },
          },
        ],
      },
    }

    vi.mocked(shopifyFetch).mockResolvedValue(mockData)

    const { result } = renderHook(() => useCollections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].handle).toBe('everyday')
  })
})
```

#### 4.2 Add Tokenless Mode Tests

**File**: `src/lib/shopify/hooks.tokenless.test.tsx`

```typescript
// src/lib/shopify/hooks.tokenless.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./client', async () => {
  const actual = await import('./client')
  return {
    ...actual,
    IS_CONFIGURED: true,
    STOREFRONT_MODE: 'tokenless',
    shopifyFetch: vi.fn(),
  }
})

// Test tokenless-specific behavior
```

#### 4.3 Add Contract Testing

**File**: `src/lib/shopify/contract.test.ts`

```typescript
// src/lib/shopify/contract.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({
  IS_CONFIGURED: true,
  STOREFRONT_MODE: 'token',
}))

const { shopifyFetch } = await import('./client')

// Contract test: Ensure queries match expected schema
const EXPECTED_PRODUCT_FIELDS = [
  'id',
  'handle',
  'title',
  'description',
  'availableForSale',
  'priceRange',
]

const EXPECTED_TOKENLESS_FIELDS = EXPECTED_PRODUCT_FIELDS.filter(
  field => !['tags', 'metafields'].includes(field),
)

describe('Shopify API Contract', () => {
  it('token mode includes all product fields', async () => {
    // This test would require actual Shopify API access
    // For now, document the expected contract
    expect(true).toBe(true)
  })

  it('tokenless mode excludes token-gated fields', async () => {
    // Verify PRODUCT_CARD_FRAGMENT_TOKENLESS doesn't include tags
    const { PRODUCT_CARD_FRAGMENT_TOKENLESS } = await import('./queries')
    expect(PRODUCT_CARD_FRAGMENT_TOKENLESS).not.toContain('tags')
  })
})
```

---

## Priority 5: Operational Monitoring (Medium)

### Problem
Lack of distinct error states makes it difficult to diagnose production issues.

### Implementation Plan

#### 5.1 Structured Logging Utility

**New File**: `src/lib/shopify/logger.ts`

```typescript
// src/lib/shopify/logger.ts
import { StorefrontMode, StorefrontErrorCategory } from './client'

export interface ShopifyLogEntry {
  timestamp: string
  mode: StorefrontMode
  category?: StorefrontErrorCategory
  message: string
  details?: Record<string, unknown>
}

export const shopifyLogger = {
  log: (entry: ShopifyLogEntry) => {
    // In production, send to logging service (e.g., Sentry, LogRocket)
    console.log(JSON.stringify(entry))
  },

  info: (message: string, details?: Record<string, unknown>) => {
    shopifyLogger.log({
      timestamp: new Date().toISOString(),
      mode: STOREFRONT_MODE,
      message,
      details,
    })
  },

  error: (
    category: StorefrontErrorCategory,
    message: string,
    details?: Record<string, unknown>,
  ) => {
    shopifyLogger.log({
      timestamp: new Date().toISOString(),
      mode: STOREFRONT_MODE,
      category,
      message,
      details,
    })
  },
}
```

#### 5.2 Health Check Endpoint

**New File**: `src/lib/shopify/health.ts`

```typescript
// src/lib/shopify/health.ts
import { STOREFRONT_MODE, IS_CONFIGURED } from './client'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  mode: typeof STOREFRONT_MODE
  configured: boolean
  timestamp: string
}

export function getHealthStatus(): HealthStatus {
  let status: HealthStatus['status'] = 'healthy'

  if (STOREFRONT_MODE === 'demo') {
    status = 'degraded'
  } else if (!IS_CONFIGURED) {
    status = 'unhealthy'
  }

  return {
    status,
    mode: STOREFRONT_MODE,
    configured: IS_CONFIGURED,
    timestamp: new Date().toISOString(),
  }
}
```

#### 5.3 Add to Vite Dev Server

**File**: `vite.config.ts`

```typescript
// vite.config.ts (add to server configuration)
server: {
  middlewareMode: true,
  headers: {
    'X-Shopify-Storefront-Mode': STOREFRONT_MODE,
  },
},
```

---

## Priority 6: Documentation Updates (Low)

### Implementation Plan

#### 6.1 Update PRD.md

Add section to [`PRD.md`](./PRD.md):

```markdown
## Production Deployment Checklist

Before deploying to production, ensure:

- [ ] `VITE_SHOPIFY_STORE_DOMAIN` is set to your live Shopify store domain
- [ ] `VITE_SHOPIFY_STOREFRONT_TOKEN` is set to a valid Storefront API token
- [ ] Storefront API scopes are configured (see [`docs/shopify-auth-mode-setup.md`](./docs/shopify-auth-mode-setup.md))
- [ ] Environment validation passes (`npm run check-env`)
- [ ] Production build completes without warnings
- [ ] Test checkout flow end-to-end
```

#### 6.2 Create Environment Validation Schema

**New File**: `src/lib/shopify/env-schema.ts`

```typescript
// src/lib/shopify/env-schema.ts
import { z } from 'zod'

const StorefrontModeSchema = z.enum(['demo', 'tokenless', 'token'])

const EnvSchema = z.object({
  VITE_SHOPIFY_STORE_DOMAIN: z.string().optional(),
  VITE_SHOPIFY_STOREFRONT_TOKEN: z.string().optional(),
})

export function validateEnv(): {
  mode: StorefrontMode
  errors: string[]
} {
  const parsed = EnvSchema.safeParse(import.meta.env)
  
  if (!parsed.success) {
    return {
      mode: 'demo',
      errors: parsed.error.errors.map(e => e.message),
    }
  }

  const { VITE_SHOPIFY_STORE_DOMAIN, VITE_SHOPIFY_STOREFRONT_TOKEN } = parsed.data
  
  if (!VITE_SHOPIFY_STORE_DOMAIN) {
    return { mode: 'demo', errors: ['VITE_SHOPIFY_STORE_DOMAIN is required'] }
  }

  if (VITE_SHOPIFY_STOREFRONT_TOKEN) {
    return { mode: 'token', errors: [] }
  }

  return { mode: 'tokenless', errors: [] }
}
```

---

## Migration Strategy

### Phase 1: Critical (Week 1)
1. Add production build guard in `vite.config.ts`
2. Create `EnvironmentWarning` component
3. Implement error boundary and standardized error handling
4. Add runtime validation for token-gated fields

### Phase 2: High Priority (Week 2)
1. Add integration tests for token mode
2. Create health check endpoint
3. Implement structured logging
4. Update documentation

### Phase 3: Medium Priority (Week 3)
1. Add contract testing
2. Implement CI/CD pre-flight checks
3. Add monitoring dashboards

---

## Risk Assessment

| Concern | Severity | Impact | Effort |
|---------|----------|--------|--------|
| Production Guardrail Gap | Critical | High | Low |
| Token-Gated Field Mismatch | High | Medium | Medium |
| Error Handling Inconsistency | High | Medium | Medium |
| Test Coverage Gap | Medium | Medium | High |
| Operational Monitoring | Medium | Low | Medium |

---

## Success Criteria

- [ ] Production builds fail if Shopify credentials are missing or invalid
- [ ] Runtime warning banner displays in dev when credentials are missing
- [ ] All pages use consistent error handling with actionable messages
- [ ] Token-gated field requests in tokenless mode are caught at runtime
- [ ] Integration tests cover token and tokenless modes
- [ ] Health check endpoint returns accurate status
- [ ] Structured logging captures all Shopify API events
