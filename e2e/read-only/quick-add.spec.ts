import { test, expect } from '@playwright/test'
import { cardOf, flyout, money, openShop, pickProducts, pickerDialog, quickAddButton, type PickedProducts } from '../support/pick'

let picked: PickedProducts

test.beforeEach(async ({ browser }) => {
  const result = await pickProducts(browser)
  test.skip(!result.products, result.skipReason ?? '')
  picked = result.products!
})

test.describe('Quick add', () => {
  test('one Variant: + opens the Bag with that Product', async ({ page }) => {
    await openShop(page)

    await quickAddButton(page, picked.single.title).click()

    const line = flyout(page).getByTestId('cart-item')
    await expect(flyout(page)).toBeVisible({ timeout: 20_000 })
    await expect(line).toHaveCount(1)
    await expect(line).toContainText(picked.single.title)
  })

  test('several Variants: + opens the picker, and choosing an option fills the Bag', async ({ page }) => {
    await openShop(page)

    await quickAddButton(page, picked.multi.title).click()

    const dialog = pickerDialog(page)
    await expect(dialog).toBeVisible()
    const options = dialog.getByRole('listitem').getByRole('button')
    await expect(options.first()).toBeVisible({ timeout: 20_000 })
    const enabled = options.and(page.locator(':enabled'))
    await expect(enabled.first()).toBeVisible()
    const chosen = await enabled.first().innerText()

    if (picked.multi.title === 'Test – Two Variants') {
      await expect(dialog.getByRole('button', { name: /Gold/ })).toContainText('$20.00')
      await expect(dialog.getByRole('button', { name: /Silver/ })).toBeDisabled()
      await expect(dialog.getByRole('button', { name: /Silver/ })).toContainText('Sold out')
    }

    await enabled.first().click()

    const line = flyout(page).getByTestId('cart-item')
    await expect(flyout(page)).toBeVisible({ timeout: 20_000 })
    await expect(line).toHaveCount(1)
    await expect(line).toContainText(picked.multi.title)
    await expect(line).toContainText(chosen.split('\n')[0].trim())
    expect(money(chosen)).toBeGreaterThan(0)
  })

  test("a sold-out Product's + is disabled", async ({ page }) => {
    await openShop(page)
    const soldOut = page.getByRole('button', { name: /is sold out$/ })
    test.skip((await soldOut.count()) === 0, 'No sold-out Product is listed on the Shop page to check')

    await expect(soldOut.first()).toBeDisabled()
    await expect(cardOf(page.getByTestId('product-card').first()).first()).toBeVisible()
  })
})
