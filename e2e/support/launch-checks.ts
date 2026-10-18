import { expect, type Locator, type Page } from '@playwright/test'
import { isDevTarget } from './env'
import { TEST_PRODUCTS } from './test-products'

/** A page the launch checks visit. `ready` resolves once its main content has rendered. */
export interface CheckPage {
  name: string
  path: string
  ready: (page: Page) => Locator
}

export const WIDTHS = [320, 375, 390, 768, 1024, 1440] as const

const productReady = (page: Page) => page.getByTestId('add-to-cart').first()
const cardsReady = (page: Page) => page.getByTestId('product-card').first()
const h1 = (page: Page) => page.getByRole('heading', { level: 1 }).first()

let cached: Promise<{ pages: CheckPage[]; longWord: CheckPage }> | undefined

async function resolve(page: Page) {
  await page.goto('/collections', { waitUntil: 'domcontentloaded' })
  const collectionLink = page.locator('a[href^="/collections/"]').first()
  await expect(collectionLink).toBeVisible({ timeout: 20_000 })
  const collectionPath = new URL((await collectionLink.getAttribute('href'))!, 'http://x').pathname

  await page.goto('/shop', { waitUntil: 'domcontentloaded' })
  await expect(cardsReady(page)).toBeVisible({ timeout: 20_000 })
  const hrefs = await page.locator('a[href^="/products/"]').evaluateAll((els) =>
    els.map((a) => a.getAttribute('href') ?? ''),
  )
  const real = hrefs.find((h) => h && !h.includes('hom-e2e'))
  const any = hrefs[0]
  const productPath = isDevTarget() ? `/products/${TEST_PRODUCTS.twoVariants.handle}` : (real ?? any)
  const longPath = real ?? any
  if (!productPath || !longPath) throw new Error('No Product links on /shop')

  const longWord: CheckPage = { name: 'Product with a long description', path: longPath, ready: productReady }
  const pages: CheckPage[] = [
    { name: 'Home', path: '/', ready: (p) => p.getByRole('contentinfo').first() },
    { name: 'Shop', path: '/shop', ready: cardsReady },
    { name: 'Collections', path: '/collections', ready: (p) => p.locator('a[href^="/collections/"]').first() },
    { name: 'Collection', path: collectionPath, ready: h1 },
    { name: 'Product', path: productPath, ready: productReady },
    { name: 'Bag page', path: '/cart', ready: h1 },
    { name: 'About', path: '/about', ready: h1 },
    { name: 'Contact', path: '/contact', ready: h1 },
    { name: 'Contact with the styling form open', path: '/contact#styling', ready: (p) => p.getByLabel('Message') },
    { name: 'Account', path: '/account', ready: h1 },
    { name: 'Refund policy', path: '/policies/refund', ready: h1 },
    { name: '404', path: '/this-page-does-not-exist-launch-check', ready: h1 },
  ]
  return { pages, longWord }
}

/** The pages to check, resolved once from the live site. */
export function resolvePages(page: Page) {
  cached ??= resolve(page).catch((e) => {
    cached = undefined
    throw e
  })
  return cached
}

export async function visit(page: Page, target: CheckPage): Promise<void> {
  await page.goto(target.path, { waitUntil: 'domcontentloaded' })
  await expect(target.ready(page)).toBeVisible({ timeout: 20_000 })
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  // The specs run with reduced motion, so route transitions are instant: no settle wait is needed.
}

export interface Wide {
  tag: string
  cls: string
  right: number
}

/** Widths of the document, and the widest elements when it scrolls sideways. */
export async function measureOverflow(page: Page): Promise<{ scrollWidth: number; clientWidth: number; widest: Wide[] }> {
  return page.evaluate(() => {
    const root = document.documentElement
    const clientWidth = root.clientWidth
    const wide: { tag: string; cls: string; right: number }[] = []
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > clientWidth + 0.5) {
        wide.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.getAttribute('class') ?? '').trim().slice(0, 70),
          right: Math.round(r.right),
        })
      }
    }
    wide.sort((a, b) => b.right - a.right)
    return { scrollWidth: root.scrollWidth, clientWidth, widest: wide.slice(0, 4) }
  })
}

export interface Small {
  name: string
  tag: string
  width: number
  height: number
}

/**
 * Visible interactive elements under `min` px in either direction. Inline text links inside running
 * prose are exempt (an `a` within a `p` whose text is longer than the link's), as are visually-hidden
 * (1px, clipped) elements. A checkbox or radio is measured by its label when it has one.
 */
export async function smallTargets(scope: Locator, min = 44): Promise<Small[]> {
  return scope.evaluate((root, minSize) => {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link]'
    const out: { name: string; tag: string; width: number; height: number }[] = []
    const nodes = [...(root.matches(sel) ? [root] : []), ...root.querySelectorAll(sel)]
    for (const el of nodes) {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      if (el.closest('[hidden], [inert], [aria-hidden="true"]')) continue
      let box: Element = el
      if (el instanceof HTMLInputElement && /checkbox|radio/.test(el.type)) {
        box = el.closest('label') ?? (el.id ? document.querySelector(`label[for="${el.id}"]`) : null) ?? el
      }
      const r = box.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.width <= 1 && r.height <= 1) continue
      if (el.tagName === 'A') {
        const p = el.closest('p')
        if (p && (p.textContent ?? '').trim().length > (el.textContent ?? '').trim().length) continue
      }
      if (r.width + 0.5 >= minSize && r.height + 0.5 >= minSize) continue
      const html = el as HTMLElement
      const name =
        el.getAttribute('aria-label') ||
        (html.innerText ?? '').trim().replace(/\s+/g, ' ').slice(0, 40) ||
        el.getAttribute('title') ||
        el.querySelector('img')?.getAttribute('alt') ||
        el.getAttribute('placeholder') ||
        `(no accessible name; class "${String(el.getAttribute('class') ?? '').slice(0, 50)}")`
      out.push({ name, tag: el.tagName.toLowerCase(), width: Math.round(r.width), height: Math.round(r.height) })
    }
    return out
  }, min)
}

export function describeSmall(items: Small[]): string {
  return items.map((s) => `  - ${s.tag} "${s.name}" is ${s.width}x${s.height}px`).join('\n')
}

export interface FocusStop {
  desc: string
  ok: boolean
  detail: string
}

/** Describes the focused element and whether it shows a visible focus indicator. */
export async function inspectFocus(page: Page): Promise<FocusStop & { isAdd: boolean }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { desc: '(body)', ok: true, detail: '', isAdd: false }
    const s = getComputedStyle(el)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (c: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2], d[3] / 255]
    }
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const x = v / 255
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const contrast = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    // Nearest opaque ancestor background.
    let bg: [number, number, number, number] = [255, 255, 255, 1]
    for (let n: HTMLElement | null = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor)
      if (c[3] > 0.99) {
        bg = c
        break
      }
    }
    const colorRe = /(?:rgba?|oklch|oklab|color|hsla?|lab|lch)\([^)]*\)/g
    const indicators: { kind: string; ratio: number }[] = []
    const ow = parseFloat(s.outlineWidth)
    if (s.outlineStyle !== 'none' && ow > 0) {
      if (s.outlineStyle === 'auto') indicators.push({ kind: 'outline:auto', ratio: 99 })
      else if (ow >= 2) {
        const c = rgba(s.outlineColor)
        indicators.push({ kind: `outline ${ow}px`, ratio: c[3] < 0.1 ? 0 : contrast(c, bg) })
      }
    }
    if (s.boxShadow && s.boxShadow !== 'none') {
      for (const m of s.boxShadow.match(colorRe) ?? []) {
        const c = rgba(m)
        if (c[3] >= 0.1) indicators.push({ kind: `box-shadow ${m}`, ratio: contrast(c, bg) })
      }
    }
    const best = indicators.sort((a, b) => b.ratio - a.ratio)[0]
    const name =
      el.getAttribute('aria-label') || (el.innerText ?? '').trim().replace(/\s+/g, ' ').slice(0, 40) || el.getAttribute('title') || ''
    const desc = `${el.tagName.toLowerCase()}${name ? ` "${name}"` : ''}`
    const ok = !!best && best.ratio >= 3
    const detail = !indicators.length
      ? `no outline of 2px+ and no box-shadow ring (outline: ${s.outlineStyle} ${s.outlineWidth}, box-shadow: ${s.boxShadow.slice(0, 60)})`
      : `best indicator ${best.kind} has contrast ${best.ratio.toFixed(1)}:1 against its background; needs 3:1`
    return { desc, ok, detail, isAdd: el.getAttribute('data-testid') === 'add-to-cart' }
  })
}
