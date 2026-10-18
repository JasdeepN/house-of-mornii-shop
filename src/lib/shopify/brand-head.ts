// Build-time Brand injection: a Vite plugin that bakes the tab icon and sharing image into index.html,
// because social previewers and crawlers don't run scripts. Runs in Node during `vite build`; the app
// bundle never imports it. Any failure keeps the static defaults and logs a warning.

import type { Plugin } from 'vite'
import { BRAND_QUERY, toShopBrand, type RawShopBrand, type ShopBrand } from './brand-query'

const API_VERSION = '2026-01'
const PLACEHOLDER_DOMAINS = ['your-store.myshopify.com', 'CHANGE_ME']

function sized(url: string, width: number): string {
  try {
    const u = new URL(url)
    u.searchParams.set('width', String(width))
    return u.toString()
  } catch {
    return url
  }
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Pure: returns the HTML with the tab icon and sharing image from the Brand settings, or unchanged when empty. */
export function injectBrandIntoHtml(html: string, brand: ShopBrand): string {
  let out = html
  if (brand.coverImage) {
    const url = escapeAttr(brand.coverImage.url)
    out = out
      .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/, `$1${url}$2`)
  }
  if (brand.squareLogo) {
    out = out.replace(/\s*<link\s+rel="(?:icon|apple-touch-icon)"[^>]*>/g, '')
    const icon = escapeAttr(sized(brand.squareLogo.url, 96))
    const touch = escapeAttr(sized(brand.squareLogo.url, 180))
    out = out.replace(
      '</head>',
      `    <link rel="icon" type="image/png" sizes="96x96" href="${icon}" />\n` +
        `    <link rel="apple-touch-icon" sizes="180x180" href="${touch}" />\n</head>`,
    )
  }
  return out
}

export async function fetchBrandAtBuild(domain: string, token: string): Promise<ShopBrand> {
  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query: BRAND_QUERY }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Storefront API answered HTTP ${res.status}`)
  const json = (await res.json()) as { data?: RawShopBrand; errors?: unknown }
  if (json.errors) throw new Error(`Storefront API errors: ${JSON.stringify(json.errors)}`)
  return toShopBrand(json.data)
}

export function shopifyBrandPlugin(): Plugin {
  let env: Record<string, string> = {}
  return {
    name: 'hom-shopify-brand',
    apply: 'build',
    configResolved(config) {
      env = { ...(config.env as Record<string, string>), ...(process.env as Record<string, string>) }
    },
    async transformIndexHtml(html) {
      if (process.env.VITEST) return html
      const domain = env.VITE_SHOPIFY_STORE_DOMAIN
      const token = env.VITE_SHOPIFY_STOREFRONT_TOKEN
      if (!domain || !token || PLACEHOLDER_DOMAINS.some((d) => domain.includes(d))) {
        console.warn('[brand] Shopify credentials missing; keeping the static tab icon and sharing image.')
        return html
      }
      try {
        const brand = await fetchBrandAtBuild(domain, token)
        if (!brand.squareLogo && !brand.coverImage) {
          console.warn('[brand] Brand settings have no square logo or cover image; keeping the static defaults.')
          return html
        }
        console.info(
          `[brand] Injected ${[brand.squareLogo && 'tab icon', brand.coverImage && 'sharing image'].filter(Boolean).join(' and ')}.`,
        )
        return injectBrandIntoHtml(html, brand)
      } catch (error) {
        console.warn(`[brand] Could not read Brand settings (${(error as Error).message}); keeping the static defaults.`)
        return html
      }
    },
  }
}
