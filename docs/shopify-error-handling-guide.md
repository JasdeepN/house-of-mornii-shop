# Shopify Error Handling Guide

This document describes the `StorefrontError` class, its typed error categories, and how page components use them to render appropriate user-facing states.

## StorefrontError Class

`src/lib/shopify/client.ts` exports a typed error class for all Shopify API failures:

```ts
export class StorefrontError extends Error {
  readonly category: StorefrontErrorCategory
  readonly statusCode?: number
}
```

`shopifyFetch` throws `StorefrontError` for:
- Non-2xx HTTP responses
- GraphQL responses that contain an `errors` array

Standard `Error` (not `StorefrontError`) is only thrown when `shopifyFetch` is called in demo mode — which should never happen in practice since hooks gate on `IS_CONFIGURED`.

## Error Categories

```ts
export type StorefrontErrorCategory =
  | 'not_found'
  | 'misconfigured'
  | 'upstream_unavailable'
  | 'query_error'
```

| Category | HTTP status / condition | Cause | Retryable? |
|----------|------------------------|-------|-----------|
| `not_found` | HTTP 404 or GraphQL `NOT_FOUND` extension code | Product or collection handle does not exist on Shopify | No |
| `misconfigured` | HTTP 401 or 403 | Storefront token is invalid, revoked, or channel not enabled | No — requires credential fix |
| `upstream_unavailable` | HTTP 5xx or network failure | Shopify service outage or transient network error | Yes |
| `query_error` | GraphQL `errors[]` with no `NOT_FOUND` code | Malformed query, out-of-scope field, permission denied at query level | Depends — likely a schema mismatch |

## Page Error Handling Pattern

All data pages (ProductPage, CollectionPage, ShopPage) follow the same pattern:

```tsx
import { StorefrontError } from '@/lib/shopify'

// Inside the component, after the useProduct / useCollection / useProducts hook:
if (error) {
  const isServiceError =
    error instanceof StorefrontError &&
    (error.category === 'upstream_unavailable' || error.category === 'misconfigured')

  if (isServiceError) {
    // Retryable — show "Service Unavailable" + reload button
  } else {
    // Not retryable — show "Not Found" + browse link
  }
}

if (!data) {
  // Confirmed null from Shopify — resource exists in URL but not in store
  // Show "Not Found"
}
```

### Error States by Page

**ProductPage (`src/pages/ProductPage.tsx`)**

| Condition | Rendered state |
|-----------|---------------|
| `isServiceError` | "Service Unavailable" heading + "TRY AGAIN" reload button |
| Any other error | "Product Not Found" heading + link to `/collections` |
| `!product` (null from API) | "Product Not Found" heading + link to `/collections` |

**CollectionPage (`src/pages/CollectionPage.tsx`)**

| Condition | Rendered state |
|-----------|---------------|
| `isServiceError` | "Service Unavailable" heading + "TRY AGAIN" reload button |
| Any other error | "Collection Not Found" heading + link to `/collections` |
| `!collection` (null from API) | "Collection Not Found" heading + link to `/collections` |

**ShopPage (`src/pages/ShopPage.tsx`)**

| Condition | Rendered state |
|-----------|---------------|
| `isServiceError` on products or collections | "Service currently unavailable" banner above product grid |
| No products + no error | Empty state with "no products found" copy |

## Writing New Error Handlers

When adding a new data-fetching page or component that calls `shopifyFetch` (directly or via a hook):

1. Destructure `error` from the hook:
   ```ts
   const { data, isLoading, error } = useMyHook(handle)
   ```

2. Check `isLoading` first to avoid flashing error states.

3. Handle `error` before the `!data` check — they are different conditions:
   - `error` — the fetch threw (network issue, bad credentials, API down)
   - `!data` — the fetch succeeded but returned `null` (resource not found on Shopify)

4. Use the `isServiceError` pattern for retryable vs non-retryable distinction. Do not render a generic catch-all — each branch should result in actionable copy.

5. For retryable errors, call `window.location.reload()` or invalidate the TanStack Query cache:
   ```ts
   import { useQueryClient } from '@tanstack/react-query'
   const queryClient = useQueryClient()
   queryClient.invalidateQueries({ queryKey: ['my-key'] })
   ```

## Demo Mode

`StorefrontError` is never thrown in demo mode. The hooks return fixture data directly via `getDemoX()` functions without going through `shopifyFetch`. No error handling code path is exercised in demo mode.

To test retryable error UI locally, temporarily modify a hook to `throw new StorefrontError('test', 'upstream_unavailable')`.

## Test Coverage

Error category behavior is covered in `src/lib/shopify/client.test.ts`:
- `misconfigured` on 401/403
- `upstream_unavailable` on 5xx
- `query_error` on GraphQL errors array
- `not_found` on HTTP 404 and GraphQL `NOT_FOUND` extension

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/shopify/client.ts` | `StorefrontError`, `StorefrontErrorCategory`, classification logic in `shopifyFetch` |
| `src/lib/shopify/client.test.ts` | Error category unit tests |
| `src/pages/ProductPage.tsx` | `isServiceError` pattern reference implementation |
| `src/pages/CollectionPage.tsx` | Same pattern, collection context |
| `src/pages/ShopPage.tsx` | Service error banner on catalog-level failure |
