import { expect, test } from '@playwright/test'

/** #57: policy pages, the 404 page and no "coming soon" text. Reads the live site; changes nothing. */

test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }))

const POLICIES = [
  { link: 'REFUND POLICY', path: '/policies/refund' },
  { link: 'SHIPPING POLICY', path: '/policies/shipping' },
  { link: 'PRIVACY POLICY', path: '/policies/privacy' },
  { link: 'TERMS OF SERVICE', path: '/policies/terms' },
]

test.describe('Footer policy links', () => {
  for (const { link, path } of POLICIES) {
    test(`${link} leads to ${path} with a heading`, async ({ page }) => {
      await page.goto('/about', { waitUntil: 'domcontentloaded' })
      const footerLink = page.getByRole('navigation', { name: 'Policies' }).getByRole('link', { name: link })
      await expect(footerLink).toBeVisible({ timeout: 20_000 })
      await footerLink.click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 20_000 })
      // Either the store's text or the unpublished line: never an empty page
      await expect(page.getByTestId('policy-body').or(page.getByText("This policy hasn't been published yet."))).toBeVisible({ timeout: 20_000 })
    })
  }
})

test.describe('404 page', () => {
  test('a junk URL shows "Page not found" with working links', async ({ page }) => {
    await page.goto('/no-such-page-v1-check', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('main').getByRole('link', { name: 'SHOP' }).click()
    await expect(page).toHaveURL(/\/shop$/)

    await page.goto('/no-such-page-v1-check', { waitUntil: 'domcontentloaded' })
    await page.getByRole('main').getByRole('link', { name: 'HOME' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('No placeholders', () => {
  for (const path of ['/', '/contact', '/about', '/shop']) {
    test(`${path} has no "coming soon" text`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('body')).not.toContainText(/coming soon/i)
    })
  }
})
