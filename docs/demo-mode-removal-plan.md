# Demo Mode Removal Plan

> Checklist
> - [ ] Collapse `StorefrontMode` to token-only in `client.ts`
> - [ ] Reconcile `env-schema.ts` (remove `'demo'` returns)
> - [ ] Simplify `main.tsx` production guard
> - [ ] Repurpose `demo-data.ts` as test-only fixtures (`test-fixtures.ts`)
> - [ ] Remove demo branches from hooks, contexts, pages
> - [ ] Delete `EnvironmentWarning` demo path
> - [ ] Update health/monitoring types
> - [ ] Rewrite tests to mock `shopifyFetch` instead of `IS_CONFIGURED: false`
> - [ ] Update docs
> - [ ] Run `npm run test:run`, `npm run lint`, `npm run build`

## Overview

Demo mode is already unreachable at runtime — [`resolveStorefrontMode()`](../src/lib/shopify/client.ts:24) *throws* when the store domain or Storefront token is missing, so the app never actually returns `'demo'`. The `'demo'` value survives only as a dead TypeScript union member, dead conditional branches, and test scaffolding. This plan removes demo mode entirely, leaving a single `token` mode that serves all three real environments (local dev, UAT via Shopify dev store, and production live store), each configured purely through `.env` credentials.

## Objectives

1. Remove the `'demo'` `StorefrontMode` and all runtime branches that depend on it.
2. Reconcile the contradiction between [`env-schema.ts`](../src/lib/shopify/env-schema.ts) (returns `'demo'`) and [`client.ts`](../src/lib/shopify/client.ts) (throws instead).
3. Preserve product/collection/cart **fixtures** for unit tests by repurposing `demo-data.ts` as an explicitly test-only fixtures module — no runtime import path.
4. Rewrite tests that currently exercise demo branches to instead mock `shopifyFetch` responses (token mode).
5. Keep local/UAT/prod driven entirely by `.env` credentials pointing at real Shopify stores.
6. Ensure `npm run test:run`, `npm run lint`, and `npm run build` all pass.

## Key Decisions

- **`demo-data.ts` → test fixtures, not deleted.** The fixture objects are useful, correctly-shaped `ShopifyProduct`/`ShopifyCollection` data for unit tests. Rather than inline them into every test, rename/relocate to `src/test/fixtures/shopify-fixtures.ts` and import only from `*.test.tsx` files. This removes it from the production barrel ([`index.ts`](../src/lib/shopify/index.ts:5)) while retaining test value.
- **Single mode type.** `StorefrontMode` collapses from `'demo' | 'token'` to just `'token'`. `IS_CONFIGURED` becomes a constant `true` (kept as an exported symbol for now to minimize churn, then optionally removed).
- **`validateQueryMode` demo branch** ([`client.ts`](../src/lib/shopify/client.ts:159)) is removed; the function becomes a no-op or is deleted with its call sites.

## Steps

1. **`src/lib/shopify/client.ts`** — change `StorefrontMode` to `'token'`; simplify `resolveStorefrontMode()` to return `'token'` after the existing throw-guards; make `IS_CONFIGURED = true`; drop the `demo` branch in [`shopifyFetch`](../src/lib/shopify/client.ts:108) and the demo branch in [`validateQueryMode`](../src/lib/shopify/client.ts:159).
2. **`src/lib/shopify/env-schema.ts`** — remove all `mode: 'demo'` returns; on missing domain/token return an `errors` array with `mode: 'token'` (the throw already happens upstream in `client.ts`, so `validateEnv` should reflect that or be simplified to validation-only).
3. **`src/main.tsx`** — remove the `STOREFRONT_MODE === 'demo'` production guard block ([lines 17–28](../src/main.tsx:17)); the startup throw in `client.ts` already enforces credentials. Drop the now-unused `STOREFRONT_MODE` import.
4. **`src/lib/shopify/index.ts`** — remove the `getDemoCollections/getDemoCollection/getDemoProduct/getDemoProducts` re-exports ([lines 5–10](../src/lib/shopify/index.ts:5)).
5. **`src/lib/shopify/hooks.ts`** — remove the `if (!IS_CONFIGURED) return getDemo…()` early-returns in all four hooks (collections, collection, product, products) and the `demo-data` import.
6. **`src/context/CartContext.tsx`** — remove `!IS_CONFIGURED` guards and the in-memory demo cart branches; remove the `demo-data` import. Cart always talks to Shopify.
7. **`src/context/CustomerAuthContext.tsx`** — remove every `if (!IS_CONFIGURED)` early return and the "Demo mode: … disabled" toasts (`login`, `register`, `logout`, `initiatePasswordRecovery`, `resetPassword`, `updateProfile`, address methods).
8. **`src/pages/ShopPage.tsx`** and **`src/pages/CollectionPage.tsx`** — remove `!IS_CONFIGURED` demo branches and `getDemoProducts/getDemoCollection` usage.
9. **`src/components/EnvironmentWarning.tsx`** — the demo-mode banner no longer has a trigger. Either delete the component (and its export in `index.ts` line 33 + any render site) or repurpose it. **Recommended: delete** it and its `index.ts` export, since token mode is guaranteed.
10. **`src/lib/shopify/health.ts`** and **`src/lib/monitoring.ts`** — drop `demo` from the `mode` type/handling; health `status` for demo (`'degraded'`) branch removed.
11. **`src/pages/HealthPage.tsx`** — `mode` type narrows to `'token'`; no logic change beyond type.
12. **Create `src/test/fixtures/shopify-fixtures.ts`** — move fixture data + `getDemoProducts`-style helpers here (renamed, e.g. `getFixtureProducts`). Delete `src/lib/shopify/demo-data.ts` and `src/lib/shopify/demo-data.test.ts` (or relocate the fixture test).
13. **Rewrite affected tests** to mock token mode:
    - Change `vi.mock('@/lib/shopify/client', () => ({ IS_CONFIGURED: false … }))` to `IS_CONFIGURED: true, STOREFRONT_MODE: 'token'` and provide `shopifyFetch` mock return values from the new fixtures.
    - Files: [`CartContext.test.tsx`](../src/context/CartContext.test.tsx), [`CustomerAuthContext.test.tsx`](../src/context/CustomerAuthContext.test.tsx), [`hooks.test.tsx`](../src/lib/shopify/hooks.test.tsx), [`Header.test.tsx`](../src/components/Header.test.tsx), [`ShopPage.test.tsx`](../src/pages/ShopPage.test.tsx), [`CollectionPage.test.tsx`](../src/pages/CollectionPage.test.tsx), [`CartFlyout.test.tsx`](../src/components/CartFlyout.test.tsx), [`phase1-bugfixes.test.tsx`](../src/test/phase1-bugfixes.test.tsx), [`client.test.ts`](../src/lib/shopify/client.test.ts).
    - Update [`src/test/setup.ts`](../src/test/setup.ts) if it stubs env vars to empty strings (which would now trigger the startup throw) — stub to valid dummy domain/token instead.
14. **Docs** — update [`shopify-auth-mode-setup.md`](shopify-auth-mode-setup.md), [`demo-mode-developer-guide.md`](demo-mode-developer-guide.md) (deprecate/remove), [`03-shopify-integration.md`](03-shopify-integration.md), and AGENTS.md / `.roo/rules-architect/AGENTS.md` references to the three-mode system.
15. **Verify** — run `npm run test:run`, `npm run lint`, `npm run build`.

## File Changes

### Modified
- `src/lib/shopify/client.ts` — collapse mode type, remove demo branches
- `src/lib/shopify/env-schema.ts` — remove `'demo'` returns
- `src/lib/shopify/index.ts` — drop demo-data + (likely) EnvironmentWarning exports
- `src/lib/shopify/hooks.ts` — remove demo early-returns
- `src/context/CartContext.tsx` — remove demo cart branches
- `src/context/CustomerAuthContext.tsx` — remove demo guards/toasts
- `src/pages/ShopPage.tsx`, `src/pages/CollectionPage.tsx` — remove demo branches
- `src/lib/shopify/health.ts`, `src/lib/monitoring.ts`, `src/pages/HealthPage.tsx` — narrow `mode` type
- `src/main.tsx` — remove production demo guard
- `src/test/setup.ts` — stub valid dummy credentials
- All test files listed in Step 13
- Docs listed in Step 14

### Created
- `src/test/fixtures/shopify-fixtures.ts` — relocated test fixtures

### Deleted
- `src/lib/shopify/demo-data.ts`
- `src/lib/shopify/demo-data.test.ts` (or relocated)
- `src/components/EnvironmentWarning.tsx` (recommended)
- `docs/demo-mode-developer-guide.md` (or marked deprecated)

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Test suite breaks broadly because many tests rely on `IS_CONFIGURED: false` demo data | High | Rewrite tests to mock `shopifyFetch` with fixtures in the same PR; run `npm run test:run` before completion |
| `src/test/setup.ts` stubs empty env vars → new startup throw crashes all tests | High | Update setup to stub valid dummy `VITE_SHOPIFY_STORE_DOMAIN`/`_TOKEN` |
| Local dev now *requires* real dev-store credentials (no offline fallback) | Medium | Document in README that `.env.local` must point at the Shopify dev store; this is the intended workflow |
| Hidden runtime consumers of removed `getDemo*` exports | Medium | `search_files` sweep for each removed symbol before deleting; barrel export removal will surface compile errors |
| `EnvironmentWarning` rendered somewhere in the tree | Low | Grep for `<EnvironmentWarning` render sites and remove before deleting the file |

## Implementation Order

Types/client first (surfaces all compile errors), then non-test runtime files, then delete/relocate fixtures, then rewrite tests, then docs, then verification build.
