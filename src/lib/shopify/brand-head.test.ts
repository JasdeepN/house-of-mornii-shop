import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchBrandAtBuild, injectBrandIntoHtml, shopifyBrandPlugin } from './brand-head'
import type { ShopBrand } from './brand-query'

const html = `<html><head>
<meta property="og:image" content="https://site/og-image.png" />
<meta name="twitter:image" content="https://site/og-image.png" />
</head><body></body></html>`

const img = (url: string) => ({ url, alt: '', width: null, height: null })
const empty: ShopBrand = { logo: null, squareLogo: null, coverImage: null }

afterEach(() => vi.unstubAllGlobals())

describe('injectBrandIntoHtml', () => {
  it('sets the sharing image and adds the icons', () => {
    const out = injectBrandIntoHtml(html, {
      ...empty,
      squareLogo: img('https://cdn.example/m.png?v=1'),
      coverImage: img('https://cdn.example/cover.png?v=2'),
    })
    expect(out).toContain('<meta property="og:image" content="https://cdn.example/cover.png?v=2" />')
    expect(out).toContain('<meta name="twitter:image" content="https://cdn.example/cover.png?v=2" />')
    expect(out).toMatch(/<link rel="icon"[^>]*href="https:\/\/cdn\.example\/m\.png\?v=1&amp;width=96"/)
    expect(out).toMatch(/<link rel="apple-touch-icon"[^>]*width=180/)
  })

  it('leaves the page unchanged when Brand settings are empty', () => {
    expect(injectBrandIntoHtml(html, empty)).toBe(html)
  })
})

describe('shopifyBrandPlugin', () => {
  function run(plugin: ReturnType<typeof shopifyBrandPlugin>) {
    const configResolved = plugin.configResolved as (c: unknown) => void
    configResolved({ env: {} })
    const t = plugin.transformIndexHtml as (h: string) => Promise<string>
    return t(html)
  }

  it('does nothing under Vitest', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await run(shopifyBrandPlugin())).toBe(html)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the defaults and warns when the fetch fails', async () => {
    const vitest = process.env.VITEST
    delete process.env.VITEST
    process.env.VITE_SHOPIFY_STORE_DOMAIN = 'shop.example'
    process.env.VITE_SHOPIFY_STOREFRONT_TOKEN = 'tok'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(await run(shopifyBrandPlugin())).toBe(html)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not read Brand settings'))
    } finally {
      process.env.VITEST = vitest
      warn.mockRestore()
    }
  })
})

describe('fetchBrandAtBuild', () => {
  it('posts the query with the Storefront token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { shop: { brand: { coverImage: { image: { url: 'https://cdn/c.png' } } } } } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const brand = await fetchBrandAtBuild('shop.example', 'tok')
    expect(brand.coverImage?.url).toBe('https://cdn/c.png')
    expect(fetchMock.mock.calls[0][0]).toBe('https://shop.example/api/2026-01/graphql.json')
    expect(fetchMock.mock.calls[0][1].headers['X-Shopify-Storefront-Access-Token']).toBe('tok')
  })
})
