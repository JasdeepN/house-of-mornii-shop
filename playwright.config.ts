import { defineConfig, devices } from '@playwright/test'
import './e2e/support/load-env'

/**
 * End-to-end suite. It tests deployed builds (default https://dev.houseofmornii.com)
 * or a local `vite preview` you start yourself; there is no webServer.
 *
 * Secrets come from the git-ignored .env.e2e.local, or from the environment (CI).
 * Install the browser once: npx playwright install chromium
 */
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } }
const phone = {
  ...devices['Desktop Chrome'],
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
}

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  // One dev store and one Customer are shared by every spec.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list'], ['github']]
    : [['html', { open: 'never' }], ['list']],
  globalSetup: './e2e/support/global-setup.ts',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://dev.houseofmornii.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'read-only-desktop', testDir: 'e2e/read-only', use: desktop },
    { name: 'read-only-phone', testDir: 'e2e/read-only', use: phone },
    { name: 'dev-only-desktop', testDir: 'e2e/dev-only', use: desktop },
    { name: 'dev-only-phone', testDir: 'e2e/dev-only', use: phone },
  ],
})
