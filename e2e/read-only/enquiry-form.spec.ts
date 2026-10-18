import { test, expect, type Page } from '@playwright/test'
import { resolvePages, visit } from '../support/launch-checks'

/**
 * The enquiry form opens and validates (#59). This tier runs on production too, so it never sends:
 * every submit here is empty, and a route guard fails the test if a request to /api/enquiry is made.
 */

let sent: string[] = []

test.beforeEach(async ({ page }) => {
  sent = []
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/enquiry', (route) => {
    sent.push(route.request().url())
    return route.abort()
  })
})

test.afterEach(() => {
  expect(sent, 'The read-only tier must never send an enquiry').toEqual([])
})

async function expectEmptySubmitErrors(page: Page) {
  const form = page.locator('form', { has: page.getByLabel('Message') })
  await expect(form).toBeVisible({ timeout: 20_000 })
  await form.getByRole('button', { name: 'Send message' }).click()

  for (const [label, text] of [
    ['Name', 'Please tell us your name.'],
    ['Email', 'Please enter a valid email address.'],
    ['Message', 'Please write at least 10 characters.'],
  ] as const) {
    const field = form.getByLabel(label, { exact: true })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(field).toHaveAccessibleDescription(text)
  }
  await expect(form.getByLabel('Name', { exact: true })).toBeFocused()
}

test('Product page: Ask about this piece opens the form and validates an empty submit', async ({ page }) => {
  const { pages } = await resolvePages(page)
  await visit(page, pages.find((p) => p.name === 'Product')!)

  const toggle = page.getByRole('button', { name: /ask about this piece/i })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expectEmptySubmitErrors(page)
})

test('Contact: /contact#styling opens the styling form and validates an empty submit', async ({ page }) => {
  await page.goto('/contact#styling')
  await expect(page.getByRole('button', { name: 'BOOK YOUR APPOINTMENT' })).toHaveAttribute('aria-expanded', 'true', {
    timeout: 20_000,
  })
  await expect(page.getByText("Tell us what you're looking for and when suits you.")).toBeVisible()
  await expectEmptySubmitErrors(page)
})

test('Contact: the Book your appointment button reveals the form', async ({ page }) => {
  await page.goto('/contact')
  const button = page.getByRole('button', { name: 'BOOK YOUR APPOINTMENT' })
  await expect(button).toHaveAttribute('aria-expanded', 'false', { timeout: 20_000 })
  await button.click()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByLabel('Message')).toBeVisible()
})
