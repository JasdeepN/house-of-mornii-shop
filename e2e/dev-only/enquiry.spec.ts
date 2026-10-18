import { test, expect, type Page } from '@playwright/test'
import { requireDevTarget, requireEnv } from '../support/env'
import { TEST_PRODUCTS } from '../support/test-products'

test.beforeAll(() => requireDevTarget())

interface WorkerAnswer {
  status: number
  body: unknown
}

/**
 * Submits real enquiries to the dev Worker in dry-run mode: every check runs, nothing is sent.
 * The token goes on the /api/enquiry request only; setExtraHTTPHeaders would leak it to other hosts.
 * The route fetches the Worker's answer itself and records it: reading the body of a request
 * passed on with route.continue() hung in CI.
 */
async function dryRunEnquiries(page: Page): Promise<WorkerAnswer[]> {
  const token = requireEnv('E2E_ENQUIRY_DRY_RUN_TOKEN')
  const answers: WorkerAnswer[] = []
  await page.route('**/api/enquiry', async (route) => {
    // route.fetch sends from Node, not the page, so the Origin the Worker checks is set here.
    const origin = new URL(route.request().url()).origin
    const headers = { ...route.request().headers(), origin, 'x-enquiry-dry-run': token }
    const response = await route.fetch({ headers })
    answers.push({ status: response.status(), body: await response.json().catch(() => null) })
    await route.fulfill({ response })
  })
  return answers
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
  const request = page.waitForRequest((r) => r.url().endsWith('/api/enquiry') && r.method() === 'POST')
  await page.getByRole('button', { name: 'Send message' }).click()
  return request
}

test('a product enquiry on the two-Variant test Product passes every check', async ({ page }) => {
  const answers = await dryRunEnquiries(page)
  const product = TEST_PRODUCTS.twoVariants
  await page.goto(`/products/${product.handle}`)
  await expect(page.getByRole('heading', { level: 1, name: product.title })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: /ask about this piece/i }).click()
  const request = await fillAndSend(page, 'Automated dry-run enquiry about this piece.')

  expect(request.postDataJSON()).toMatchObject({
    kind: 'product',
    product: { title: product.title, url: `/products/${product.handle}`, variant: product.available },
  })
  await expect(page.getByRole('status')).toContainText("we've received your message and will reply by email")
  expect(answers).toEqual([{ status: 200, body: { ok: true, dryRun: true } }])
})

test('a styling enquiry from /contact#styling passes every check', async ({ page }) => {
  const answers = await dryRunEnquiries(page)
  await page.goto('/contact#styling')
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible({ timeout: 20_000 })

  const request = await fillAndSend(page, 'Automated dry-run styling enquiry.')

  expect(request.postDataJSON()).toMatchObject({ kind: 'styling' })
  await expect(page.getByRole('status')).toContainText("we've received your message and will reply by email")
  expect(answers).toEqual([{ status: 200, body: { ok: true, dryRun: true } }])
})
