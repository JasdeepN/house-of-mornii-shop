# E2E Testing Setup Guide

This document covers the planned end-to-end test architecture, the Playwright smoke test for the real buyer journey (ticket #44), and the CI integration requirements.

## Overview

The House of Mornii storefront has two test layers:

| Layer | Tool | Coverage | Shopify required? |
|-------|------|----------|-------------------|
| Unit + integration | Vitest + Testing Library | Hooks, context, components, utilities | No — runs in demo mode |
| E2E smoke test | Playwright | Full buyer journey against a live dev store | Yes |

Unit tests run in CI on every push. E2E tests are intended to run on a separate schedule (nightly or pre-deploy gate) since they require live Shopify credentials.

## Prerequisites for E2E Tests

Before running E2E tests you need:

1. **A Shopify development store** with the Headless sales channel enabled.
2. **A public Storefront API access token** scoped to at least:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_collection_listings`
   - `unauthenticated_write_checkouts`
3. **At least one collection and one product** with an in-stock variant published to the Headless channel.

## Installing Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Add a `playwright.config.ts` at the project root:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    headless: true,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
      },
})
```

Set `E2E_BASE_URL` in CI to point at the preview deployment URL.

## Writing the Buyer Journey Smoke Test

Create `e2e/buyer-journey.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('buyer journey: browse → product → add to cart → checkout', async ({ page }) => {
  // 1. Landing page loads
  await page.goto('/')
  await expect(page.locator('header')).toBeVisible()

  // 2. Navigate to collections
  await page.goto('/collections')
  const firstCollection = page.locator('[data-testid="collection-card"]').first()
  await expect(firstCollection).toBeVisible()
  await firstCollection.click()

  // 3. A collection page loads with products
  await expect(page).toHaveURL(/\/collections\/.*/)
  const firstProduct = page.locator('[data-testid="product-card"]').first()
  await expect(firstProduct).toBeVisible()
  await firstProduct.click()

  // 4. The product detail page loads
  await expect(page).toHaveURL(/\/products\/.*/)
  await expect(page.locator('h1')).toBeVisible()

  // 5. Add to cart
  const atcButton = page.locator('[data-testid="add-to-cart"]')
  await expect(atcButton).toBeEnabled()
  await atcButton.click()

  // 6. Cart flyout opens
  const cartFlyout = page.locator('[data-testid="cart-flyout"]')
  await expect(cartFlyout).toBeVisible()
  await expect(cartFlyout.locator('[data-testid="cart-item"]')).toHaveCount(1)

  // 7. Proceed to checkout — URL should be a real Shopify checkout URL
  const checkoutButton = page.locator('[data-testid="checkout-button"]')
  await expect(checkoutButton).toBeVisible()
  // In token mode the checkout URL is a Shopify-hosted URL
  // In tokenless mode only a cart object is created; verify button is not a dead '#' link
  const href = await checkoutButton.getAttribute('href')
  expect(href).not.toBe('#')
  expect(href).not.toBeNull()
})
```

> **Note on data-testid attributes:** The smoke test above relies on `data-testid` attributes that must be added to `CollectionCard`, `ProductCard`, `AddToCartButton`, `CartFlyout`, and the checkout link in `CartFlyout.tsx`. Add these during ticket #44 implementation.

## Running Tests Locally

1. Copy credentials to `.env.local`:
   ```env
   VITE_SHOPIFY_STORE_DOMAIN=house-of-mornii-dev.myshopify.com
   VITE_SHOPIFY_STOREFRONT_TOKEN=<dev-store-token>
   ```

2. Start the dev server and run E2E tests:
   ```bash
   npm run dev &
   npx playwright test
   ```

   Or in one command using the `webServer` config above:
   ```bash
   npx playwright test
   ```

## CI Integration (GitHub Actions)

Add a workflow file at `.github/workflows/e2e.yml`:

```yaml
name: E2E Smoke Tests

on:
  schedule:
    - cron: '0 4 * * *'  # nightly at 04:00 UTC
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build production bundle
        env:
          VITE_SHOPIFY_STORE_DOMAIN: ${{ secrets.DEV_VITE_SHOPIFY_STORE_DOMAIN }}
          VITE_SHOPIFY_STOREFRONT_TOKEN: ${{ secrets.DEV_VITE_SHOPIFY_STOREFRONT_TOKEN }}
        run: npm run build

      - name: Run E2E tests against preview build
        env:
          E2E_BASE_URL: ${{ secrets.E2E_PREVIEW_URL }}
        run: npx playwright test

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DEV_VITE_SHOPIFY_STORE_DOMAIN` | Development store domain (never production) |
| `DEV_VITE_SHOPIFY_STOREFRONT_TOKEN` | Development store Storefront token |
| `E2E_PREVIEW_URL` | Preview deployment URL to run tests against |

Use `DEV_` prefixed secrets to make it explicit that E2E tests never touch production data.

## Unit Test Setup (Reference)

For unit and component tests, see `src/test/setup.ts`. Vitest stubs `import.meta.env.VITE_SHOPIFY_STORE_DOMAIN` and `VITE_SHOPIFY_STOREFRONT_TOKEN` to empty strings, which activates demo mode and prevents any live API calls during the unit test run.

Run unit tests:
```bash
# Single run (CI)
node node_modules/vitest/vitest.mjs run

# Watch mode (development)
node node_modules/vitest/vitest.mjs
```

> **Note on binary permissions:** `node_modules/.bin/vitest` may lack execute permission on Linux. Use the full `node node_modules/vitest/vitest.mjs` invocation. If `@rollup/rollup-linux-x64-gnu` is missing, install it with: `npm install @rollup/rollup-linux-x64-gnu --no-save`

## Related Files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Unit test configuration |
| `src/test/setup.ts` | Vitest env stubs (activates demo mode in tests) |
| `playwright.config.ts` | Playwright E2E configuration (to be created) |
| `e2e/` | E2E test specs (to be created) |
| `.github/workflows/e2e.yml` | E2E CI workflow (to be created) |
