import { test, expect, type Page } from '@playwright/test'
import { requireDevTarget, requireEnv } from '../support/env'
import { TEST_PRODUCTS } from '../support/test-products'

test.beforeAll(() => requireDevTarget())

/**
 * Submits real enquiries to the dev Worker in dry-run mode: every check runs, nothing is sent.
 * The token goes on the /api/enquiry request only; setExtraHTTPHeaders would leak it to other hosts.
 */
async function dryRunEnquiries(page: Page) {
  const token = requireEnv('E2E_ENQUIRY_DRY_RUN_TOKEN')
  await page.route('**/api/enquiry', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'X-Enquiry-Dry-Run': token } }),
  )
}

async function fillAndSend(page: Page, message: string) {
  await page.getByLabel('Name', { exact: true }).fill('Mornii E2E')
  await page.getByLabel('Email', { exact: true }).fill('e2e@example.com')
  await page.getByLabel('Message', { exact: true }).fill(message)
  // The always-pass Turnstile test site key hands out a token on its own.
  await page.waitForFunction(
    () => !!document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value,
    undefined,
    { timeout: 30_000 },
  )
  const response = page.waitForResponse((r) => r.url().endsWith('/api/enquiry') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Send message' }).click()
  return response
}

test('a product enquiry on the two-Variant test Product passes every check', async ({ page }) => {
  await dryRunEnquiries(page)
  const product = TEST_PRODUCTS.twoVariants
  await page.goto(`/products/${product.handle}`)
  await expect(page.getByRole('heading', { level: 1, name: product.title })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: /ask about this piece/i }).click()
  const response = await fillAndSend(page, 'Automated dry-run enquiry about this piece.')

  const request = response.request().postDataJSON()
  expect(request).toMatchObject({
    kind: 'product',
    product: { title: product.title, url: `/products/${product.handle}`, variant: product.available },
  })
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ ok: true, dryRun: true })
  await expect(page.getByRole('status')).toContainText("we've received your message and will reply by email")
})

test('a styling enquiry from /contact#styling passes every check', async ({ page }) => {
  await dryRunEnquiries(page)
  await page.goto('/contact#styling')
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible({ timeout: 20_000 })

  const response = await fillAndSend(page, 'Automated dry-run styling enquiry.')

  expect(response.request().postDataJSON()).toMatchObject({ kind: 'styling' })
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ ok: true, dryRun: true })
  await expect(page.getByRole('status')).toContainText("we've received your message and will reply by email")
})
