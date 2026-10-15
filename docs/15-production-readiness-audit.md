# 15 — Production Readiness Audit

**Date:** 2026-08-30
**Branch audited:** `cart`
**Verdict: NOT ready for production deployment.** Two blockers must be resolved first; several warnings should be resolved before or shortly after launch.

This audit is a point-in-time snapshot. Re-verify file:line references against current code before acting on them if this document is more than a few weeks old.

---

## Blockers (must fix before prod)

### B1. Test suite does not execute

`npm run test:run` produces:

```
Test Files  2 passed (2)
     Tests  4 passed (4)
    Errors  31 errors
```

31 test files (`CartFlyout`, `Header`, `ShopPage`, `CollectionPage`, `AccountDetailsPage`, `env-schema`, `sdk-client`, `errorHandler`, `logger`, `newsletter`, and ~20 more) fail with `[vitest-pool]: Failed to start forks worker` / timeouts. Only 4 tests across 2 files actually run — everything else is silent dead weight. Root cause is a Vitest 4.1.10 + Node v24 incompatibility with the default `forks` pool (`vitest.config.ts` has no `pool` override).

This matches `docs/14-test-coverage-analysis.md`'s own claim, so it's a known, reproducing issue, not stale documentation.

**Why it blocks launch:** `.github/workflows/deploy.yml` runs `npx vitest run` as a merge gate before every deploy. If CI's runner hits the same incompatibility, deploys are either silently passing on 4 real tests, or CI is on a different Node version where this doesn't reproduce — that needs to be confirmed either way before trusting the pipeline's green checkmark.

**Fix:** pin CI/dev to Node 22, or upgrade Vitest to a version compatible with Node 24, or switch `test.pool` to `'threads'`/`'vmThreads'` in `vitest.config.ts`. Then re-run and confirm all ~33 files actually execute.

### B2. `wrangler.toml` ships unfilled production placeholders

- `wrangler.toml:81` — `env.production.kv_namespaces.id = "REPLACE_WITH_PRODUCTION_KV_NAMESPACE_ID"`
- `wrangler.toml:84` — `env.production.vars.SHOPIFY_STORE_DOMAIN = "your-store.myshopify.com"`

Deploying the Shopify Automation Worker to `env.production` right now will either fail outright or silently talk to a nonexistent store. The dev environment (`wrangler.toml:54,60`) is closer to real but still has a placeholder store domain.

Same class of issue in `wrangler.catalog-sync.toml` (`PROD_SHOPIFY_STORE_DOMAIN` / `DEV_SHOPIFY_STORE_DOMAIN` placeholders) — secrets themselves are correctly handled via `wrangler secret put`, only the plaintext vars/IDs are unfilled.

**Fix:** create the production KV namespace (`wrangler kv:namespace create BACKUP_INDEX --env production`) and fill in the real production store domain in both `wrangler.toml` and `wrangler.catalog-sync.toml` before the first production Worker deploy.

---

## Warnings (should fix before or shortly after launch)

1. **`npm run build` doesn't type-check.** It runs `tsc -b --noCheck && vite build`, so TypeScript errors never fail the build. A standalone `npx tsc --noEmit` currently passes clean (0 errors), but nothing prevents that from silently regressing since the build script itself doesn't gate on it. Add a `typecheck` step (plain `tsc -b`, no `--noCheck`) to CI.

2. **Lint isn't run in CI**, and currently reports 1 error + 88 warnings (`npm run lint`). The one error is `workers/webhook.ts:138:38` (`'_payload' is defined but never used`). Warnings are mostly `no-explicit-any` in new test files and a few `react-hooks/exhaustive-deps` / unused-var findings (`ErrorBoundary.tsx:30`, `client.ts:4,10`). Low individual severity, but nothing stops this count from growing unchecked.

3. **No real error/exception monitoring is wired up.** `src/lib/monitoring.ts`'s `reportToSentry()` is a placeholder — it only logs `console.error('[MONITORING] Sentry event (DSN configured but SDK not initialized)', ...)` even when `VITE_SENTRY_DSN` is set. `ErrorBoundary` catches correctly but only feeds this same non-external logger. **`docs/13-architecture-decisions.md` overstates this**, listing "Phase 4: External monitoring integration" as Completed via Cloudflare Health Checks — that's uptime pinging, not exception/crash reporting, and the doc should be corrected so nobody assumes production errors are actually being captured anywhere.

4. **`docs/14-test-coverage-analysis.md` has a stale file inventory** — it omits ~11 test files that now exist untracked (`analytics.test.ts`, `logger.test.ts`, `admin-proxy.test.ts`, `env-schema.test.ts`, `health.test.ts`, `queries.test.ts`, `retry.test.ts`, `sdk-client.test.ts`, `siteConfig.test.ts`, `utils.test.ts`, `catalog-sync.test.ts`). Its core claim about the Vitest/Node failure (B1) is accurate, just the inventory needs refreshing once B1 is fixed and coverage can actually be measured.

5. **`workers/webhook.ts`'s `notify()` (line 138) is an explicit stub** — no real Slack/email delivery on webhook failures, just a `console.log`. This is honestly documented in `docs/08-shopify-automation-worker.md`'s "Out of Scope" section, so it's a known gap rather than a hidden one, but worth wiring up before you're relying on webhooks for real order/inventory events.

6. **Working tree is mid-refactor**, not a clean pre-release snapshot: `git diff --stat HEAD` shows 42 files changed (988 insertions / 6520 deletions), dominated by 24 old `docs/*.md` files deleted and consolidated into the new numbered docs 08–14 (this file makes it 15), plus 12 new untracked test files, `wrangler.catalog-sync.toml`, `workers/catalog-sync.ts`, and `coverage/`. Commit and reconcile this before treating anything else in this audit as "shipped." There's also an untracked `Python/` directory in the working tree that looks unrelated to this app — worth a sanity check that it isn't accidentally staged.

7. Coverage tooling (`@vitest/coverage-v8`) is installed but unused — no `test:coverage` script exists, and `coverage/coverage-final.json` is effectively empty (3 bytes). Not actionable until B1 is fixed, but add a coverage script once tests run for real.

---

## OK — verified, no action needed

- **No committed secrets.** `.env.example` documents required vars without real values; `.gitignore` covers `.env`, `.env.local`, `.env.*.local`, and `.local-ci/` secrets. Grep for `shpat_`/`shpca_`/`sk_live_`/`sk_test_` across the repo found only illustrative placeholders in docs and one test fixture.
- **Fail-closed Shopify credential validation** — `src/lib/shopify/client.ts` throws at module load if `VITE_SHOPIFY_STORE_DOMAIN`/`VITE_SHOPIFY_STOREFRONT_TOKEN` are missing or a known placeholder. Verified live: build fails without real credentials.
- **Webhook signature verification is correct** — `workers/webhook.ts` does HMAC-SHA256 via Web Crypto with a genuine constant-time comparison (lines 44–58).
- **Admin proxy Worker is safely scoped** — `workers/shopify-proxy.ts` regex-blocks GraphQL mutations, and CORS uses an allowlist-echo pattern rather than reflecting arbitrary origins. One documented gap: no rate limiting yet (`shopify-proxy.ts:88`, `TODO(rate-limiting)`).
- **Catalog Sync Worker is properly scoped** — nightly prod→dev sync touches only products/collections (never orders/customers), upserts by `handle` for idempotency, isolates per-item failures.
- **CI secrets are handled correctly** — `.github/workflows/deploy.yml` injects all credentials via `${{ secrets.* }}`, nothing hardcoded.
- **Analytics and newsletter are correctly env-gated** — `initGA4()`/`initMetaPixel()` no-op when IDs are unset; newsletter prototype mode (no `VITE_NEWSLETTER_ENDPOINT`) is an intentional, documented product decision, not an oversight.
- **No debugger statements, stray `console.log`s in app code, hardcoded dev URLs, or demo-mode remnants** beyond one stale doc-comment in `sdk-client.ts:14` referencing "demo mode" that no longer exists in logic.
- Production JS bundle is 91.5 kB gzip — within the project's own <350 KB launch-checklist budget.

---

## Suggested order of operations

1. Fix B1 (Vitest/Node pool issue) — until this is fixed, no test result in this repo (local or CI) can be trusted.
2. Re-run the full suite, confirm all ~33 files execute, refresh `docs/14`'s inventory.
3. Fix B2 — provision the production KV namespace and fill in real store domains in both wrangler configs.
4. Add a `typecheck` step to CI (warning 1) and run `lint` in CI (warning 2); fix the one lint error.
5. Correct `docs/13-architecture-decisions.md`'s monitoring claim, and decide whether to actually wire up Sentry (or accept the gap explicitly) before launch.
6. Commit the in-progress docs/test restructuring (warning 6) so the repo reflects a coherent, reviewable state.
