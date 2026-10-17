import type { Page } from '@playwright/test'
import { requireEnv } from './env'

const CHECKOUT_ORIGIN = 'https://checkout-dev.houseofmornii.com'

/**
 * If the page is on the dev store's password page, enters E2E_STORE_PASSWORD and continues;
 * otherwise does nothing.
 *
 * Shopify then redirects to the checkout domain's root, which can hang, so this waits for the
 * navigation to commit rather than load. The password cookie is set by then; navigate on
 * explicitly (a Checkout URL you saved, or `unlockCheckout` before the Bag page link).
 */
export async function passStorePassword(page: Page): Promise<void> {
  if (!new URL(page.url()).pathname.startsWith('/password')) return
  const field = page.locator('input[type="password"]')
  await field.fill(requireEnv('E2E_STORE_PASSWORD'))
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/password'), { waitUntil: 'commit', timeout: 30_000 }),
    field.press('Enter'),
  ])
}

/**
 * Passes the store password once per browser context, up front, so a later Proceed to Checkout
 * link goes straight to the checkout form. Without it, Shopify holds the first checkout request
 * for 25 to 80 seconds before showing the password page.
 */
export async function unlockCheckout(page: Page): Promise<void> {
  await page.goto(`${CHECKOUT_ORIGIN}/password`, { waitUntil: 'domcontentloaded' })
  await passStorePassword(page)
}
