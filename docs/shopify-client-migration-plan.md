# Migration Plan: `@shopify/storefront-api-client`

**Status:** Proposed — for production client handoff  
**Target:** Replace custom `fetch`-based client with Shopify's official JS client  
**Risk Level:** Medium (client layer refactor; hooks/types/tests insulated behind adapter)

---

## Why Migrate for Production

| Concern | Current (`fetch`) | Official Client |
|---------|-------------------|-----------------|
| **API version management** | Manual — `2026-01` hardcoded in [`client.ts:8`](src/lib/shopify/client.ts:8). Must be updated every quarter when Shopify releases new API versions. | Automatic — defaults to latest stable; can pin explicitly. No code changes needed for version bumps. |
| **Type safety** | Manual types in [`types.ts`](src/lib/shopify/types.ts). Drift possible if Shopify adds/renames fields. | Shopify-generated from their GraphQL schema. Always up-to-date with API contract. |
| **Error handling** | Custom `StorefrontError` with categories (not_found, misconfigured, upstream_unavailable, query_error, network_error). Good coverage but untested against real error responses. | Standardized `userErrors` / `warnings` arrays on every mutation response. Shopify-maintained error classification. |
| **Support** | Community-supported (your codebase). No Shopify SLA. | Official Shopify library. Bug fixes and new features shipped with API releases. |
| **Customer APIs** | Not currently used, but would require significant custom work for `customerAccessToken` mutations. | Built-in support via `storefront.customerAccessTokenCreate` / `customerAccessTokenExtend`. |
| **Bundle size** | 0 KB extra | ~8 KB minified (gzip ~3 KB) — negligible for a SPA |

### Bottom Line

For a client-facing production app, the **API version management risk is the primary driver**. Shopify releases a new API version every quarter. Without the official client, your team must manually update `API_VERSION` in [`client.ts`](src/lib/shopify/client.ts:8) and verify all queries still compile against the new schema — or risk silent data loss from renamed/removed fields.

---

## Migration Scope

### Files to Modify

| File | Change | Effort |
|------|--------|--------|
| `src/lib/shopify/client.ts` | **Rewrite** — replace `shopifyFetch()` with adapter wrapping `@shopify/storefront-api-client`. Preserve `STOREFRONT_MODE`, `IS_CONFIGURED`, `StorefrontError`, and `validateQueryMode()`. | Medium |
| `src/lib/shopify/queries.ts` | **No change** — GraphQL strings remain identical. They're passed as the `data` property to the new client's `.query()` method. | None |
| `src/lib/shopify/hooks.ts` | **No change** — hooks call `shopifyFetch()` which is replaced internally. Return types unchanged. | None |
| `src/context/CartContext.tsx` | **No change** — calls `shopifyFetch()` for cart mutations. Adapter handles the rest. | None |
| `src/lib/shopify/client.test.ts` | **Update** — mock `@shopify/storefront-api-client` instead of `fetch`. Test structure preserved. | Low |
| `src/lib/shopify/hooks.token.test.tsx` | **No change** — already mocks `shopifyFetch`. | None |
| `src/lib/shopify/hooks.tokenless.test.tsx` | **No change** — same as above. | None |
| `package.json` | Add `@shopify/storefront-api-client` dependency. | Trivial |

### Files NOT Changed

All component files, page files, test utilities, and the demo data layer remain untouched. The migration is **strictly confined to the client layer**.

---

## Architecture After Migration

```
┌─────────────────────────────────────────────┐
│  src/lib/shopify/client.ts                  │
│                                             │
│  STOREFRONT_MODE / IS_CONFIGURED            │ ← unchanged exports
│  StorefrontError class                      │ ← preserved for compatibility
│  validateQueryMode()                        │ ← preserved
│                                             │
│  shopifyFetch() [REWRITTEN]                 │
│    └─ wraps @shopify/storefront-api-client  │ ← new dependency
│       └─ throws StorefrontError (same API)  │ ← same interface
│                                             │
│  Demo guard: still throws if called in      │
│  demo mode — preserves existing behavior.   │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┼──────────┐
         ▼         ▼          ▼
    hooks.ts  CartContext  queries.ts
    (no change) (no change) (no change)
```

The key principle: **`shopifyFetch(query, variables)` signature stays identical**. All callers are insulated from the internal change.

---

## Implementation Steps

### Step 1: Install Dependency

```bash
npm install @shopify/storefront-api-client
```

### Step 2: Rewrite `src/lib/shopify/client.ts`

The new client wraps the Shopify SDK but preserves your existing public API:

```typescript
// NEW implementation (conceptual)
import { ShopAPI } from '@shopify/storefront-api-client'
import { logger, type LogContext } from '@/lib/logger'

const domain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN
const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN

// ... STOREFRONT_MODE, IS_CONFIGURED, placeholder logic unchanged ...

let _client: ShopAPI | null = null

function getClient(): ShopAPI {
  if (!_client) {
    const config: Parameters<ShopAPI['init']>[0] = {
      url: `https://${domain}/api/2026-01/graphql.json`,
      storefrontAccessToken: STOREFRONT_MODE === 'token' ? (token as string) : undefined,
    }
    _client = new ShopAPI().init(config)
  }
  return _client
}

export async function shopifyFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  context?: LogContext,
): Promise<T> {
  if (STOREFRONT_MODE === 'demo') {
    throw new Error(
      'Shopify is not configured. The app should be using demo data.',
    )
  }

  try {
    const response = await getClient().query({
      data: query,
      variables,
    })

    if (response.errors?.length) {
      // Map Shopify errors to your existing StorefrontError categories
      const messages = response.errors.map((e) => e.message).join(', ')
      throw new StorefrontError(
        `Shopify GraphQL errors: ${messages}`,
        'query_error',
        undefined,
        context,
      )
    }

    return (response.data as T) ?? {}
  } catch (error) {
    // Map network/HTTP errors to your existing categories
    if (error instanceof StorefrontError) throw error

    logger.error('Shopify API error', {
      ...context,
      action: 'shopifyFetch',
    })

    throw new StorefrontError(
      'Network request to Shopify API failed',
      'network_error',
      undefined,
      context,
    )
  }
}
```

### Step 3: Update Tests

In [`client.test.ts`](src/lib/shopify/client.test.ts), replace the `fetch` mock with a mock of `@shopify/storefront-api-client`:

```typescript
// NEW test pattern
vi.mock('@shopify/storefront-api-client', () => ({
  ShopAPI: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue({ data: { products: { edges: [] } } }),
  })),
}))
```

All other test assertions remain the same since `StorefrontError` and return types are unchanged.

### Step 4: Verify Build + Tests

```bash
npm run build        # Should succeed with no new warnings
npm run test:run     # All existing tests pass
```

### Step 5: Deploy to Dev Store

With credentials in GitHub Secrets (as documented in [`deployment-runbook.md`](docs/deployment-runbook.md)):

```bash
git add .
git commit -m "chore: migrate to @shopify/storefront-api-client"
git push origin main
```

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking change to `shopifyFetch()` interface | Low — signature preserved exactly | All callers insulated; tests verify contract |
| Bundle size increase causes performance regression | Very low — ~3 KB gzip is negligible | Verify with `npm run build` chunk analysis |
| API version pinning issue | Low — can pin to specific version string | Document version strategy in code comments |
| Test mock incompatibility | Low — `ShopAPI.query()` returns standard shape | Update only `client.test.ts`; other tests unchanged |

---

## Rollback Plan

If issues arise post-deploy:

1. **Quick rollback**: Revert the commit via Cloudflare Pages dashboard (takes ~10 seconds).
2. **Code rollback**: `git revert <commit>` — the dependency is the only change; removing it restores the previous state.

---

## Timeline Estimate

| Step | Effort |
|------|--------|
| Install dependency + rewrite client.ts | 1-2 hours |
| Update client.test.ts mocks | 30 min |
| Run full test suite + build verification | 15 min |
| Deploy to dev store + manual QA | 30 min |
| **Total** | **~2.5 hours** |

---

## Decision Point

**Recommendation: Migrate before client handoff.** The API version management risk alone justifies the change for a production app. The migration is low-risk (adapter pattern, same interface) and can be completed in a single session.

If you need to ship faster, you can deploy with the current `fetch`-based client and migrate as a follow-up — but document the quarterly API version update task explicitly for your client's maintenance team.

---

*See also:*
- [`docs/deployment-runbook.md`](docs/deployment-runbook.md) — CI/CD setup
- [`docs/cloudflare-pages-ci-strategy.md`](docs/cloudflare-pages-ci-strategy.md) — GitHub Actions workflow
- [`docs/api-version-update-process.md`](docs/api-version-update-process.md) — current API version management process
- [`src/lib/shopify/client.ts`](src/lib/shopify/client.ts) — current implementation
