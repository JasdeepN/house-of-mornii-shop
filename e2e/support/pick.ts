import { expect, type Browser, type Locator, type Page } from '@playwright/test'
import { BASE_URL, isDevTarget } from './env'
import { TEST_PRODUCTS } from './test-products'

/** A Product the journeys use, and what they may assert about it. */
export interface PickedProduct {
  title: string
  /** True when quick add opens the "Choose an option" picker. */
  hasPicker: boolean
}

export interface PickedProducts {
  /** Quick add opens the Bag directly. */
  single: PickedProduct
  /** Quick add opens the picker; at least one option is available. */
  multi: PickedProduct
}

/** Why the journeys cannot run, or null when both Products were found. */
export type PickResult = { products: PickedProducts; skipReason: null } | { products: null; skipReason: string }

export function money(text: string): number {
  const m = text.replace(/,/g, '').match(/\d+\.\d{2}/)
  if (!m) throw new Error(`No price in "${text}"`)
  return Number(m[0])
}

export function quickAddButton(page: Page, title: string): Locator {
  return page.getByRole('button', { name: `Quick add ${title}`, exact: true })
}

export function flyout(page: Page): Locator {
  return page.getByTestId('cart-flyout')
}

export function pickerDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Choose an option' })
}

/** The card (all of it, badge and button included) around a product-card link. */
export function cardOf(link: Locator): Locator {
  return link.locator('xpath=../../..')
}

/** Opens /shop and waits until cards are listed. */
export async function openShop(page: Page, query = ''): Promise<void> {
  await page.goto(`/shop${query}`)
  await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 20_000 })
}

export async function closeFlyout(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect(flyout(page)).toBeHidden()
}

let cached: PickResult | undefined

/**
 * Finds the Products the journeys use. On dev these are the hom-e2e test Products. Anywhere else
 * (production after v1.0) it opens, in a separate browser context, the Shop page and tries cards' quick add buttons, up to
 * MAX_TRIES, to find one that opens the Bag directly and one that opens the picker. Trying
 * quick add only puts things in a Bag, which is safe on production.
 */
export async function pickProducts(browser: Browser): Promise<PickResult> {
  if (isDevTarget()) {
    return {
      skipReason: null,
      products: {
        single: { title: TEST_PRODUCTS.oneVariant.title, hasPicker: false },
        multi: { title: TEST_PRODUCTS.twoVariants.title, hasPicker: true },
      },
    }
  }
  if (cached) return cached

  // A throwaway context, so the Bags this fills never reach a journey's own Bag.
  const context = await browser.newContext({ baseURL: BASE_URL })
  const page = await context.newPage()
  const MAX_TRIES = 12
  await openShop(page)
  const titles = await page.getByTestId('product-card').allInnerTexts()
  let single: PickedProduct | undefined
  let multi: PickedProduct | undefined

  for (const raw of titles.slice(0, MAX_TRIES)) {
    if (single && multi) break
    const title = raw.trim()
    const button = quickAddButton(page, title)
    if ((await button.count()) !== 1 || (await button.isDisabled())) continue
    await button.click()
    const outcome = await Promise.race([
      flyout(page).waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'flyout' as const),
      pickerDialog(page).waitFor({ state: 'visible', timeout: 15_000 }).then(() => 'picker' as const),
    ]).catch(() => null)
    if (outcome === 'flyout') {
      single ??= { title, hasPicker: false }
      await page.keyboard.press('Escape')
      await expect(flyout(page)).toBeHidden()
    } else if (outcome === 'picker') {
      const enabled = await pickerDialog(page).getByRole('button').filter({ hasNotText: 'Close' }).and(page.locator(':enabled')).count()
      if (enabled > 0) multi ??= { title, hasPicker: true }
      await page.keyboard.press('Escape')
      await expect(pickerDialog(page)).toBeHidden()
    }
  }

  await context.close()
  cached =
    single && multi
      ? { products: { single, multi }, skipReason: null }
      : {
          products: null,
          skipReason: `No suitable Products on ${BASE_URL}: need one whose quick add opens the Bag (${
            single ? 'found' : 'missing'
          }) and one that opens "Choose an option" (${multi ? 'found' : 'missing'}).`,
        }
  return cached
}
