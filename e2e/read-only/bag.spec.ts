import { test, expect, type Page } from '@playwright/test'
import { BASE_URL, isDevTarget } from '../support/env'
import { closeFlyout, flyout, money, openShop, pickProducts, pickerDialog, quickAddButton, type PickedProducts } from '../support/pick'

let picked: PickedProducts

test.beforeEach(async ({ browser }) => {
  const result = await pickProducts(browser)
  test.skip(!result.products, result.skipReason ?? '')
  picked = result.products!
})

const emptyCopy = 'Your bag is empty.'

/** Quick-adds the single-Variant Product; the flyout opens. */
async function addSingle(page: Page) {
  await quickAddButton(page, picked.single.title).click()
  await expect(flyout(page).getByTestId('cart-item').filter({ hasText: picked.single.title })).toBeVisible({ timeout: 20_000 })
}

/** Quick-adds the first available option of the several-Variant Product; the flyout opens. */
async function addMulti(page: Page) {
  await quickAddButton(page, picked.multi.title).click()
  const dialog = pickerDialog(page)
  const option = dialog.getByRole('listitem').getByRole('button').and(page.locator(':enabled')).first()
  await expect(option).toBeVisible({ timeout: 20_000 })
  await option.click()
  await expect(flyout(page).getByTestId('cart-item').filter({ hasText: picked.multi.title })).toBeVisible({ timeout: 20_000 })
}

test.describe('Bag flyout', () => {
  test('+ raises the quantity, - lowers it, remove empties the Bag', async ({ page }) => {
    await openShop(page)
    await addSingle(page)
    const line = flyout(page).getByTestId('cart-item')
    const title = picked.single.title

    await flyout(page).getByRole('button', { name: `Increase quantity for ${title}` }).click()
    await expect(line).toHaveAccessibleName(`${title}, quantity 2`, { timeout: 20_000 })

    await flyout(page).getByRole('button', { name: `Decrease quantity for ${title}` }).click()
    await expect(line).toHaveAccessibleName(`${title}, quantity 1`, { timeout: 20_000 })

    await flyout(page).getByRole('button', { name: `Remove ${title} from bag` }).click()
    await expect(page.getByText('Removed from bag').first()).toBeVisible({ timeout: 20_000 })
    await expect(flyout(page).getByText(emptyCopy)).toBeVisible()
    await expect(line).toHaveCount(0)
  })
})

test.describe('Bag page', () => {
  test('lists both Products with a subtotal equal to their sum', async ({ page }) => {
    await openShop(page)
    await addSingle(page)
    await closeFlyout(page)
    await addMulti(page)

    const lines = flyout(page).getByTestId('cart-item')
    await expect(lines).toHaveCount(2)
    const totals = await lines.evaluateAll((els) =>
      els.map((el) => [...el.querySelectorAll('span')].map((s) => s.textContent ?? '').find((t) => /^\$/.test(t)) ?? ''),
    )
    const sum = totals.map(money).reduce((a, b) => a + b, 0)

    await page.goto('/cart')

    await expect(page.getByRole('heading', { level: 1, name: /Your Bag/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('link', { name: picked.single.title, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: picked.multi.title, exact: true })).toBeVisible()
    const subtotal = page.getByText('SUBTOTAL', { exact: true }).locator('xpath=following-sibling::span')
    await expect.poll(async () => money(await subtotal.innerText())).toBeCloseTo(sum, 2)
  })

  test('an empty Bag says so', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText(emptyCopy)).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('Checkout link', () => {
  test('Proceed to Checkout is a link to the checkout domain (never followed)', async ({ page }) => {
    await openShop(page)
    await addSingle(page)

    const link = flyout(page).getByRole('link', { name: 'Proceed to Checkout' })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    const url = new URL(href ?? '')

    expect(url.protocol).toBe('https:')
    if (isDevTarget()) expect(url.host).toBe('checkout-dev.houseofmornii.com')
    else if (new URL(BASE_URL).origin === 'https://houseofmornii.com') expect(url.host).toBe('checkout.houseofmornii.com')
  })
})
