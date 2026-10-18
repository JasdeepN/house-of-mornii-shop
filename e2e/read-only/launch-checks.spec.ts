import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  WIDTHS,
  describeSmall,
  inspectFocus,
  measureOverflow,
  resolvePages,
  smallTargets,
  visit,
  type CheckPage,
} from '../support/launch-checks'
import { flyout } from '../support/pick'

/**
 * Launch checks from #51/#52: no sideways scroll, 44px touch targets on phones, axe, keyboard focus.
 * They read the live site and change nothing (a Bag in a throwaway context is the only state).
 */

test.describe.configure({ timeout: 120_000 })
// Measure the settled page, not mid-fade states.
test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }))

const isPhone = (name: string) => name === 'read-only-phone'

/** Adds the current Product page's first available option and waits for the Bag to open. */
async function openBag(page: Page) {
  const add = page.getByTestId('add-to-cart').first()
  await expect(add).toBeEnabled({ timeout: 20_000 })
  await add.click()
  await expect(flyout(page)).toBeVisible({ timeout: 20_000 })
  await expect(flyout(page).getByTestId('cart-item').first()).toBeVisible({ timeout: 20_000 })
}

async function axeFailures(page: Page): Promise<string> {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `  - ${v.id} (${v.impact}): ${v.help}\n      ${v.nodes.slice(0, 5).map((n) => `${n.target.join(' ')} :: ${n.any[0]?.message ?? ''}`).join('\n      ')}`)
    .join('\n')
}

test.describe('No sideways scroll (320 to 1440px)', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'read-only-desktop', 'Resizes the viewport itself; runs once, in the desktop project')
  })

  const names = [
    'Home', 'Shop', 'Collections', 'Collection', 'Product', 'Bag page', 'About', 'Contact', 'Account', '404', 'Product with a long description',
  ]
  for (const name of names) {
    test(name, async ({ page }) => {
      const { pages, longWord } = await resolvePages(page)
      const target: CheckPage = name === longWord.name ? longWord : pages.find((p) => p.name === name)!
      await visit(page, target)
      const failures: string[] = []
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
        const m = await measureOverflow(page)
        if (m.scrollWidth > m.clientWidth) {
          failures.push(
            `${width}px: scrollWidth ${m.scrollWidth} > clientWidth ${m.clientWidth}. Widest: ` +
              (m.widest.length
                ? m.widest.map((w) => `<${w.tag} class="${w.cls}"> right edge ${w.right}px`).join('; ')
                : '(no element box passes the edge: look for unbroken text or an element with overflow hidden/clip)'),
          )
        }
      }
      expect(failures, `${name} (${target.path}) scrolls sideways:\n${failures.join('\n')}`).toEqual([])
    })
  }
})

test.describe('Touch targets of at least 44x44px (390px phone)', () => {
  test.beforeEach(({}, info) => {
    test.skip(!isPhone(info.project.name), 'Phone rule; runs in read-only-phone')
  })

  const names = ['Home', 'Shop', 'Collections', 'Collection', 'Product', 'Bag page', 'About', 'Contact', 'Account', '404']
  for (const name of names) {
    test(name, async ({ page }) => {
      const { pages } = await resolvePages(page)
      const target = pages.find((p) => p.name === name)!
      await visit(page, target)
      const small = await smallTargets(page.locator('body'))
      expect(small, `${name} (${target.path}) has ${small.length} targets under 44x44px:\n${describeSmall(small)}`).toEqual([])
    })
  }

  test('Bag flyout controls', async ({ page }) => {
    const { pages } = await resolvePages(page)
    await visit(page, pages.find((p) => p.name === 'Product')!)
    await openBag(page)
    const small = await smallTargets(flyout(page))
    expect(small, `Bag flyout has ${small.length} targets under 44x44px:\n${describeSmall(small)}`).toEqual([])
  })

  test('Phone menu sheet', async ({ page }) => {
    const { pages } = await resolvePages(page)
    await visit(page, pages.find((p) => p.name === 'Home')!)
    await page.getByRole('button', { name: 'Open menu' }).click()
    const sheet = page.locator('[role=dialog]:visible').last()
    await expect(sheet).toBeVisible({ timeout: 10_000 })
    const small = await smallTargets(sheet)
    expect(small, `Menu sheet has ${small.length} targets under 44x44px:\n${describeSmall(small)}`).toEqual([])
  })
})

test.describe('Accessibility (axe: no serious or critical violations)', () => {
  const names = ['Home', 'Shop', 'Collections', 'Collection', 'Product', 'Bag page', 'About', 'Contact', 'Account', '404']
  for (const name of names) {
    test(name, async ({ page }) => {
      const { pages } = await resolvePages(page)
      const target = pages.find((p) => p.name === name)!
      await visit(page, target)
      const report = await axeFailures(page)
      expect(report, `${name} (${target.path}) has serious or critical axe violations:\n${report}`).toBe('')
    })
  }

  test('Bag flyout open', async ({ page }) => {
    const { pages } = await resolvePages(page)
    await visit(page, pages.find((p) => p.name === 'Product')!)
    await openBag(page)
    const report = await axeFailures(page)
    expect(report, `Open Bag has serious or critical axe violations:\n${report}`).toBe('')
  })
})

test.describe('Keyboard focus (desktop)', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'read-only-desktop', 'Keyboard journey; runs in read-only-desktop')
  })

  test('every stop from the page top to Add to bag shows a visible focus indicator', async ({ page }) => {
    const { pages } = await resolvePages(page)
    await visit(page, pages.find((p) => p.name === 'Product')!)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    const bad: string[] = []
    const seen: string[] = []
    let reached = false
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press('Tab')
      const stop = await inspectFocus(page)
      seen.push(stop.desc)
      if (!stop.ok) bad.push(`  - Tab ${i + 1}: ${stop.desc}: ${stop.detail}`)
      reached = stop.isAdd
    }
    expect(reached, `Never reached "Add to bag" in 80 Tab presses. Stops: ${seen.join(' > ')}`).toBe(true)
    expect(bad, `${bad.length} focused elements lack a visible focus indicator (outline of 2px+ or a box-shadow ring, at least 3:1 against its background):\n${bad.join('\n')}`).toEqual([])
  })

  test('the Bag dialog opens with focus on the dialog or its heading, not a quantity button', async ({ page }) => {
    const { pages } = await resolvePages(page)
    await visit(page, pages.find((p) => p.name === 'Product')!)
    await openBag(page)
    const where = await page.evaluate(() => {
      const bag = document.querySelector('[data-testid="cart-flyout"]')
      const a = document.activeElement as HTMLElement | null
      if (!a || !bag) return { ok: false, desc: 'no focused element or no Bag' }
      const label = a.getAttribute('aria-label') || (a.innerText ?? '').trim().slice(0, 40)
      const desc = `<${a.tagName.toLowerCase()}> "${label}"${bag.contains(a) ? '' : ' (outside the Bag)'}`
      const isHeading = /^H[1-6]$/.test(a.tagName) || a.getAttribute('role') === 'heading'
      const isDialog = a === bag || (a.getAttribute('role') === 'dialog' && bag.contains(a))
      return { ok: isHeading || isDialog, desc }
    })
    expect(where.ok, `After the Bag opened, focus is on ${where.desc}. It should land on the dialog or its heading.`).toBe(true)
  })
})
