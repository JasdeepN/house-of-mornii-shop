import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../support/test'
import { cardOf, money, openShop } from '../support/pick'

/** The filter controls differ by width: a sidebar on desktop, a chip row and a Sort select on phones. */
function controls(page: Page, isMobile: boolean) {
  const typeScope = isMobile
    ? page.getByRole('group', { name: 'Product type' })
    : page.getByRole('complementary', { name: 'Filters' })
  return {
    typeButton: (type: string): Locator => typeScope.getByRole('button', { name: new RegExp(`^${type}\\b`) }),
    hideSoldOut: isMobile
      ? page.getByRole('button', { name: 'Hide sold out' })
      : page.getByRole('checkbox', { name: 'Hide sold out' }),
    async toggleHideSoldOut() {
      await this.hideSoldOut.click()
    },
    async expectHideSoldOut(on: boolean) {
      if (isMobile) await expect(this.hideSoldOut).toHaveAttribute('aria-pressed', String(on))
      else if (on) await expect(this.hideSoldOut).toBeChecked()
      else await expect(this.hideSoldOut).not.toBeChecked()
    },
    async sortBy(label: string) {
      if (isMobile) await page.getByRole('combobox', { name: 'Sort' }).selectOption({ label })
      else await page.getByRole('complementary', { name: 'Filters' }).getByRole('button', { name: label }).click()
    },
  }
}

const params = (page: Page) => new URL(page.url()).searchParams

/** Type labels of the cards on screen, in order. */
async function cardTypes(page: Page): Promise<string[]> {
  const cards = page.getByTestId('product-card')
  return cards.evaluateAll((els) =>
    els.map((el) => el.parentElement?.parentElement?.querySelector('p')?.textContent?.trim() ?? ''),
  )
}

/** The bold price of each card, as a number (for "From $X" it is X). */
async function cardPrices(page: Page): Promise<number[]> {
  const texts = await page.getByTestId('product-card').evaluateAll((els) =>
    els.map((el) => el.parentElement?.parentElement?.querySelector('p.font-bold span')?.textContent ?? ''),
  )
  return texts.map(money)
}

/** A Type that has a filter button and at least one card, found from what the cards show. */
async function aTypeWithFilter(page: Page, isMobile: boolean): Promise<string> {
  const c = controls(page, isMobile)
  for (const type of new Set(await cardTypes(page))) {
    if (type && (await c.typeButton(type).count()) === 1) return type
  }
  throw new Error('No Type on the Shop page has both a card and a filter button')
}

test.describe('Shop filters', () => {
  test('choosing a Type writes ?type= and shows only that Type', async ({ page, isMobile }) => {
    await openShop(page)
    const c = controls(page, isMobile)
    const type = await aTypeWithFilter(page, isMobile)

    await c.typeButton(type).click()

    await expect.poll(() => params(page).get('type')).toBe(type)
    await expect(c.typeButton(type)).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(async () => new Set(await cardTypes(page))).toEqual(new Set([type]))
  })

  test('Hide sold out writes available=1 and removes Sold out cards', async ({ page, isMobile }) => {
    await openShop(page)
    const c = controls(page, isMobile)

    await c.toggleHideSoldOut()

    await expect.poll(() => params(page).get('available')).toBe('1')
    await c.expectHideSoldOut(true)
    await expect(page.getByText('Sold out', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test('Sort by price low to high writes sort=price-asc; Recommended removes it', async ({ page, isMobile }) => {
    await openShop(page)
    const c = controls(page, isMobile)

    await c.sortBy('Price low to high')

    await expect.poll(() => params(page).get('sort')).toBe('price-asc')
    await expect
      .poll(async () => {
        const prices = await cardPrices(page)
        return prices.length > 1 && prices.every((p, i) => i === 0 || p >= prices[i - 1])
      })
      .toBe(true)

    await c.sortBy('Recommended')

    await expect.poll(() => params(page).has('sort')).toBe(false)
  })

  test('Back restores the previous filters in the address and on screen', async ({ page, isMobile }) => {
    await openShop(page)
    const c = controls(page, isMobile)
    const type = await aTypeWithFilter(page, isMobile)

    await c.typeButton(type).click()
    await expect.poll(() => params(page).get('type')).toBe(type)
    await c.toggleHideSoldOut()
    await expect.poll(() => params(page).get('available')).toBe('1')

    await page.goBack()
    await expect.poll(() => params(page).get('type')).toBe(type)
    await expect.poll(() => params(page).has('available')).toBe(false)
    await c.expectHideSoldOut(false)
    await expect(c.typeButton(type)).toHaveAttribute('aria-pressed', 'true')

    await page.goBack()
    await expect.poll(() => params(page).has('type')).toBe(false)
    await expect(c.typeButton(type)).toHaveAttribute('aria-pressed', 'false')
  })
})
