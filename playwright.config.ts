import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration.
 *
 * Requires a real Shopify dev store to be configured:
 *   VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN in .env.local
 *
 * To run against a remote deployment, set E2E_BASE_URL in the environment.
 * When E2E_BASE_URL is absent, the config starts the Vite dev server automatically.
 *
 * Install browsers once with: npx playwright install chromium
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the Vite dev server automatically when testing locally.
  // Omitted when E2E_BASE_URL is set (CI tests against a deployed build).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        env: {
          // Forward .env.local vars to the dev server process.
          // playwright does not auto-load .env.local — set vars in your shell or CI.
        },
      },
})
