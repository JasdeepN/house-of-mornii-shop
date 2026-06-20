# Architecture Review: Shopify Storefront Status

## Review Scope

- Target: Overall readiness of the current React storefront as a production Shopify storefront
- Requested outcome: Identify the most critical architectural flaws in the app's current Shopify storefront implementation and recommend the most defensible next steps
- Included areas: Runtime bootstrapping, Shopify client/auth assumptions, catalog queries, cart and checkout flow, demo/live mode switching, storefront pages, tests, and build validation signals
- Excluded areas: Admin back office, non-storefront Plane tickets outside visible search results, broader visual design critique unless it affects storefront correctness
- Review date: 2026-04-10
- Revalidated against current code and docs: 2026-04-14
- Reviewer: GitHub Copilot

## Executive Summary

The storefront is structurally close to a working headless Shopify frontend, but it is not yet defensible as a production Shopify storefront. The main risk is not that the app lacks pages or commerce primitives; those exist. The main risk is that the implementation blurs three very different states, demo, misconfigured live mode, and real live mode, in ways that can either break the catalog outright or make a broken deployment appear healthy. The most severe defect is that the client treats the Storefront token as optional while the core product queries request token-gated fields such as `tags`, which means a domain-only deployment can enter live mode and then fail on catalog requests. The second critical issue is operational: when credentials are missing, the app silently renders a fully functional-looking demo storefront with placeholder data and a dead `#` checkout URL instead of failing closed or presenting an explicit demo gate. Error handling on buyer-facing pages further obscures live incidents by rendering API failures as empty states or "not found" content. Finally, the real buyer journey is largely unproven because automated coverage overwhelmingly forces demo mode and there are no browser-level storefront tests.

The system is therefore best described as a polished storefront prototype with partial Shopify wiring, not as a release-ready Shopify storefront. A 2026-04-14 revalidation against the current code and Shopify docs did not change that conclusion; it mainly tightened the authentication and test-coverage wording below. The most defensible next move is not a rewrite. It is a short hardening phase that makes live mode explicit, aligns query shapes with the supported auth mode, distinguishes real Shopify failures from missing content, and adds one end-to-end smoke path against a real development store.

## Revalidation Update

- Conclusion unchanged: the app still reads as a polished prototype with partial Shopify hardening, not a release-ready storefront.
- Finding 1 is strengthened, not weakened: Shopify's current Storefront API docs still support tokenless access for essential features, but explicitly list `Product Tags` under token-based authentication. The current client still treats the Storefront token as optional while `src/lib/shopify/queries.ts` requests `tags` in catalog and PDP queries.
- Finding 4 needed narrower wording: the repo has thin configured-mode unit coverage in `src/lib/shopify/client.test.ts`, but the hook, cart, and page-flow tests still primarily exercise demo mode and there is still no browser-level storefront smoke coverage.
- The Plane note needed softer wording: a REST lookup across the first 100 work items did not surface an obvious Shopify or storefront-specific ticket in the reviewed result set. That is weaker than proving no related ticket exists.

## System Snapshot

- Runtime boundaries: A client-rendered React 19 SPA bootstrapped in `src/main.tsx`, using TanStack Query for data fetching and a local `CartProvider` for cart state and Shopify cart mutations
- Primary entry points: `src/main.tsx`, `src/App.tsx`, `src/pages/ShopPage.tsx`, `src/pages/CollectionPage.tsx`, `src/pages/ProductPage.tsx`, `src/pages/CartPage.tsx`
- Major dependencies: React, react-router-dom, @tanstack/react-query, framer-motion, sonner, Vite, Vitest
- External integrations: Shopify Storefront GraphQL API, browser localStorage for cart ID persistence, optional GA4 and Meta Pixel tracking
- Primary data flows: Shopify catalog queries via `src/lib/shopify/client.ts` and `src/lib/shopify/hooks.ts`; cart creation and line mutations via `src/context/CartContext.tsx`; buyer navigation through SPA routes to Shopify-hosted checkout URL
- Key operational constraints: The app currently supports both demo mode and live Shopify mode in the same runtime path; missing live configuration does not fail the app; the review could not validate against a real store because no live credentials were available

## Method

- MCPs and sources consulted: repo instructions, attached architecture-review skill assets, repo docs (`CLAUDE.md`, `PRD.md`, `INTEGRATION_SUMMARY.md`, `README.md`, `.env.example`), source inspection, search subagents, Plane REST API lookup, and Shopify developer docs on Storefront API authentication, tokenless access, token-gated features, and error handling
- Code areas inspected: `src/main.tsx`, `src/App.tsx`, `src/lib/shopify/client.ts`, `src/lib/shopify/queries.ts`, `src/lib/shopify/hooks.ts`, `src/lib/shopify/types.ts`, `src/context/CartContext.tsx`, `src/pages/ShopPage.tsx`, `src/pages/CollectionPage.tsx`, `src/pages/ProductPage.tsx`, `src/pages/CartPage.tsx`, `src/components/CartFlyout.tsx`, `src/components/AddToCartButton.tsx`, `src/components/ProductGrid.tsx`, `src/components/ProductCard.tsx`, test files under `src/**/*.test.*`
- Tests or validation reviewed: the 2026-04-14 revalidation re-read the current source and test files but did not re-run the full build or test suite for this document-only update. The original review's validation state remained: IDE error scan reported no current editor diagnostics; TypeScript compile completed successfully with `node ./node_modules/typescript/bin/tsc -b --noCheck`; `vite build` and `vitest run` were blocked in that shell by a missing Rollup native optional dependency (`@rollup/rollup-linux-x64-gnu`) in the local install
- External docs consulted: Shopify Storefront API docs for authentication, tokenless access, token-gated features, versioning, and error behavior
- Open evidence gaps: No live Shopify credentials or development store were available for runtime verification; current local `node_modules` state prevented full build/test execution in the original review environment; the Plane REST lookup did not surface an obvious related Shopify-specific ticket in the first 100 reviewed work items, but that is not exhaustive proof that none exists

## Evidence Status

### Verified Facts

- `IS_CONFIGURED` only checks for a non-placeholder store domain and does not require a Storefront token
- Core product fragments request `tags` on product list and product detail queries
- Shopify's current Storefront API docs describe tokenless access as limited to essential features and explicitly list `Product Tags` as requiring token-based authentication
- When not configured, hooks and cart logic fall back to demo fixtures and demo cart behavior
- Demo cart checkout uses `#` instead of a real checkout URL
- `ShopPage` does not read query error state and can render "No products found" when Shopify requests fail
- `ProductPage` and `CollectionPage` collapse `error` and `null` into the same not-found UX
- Most hook, cart, and page-flow tests force demo mode by mocking or stubbing `IS_CONFIGURED` to false and emptying Shopify env vars; only thin client-unit coverage exercises configured fetch behavior
- No Playwright, browser spec, or `e2e/` storefront tests were found in the repo

### Reasonable Inferences

- A deployment with only `VITE_SHOPIFY_STORE_DOMAIN` set can enter live mode and then fail catalog requests because the current query shapes request token-gated fields
- A deployment with missing or wrong Shopify config can look visually healthy while being commercially dead because demo content still renders and checkout is not real
- Incident diagnosis in production would be slower because buyer-visible states do not distinguish misconfiguration, upstream outage, and genuine missing products

### Open Questions

- Does the team want to support true tokenless storefront mode in production, or should all live deployments require a public Storefront token from the Headless channel?
- Is demo mode intended only for local development, or is it deliberately used for preview/marketing environments as well?
- Is there already a dedicated Shopify development store and Headless channel token available for CI smoke tests?

## Scoring Summary

| # | Finding | Impact (1-4) | Likelihood (1-4) | Blast Radius (1-4) | Total | Severity | Effort | Priority |
|---|---|---|---|---|---|---|---|---|
| 1 | Live mode allows tokenless catalog requests that include token-gated fields | 3 | 4 | 4 | 11 | Critical | M | P0 |
| 2 | Silent demo fallback can ship a fake storefront with dead checkout | 4 | 3 | 4 | 11 | Critical | M | P0 |
| 3 | Storefront pages collapse Shopify failures into empty or not-found UX | 3 | 4 | 3 | 10 | High | M | P1 |
| 4 | The real buyer journey is effectively unverified | 3 | 4 | 3 | 10 | High | M | P1 |

## Findings

### 1. Live mode allows tokenless catalog requests that include token-gated fields

- Score breakdown: Impact 3, Likelihood 4, Blast radius 4, Total 11
- Severity: Critical
- Implementation effort: M
- Recommended priority: P0
- Evidence:
  - `src/lib/shopify/client.ts` treats the Storefront token as optional and considers the app configured when the domain is present
  - `src/lib/shopify/queries.ts` includes `tags` in `PRODUCT_CARD_FRAGMENT` and `PRODUCT_BY_HANDLE_QUERY`
  - Shopify's current Storefront API docs describe tokenless access as limited to essential features and explicitly list `Product Tags` as requiring token-based authentication
- Why this is a problem:
  - The implementation advertises one compatibility mode while issuing requests that require another. That creates a failure path where a domain-only deployment enters live mode and then breaks browsing, collection pages, and product detail pages because the query shape exceeds the supported auth capabilities.
  - This is not a hypothetical edge case. It is intrinsic to the current client contract: tokenless is treated as supported, but the requested fields are not tokenless-safe.
- Recommended solution:
  - Replace the boolean configuration model with an explicit storefront auth mode, such as `demo`, `tokenless`, and `token`.
  - Either require a public Storefront token for all live deployments, or split queries into tokenless-safe and token-required variants.
  - Remove token-gated fields like `tags` from tokenless catalog queries unless the app can positively assert token mode.
- Why this approach:
  - It fixes the root cause at the contract boundary instead of patching page-level symptoms.
  - It keeps the existing architecture intact while making supported runtime modes explicit and testable.
- Alternatives considered:
  - Keep token optional and rely on runtime error handling. Rejected because it preserves a broken live-mode contract.
  - Move all storefront access behind a server proxy immediately. Rejected as too large for the first hardening pass unless private-token access or customer APIs are required soon.
- Detailed implementation steps:
  1. Introduce a configuration resolver in `src/lib/shopify/client.ts` that computes a mode enum rather than `IS_CONFIGURED`.
  2. Gate live startup on a supported mode. If the team supports only token-backed live mode, require both domain and public token.
  3. Split `PRODUCT_CARD_FRAGMENT` and related queries into tokenless-safe and token-backed variants, or remove `tags` entirely if they are not actually used in UI.
  4. Update hooks to select the correct query shape based on the resolved mode.
  5. Add focused tests for mode resolution and for the query selection contract.
- Validation:
  - Unit tests for config resolution with domain-only, token-only, and domain-plus-token env combinations
  - Integration test that catalog pages load successfully in the supported live auth mode
  - Negative test proving that unsupported live config fails closed instead of issuing broken queries
- Risks and follow-ups:
  - If the team intentionally wants tokenless production mode, any future token-gated fields must be isolated behind mode-specific queries or a server-side path

### 2. Silent demo fallback can ship a fake storefront with dead checkout

- Score breakdown: Impact 4, Likelihood 3, Blast radius 4, Total 11
- Severity: Critical
- Implementation effort: M
- Recommended priority: P0
- Evidence:
  - `src/lib/shopify/hooks.ts` returns demo collections, demo products, and demo product detail data when live config is absent
  - `src/context/CartContext.tsx` switches to an in-memory demo cart and uses `checkoutUrl: '#'`
  - `CLAUDE.md` explicitly documents that the app runs fully without Shopify credentials and silently uses demo fixtures
  - `src/lib/shopify/client.ts` only logs a missing-config warning in development
- Why this is a problem:
  - A deployment can look like a healthy storefront while serving placeholder data and a nonfunctional checkout. That is worse than a loud failure because it can survive smoke testing, confuse operators, and mislead stakeholders into thinking the storefront is live.
  - This also contaminates analytics and business validation because fake browsing and cart behavior appear normal at the UI layer.
- Recommended solution:
  - Make demo mode explicit and opt-in, not implicit.
  - In production, fail closed when live Shopify configuration is absent or invalid.
  - In non-production demo mode, render a visible demo banner/badge and disable or clearly relabel commerce actions that are not real.
- Why this approach:
  - It preserves the usefulness of demo fixtures for local development while removing the possibility of accidental fake-production behavior.
  - It addresses the real operational risk without requiring a large refactor.
- Alternatives considered:
  - Keep silent fallback and rely on deployment checklists. Rejected because checklists are weaker than runtime guardrails for revenue paths.
  - Remove demo mode entirely. Rejected because demo mode is still useful for design and offline development.
- Detailed implementation steps:
  1. Add an explicit environment flag such as `VITE_STOREFRONT_MODE=demo|live`, or a narrower `VITE_ALLOW_DEMO_MODE=true` for local-only usage.
  2. In production builds, block app startup or render a full-screen misconfiguration state when live mode lacks required credentials.
  3. Add a persistent visual indicator for demo mode in non-production environments.
  4. Disable checkout tracking and real-commerce language when `checkoutUrl` is not real.
  5. Update docs and environment templates to describe demo mode as an explicit development aid, not the default storefront operating mode.
- Validation:
  - Smoke test showing that production live mode without required config fails visibly
  - Smoke test showing that demo mode renders a clear demo indicator and does not expose a fake checkout path as if it were live
  - Manual verification that `CartPage` and `CartFlyout` do not present `#` checkout as a real action in demo mode
- Risks and follow-ups:
  - If stakeholders currently use demo deployments for previews, they will need a clearly branded preview mode rather than implicit fallback

### 3. Storefront pages collapse Shopify failures into empty or not-found UX

- Score breakdown: Impact 3, Likelihood 4, Blast radius 3, Total 10
- Severity: High
- Implementation effort: M
- Recommended priority: P1
- Evidence:
  - `src/lib/shopify/client.ts` throws on HTTP-level failures and GraphQL `errors`
  - Shopify documents that Storefront failures can arrive as 4xx/5xx responses or as HTTP 200 responses containing `errors`
  - `src/pages/ShopPage.tsx` reads data/loading but not query `error`, so failed product or collection requests can become a generic "No products found" state
  - `src/pages/ProductPage.tsx` treats `error || !product` as "Product Not Found"
  - `src/pages/CollectionPage.tsx` treats `error || !collection` as "Collection Not Found"
- Why this is a problem:
  - The app cannot distinguish missing content from upstream failure, misconfiguration, token/auth mismatch, or temporary Shopify outages. That degrades customer trust and makes operations harder because the UI gives the wrong diagnosis.
  - The catalog can look empty when it is actually broken.
- Recommended solution:
  - Introduce a normalized storefront error model in the Shopify data layer, with categories such as `not_found`, `misconfigured`, `upstream_unavailable`, and `query_error`.
  - Make page components render explicit retryable error surfaces for service failures and reserve not-found messaging for confirmed missing resources.
- Why this approach:
  - It centralizes error semantics where they belong and prevents every page from reinventing incomplete heuristics.
  - It aligns the UI with Shopify’s actual error model.
- Alternatives considered:
  - Keep page-level generic error handling and tweak copy. Rejected because it still fails to separate root causes.
  - Swallow errors and retry more aggressively. Rejected because it hides incidents and increases ambiguity.
- Detailed implementation steps:
  1. Wrap `shopifyFetch` errors in a typed error object that records status, message, and category.
  2. Update hooks to preserve typed error information instead of treating all failures uniformly.
  3. Update `ShopPage`, `CollectionPage`, and `ProductPage` to render distinct states for not-found vs service failure.
  4. Add retry actions on catalog-level failure surfaces.
  5. Ensure the empty-state copy only appears when the request succeeds and returns an empty dataset.
- Validation:
  - Tests for GraphQL `errors` responses, 403/423/5xx cases, and true null-product/null-collection responses
  - Manual verification that a broken live config no longer renders "No products found"
- Risks and follow-ups:
  - If analytics depend on current empty-state rendering, the team should update event logic so incidents do not pollute merchandising metrics

### 4. The real buyer journey is effectively unverified

- Score breakdown: Impact 3, Likelihood 4, Blast radius 3, Total 10
- Severity: High
- Implementation effort: M
- Recommended priority: P1
- Evidence:
  - `src/test/setup.ts` empties Shopify env vars by default, forcing demo mode unless a test overrides them
  - `src/lib/shopify/hooks.test.tsx`, `src/context/CartContext.test.tsx`, `src/components/CartFlyout.test.tsx`, `src/components/Header.test.tsx`, and `src/test/phase1-bugfixes.test.tsx` all either force or rely on demo mode behavior, while `src/lib/shopify/client.test.ts` only adds thin configured-mode unit coverage around raw fetch behavior
  - No Playwright config, browser specs, or `e2e/` directory were found
  - Recent git history shows storefront behavior was built quickly, but current automated coverage still centers on fixtures rather than a real buyer path
- Why this is a problem:
  - The app’s most important promise, that a shopper can browse catalog data from Shopify, add a real variant to cart, and reach a valid checkout URL, is not proven by the test suite.
  - That makes regressions in live mode both likely and hard to catch before release.
- Recommended solution:
  - Add one browser-level smoke test against a real Shopify development store covering Home or Collection -> Product -> Add to Cart -> Cart -> Checkout.
  - Add live-mode client/hook tests that exercise real error categories and supported auth mode behavior.
- Why this approach:
  - A single end-to-end smoke path provides far more release confidence than expanding demo-mode unit tests alone.
  - It keeps the first verification step small and focused on the revenue path.
- Alternatives considered:
  - Expand only unit tests around demo fixtures. Rejected because it still leaves the real Shopify integration unproven.
  - Add a large E2E suite immediately. Rejected because a narrow smoke gate yields faster value with less setup burden.
- Detailed implementation steps:
  1. Provision a dedicated Shopify development store and Headless channel token for automated verification.
  2. Add a minimal browser test runner and one smoke scenario covering browse -> PDP -> cart -> checkout URL.
  3. Add live-mode integration tests for config resolution and query error mapping.
  4. Keep demo-mode tests, but separate them conceptually from live-contract tests in naming and CI reporting.
  5. Add a release gate that requires this smoke path before marking storefront changes complete.
- Validation:
  - Passing browser smoke test against a real development store
  - Passing live-mode integration tests for auth mode and error mapping
  - Passing TypeScript compile, Vite build, and test suite in a clean environment
- Risks and follow-ups:
  - CI will need secret management and a predictable test store catalog; that is operational work, but it is justified by the revenue-path risk

## Cross-Cutting Recommendations

- Replace the binary `IS_CONFIGURED` flag with an explicit storefront runtime mode model
- Treat demo mode as a development convenience, not as a silent production fallback
- Normalize Shopify error handling in the data layer before touching more page-level UI
- Add a single live-store smoke test before expanding broader storefront coverage
- Document the intended live-mode contract, including Headless channel setup and required environment variables

## Prioritized Execution Plan

### Phase 1: Immediate Risk Reduction

1. Make live-mode configuration explicit and fail closed when unsupported or incomplete
2. Align catalog query shapes with the supported Shopify auth mode
3. Remove or visibly gate fake checkout behavior in demo mode

### Phase 2: Structural Improvements

1. Introduce typed Shopify error categories in the client and hooks
2. Update Shop, Collection, and Product pages to distinguish service failures from genuine not-found content
3. Add explicit demo-mode UI labeling and update storefront docs accordingly

### Phase 3: Follow-on Hardening

1. Add a real-store browser smoke test for the buyer journey
2. Add live-mode integration tests for auth-mode and error-path behavior
3. Restore full build and test validation in a clean environment and make it a release gate

## Validation Plan

- Targeted tests: Config-resolution tests, live-mode Shopify hook/client tests, error-mapping tests, and one browser smoke path through browse -> PDP -> cart -> checkout
- Build or type checks: `node ./node_modules/typescript/bin/tsc -b --noCheck`; Vite production build in a clean install where Rollup optional dependencies are present; Vitest in the same clean install
- Manual verification: Start in live mode against a development store and confirm real catalog data, real cart mutations, and a valid checkout URL
- Negative-path verification: Missing token or unsupported mode should fail visibly; Shopify errors should render retryable service-error states rather than empty or not-found pages
- Success criteria: The app cannot silently impersonate a live storefront, supported auth modes match the query shapes, buyer-visible errors are truthful, and one real buyer journey is automated

## Decision Log

- Decision:
  Prioritize configuration contract and demo/live separation before broader storefront enhancements.
  Reasoning:
  The most dangerous failures are currently false-positive storefront health and broken live catalog behavior, not missing polish.
- Decision:
  Recommend incremental hardening instead of a rewrite or immediate server proxy.
  Reasoning:
  The current client architecture is salvageable if the live-mode contract, error model, and verification story are corrected first.

## Open Questions

- Does the business require true tokenless storefront support, or can all live deployments standardize on a public Storefront token?
- Is the current demo mode part of an intentional preview workflow that needs branding and guardrails instead of removal?
- Which development store and catalog fixture strategy should back the first browser smoke test?

## Appendix

- Relevant files:
  - `src/lib/shopify/client.ts`
  - `src/lib/shopify/queries.ts`
  - `src/lib/shopify/hooks.ts`
  - `src/context/CartContext.tsx`
  - `src/pages/ShopPage.tsx`
  - `src/pages/CollectionPage.tsx`
  - `src/pages/ProductPage.tsx`
  - `src/pages/CartPage.tsx`
  - `src/components/CartFlyout.tsx`
  - `src/test/setup.ts`
  - `src/lib/shopify/hooks.test.tsx`
  - `src/lib/shopify/client.test.ts`
- Relevant commits or history:
  - `00d8d9d` Shopify shopping flow: cart context, PDP, cart page, header badge, routing, build fixes
  - `e94a860` Conversion optimizations: shop page, trust badges, sticky ATC, related products, navigation fixes
  - `09a3c38` Separate pages, cart flyout, demo data fallback, Shopify config
  - `1705a6d` Comprehensive test suite with Vitest + Testing Library
- Related docs:
  - `CLAUDE.md`
  - `PRD.md`
  - `INTEGRATION_SUMMARY.md`
  - `README.md`
  - `.env.example`
  - Shopify Storefront API docs on authentication, tokenless access, and error handling
- Additional notes:
  - A Plane REST lookup across the first 100 work items did not surface an obvious Shopify/storefront-specific ticket in the reviewed result set.
  - This 2026-04-14 update revalidated the report against current source and Shopify docs without re-running the full build or test suite.
  - Full build and test execution in this shell was limited by the current local install state, specifically a missing Rollup native optional dependency.