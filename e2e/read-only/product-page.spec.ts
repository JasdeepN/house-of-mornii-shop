import { test, expect } from '@playwright/test'
import { isDevTarget } from '../support/env'
import { TEST_PRODUCTS } from '../support/test-products'
import { closeFlyout, flyout } from '../support/pick'

const product = TEST_PRODUCTS.twoVariants

test.describe('Product page: the two-Variant test Product', () => {
  test.skip(!isDevTarget(), 'The hom-e2e test Products exist only on the dev store')

  test.beforeEach(async ({ page }) => {
    await page.goto(`/products/${product.handle}`)
    await expect(page.getByRole('heading', { level: 1, name: product.title })).toBeVisible({ timeout: 20_000 })
  })

  test('defaults to Gold at $20.00 and shows Silver as unavailable', async ({ page }) => {
    await expect(page.getByText('$20.00').first()).toBeVisible()
    await expect(page.getByRole('button', { name: product.available, exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: product.soldOut, exact: true })).toBeDisabled()
    await expect(page.getByTestId('add-to-cart').first()).toBeEnabled()
  })

  test('Add to bag works, and works again (#42)', async ({ page }) => {
    const add = page.getByTestId('add-to-cart').first()
    const line = flyout(page).getByTestId('cart-item')

    await add.click()
    await expect(page.getByText('Added to bag').first()).toBeVisible({ timeout: 20_000 })
    await expect(add).toHaveText(/add to bag/i)
    await expect(add).toBeEnabled()
    await expect(flyout(page)).toBeVisible()
    await expect(flyout(page).getByRole('heading', { name: /Your Bag/ })).toBeVisible()
    await expect(line).toHaveCount(1)
    await expect(line).toContainText(product.title)
    await expect(line).toHaveAccessibleName(`${product.title}, quantity 1`)

    await closeFlyout(page)
    await add.click()

    await expect(flyout(page)).toBeVisible({ timeout: 20_000 })
    await expect(add).toHaveText(/add to bag/i)
    await expect(add).toBeEnabled()
    await expect(line).toHaveCount(1)
    await expect(line).toHaveAccessibleName(`${product.title}, quantity 2`)
  })
})
