import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('IS_CONFIGURED', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is false when env vars are empty', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')
    const { IS_CONFIGURED } = await import('./client')
    expect(IS_CONFIGURED).toBe(false)
  })

  it('is false when domain is CHANGE_ME', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'CHANGE_ME')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'some-token')
    const { IS_CONFIGURED } = await import('./client')
    expect(IS_CONFIGURED).toBe(false)
  })

  it('is false when domain is the placeholder', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'your-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'some-token')
    const { IS_CONFIGURED } = await import('./client')
    expect(IS_CONFIGURED).toBe(false)
  })
})

describe('shopifyFetch', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('throws when not configured', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    const { shopifyFetch } = await import('./client')
    await expect(shopifyFetch('{ shop { name } }')).rejects.toThrow(
      'Shopify is not configured',
    )
  })

  it('makes a POST request to the correct endpoint when configured', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: { shop: { name: 'Test' } } }),
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    )

    const { shopifyFetch } = await import('./client')
    const result = await shopifyFetch('{ shop { name } }')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toContain('test-store.myshopify.com')
    expect(url).toContain('/api/')
    expect(url).toContain('/graphql.json')
    expect((options as RequestInit).method).toBe('POST')
    expect(result).toEqual({ shop: { name: 'Test' } })
  })

  it('throws on HTTP error', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)

    const { shopifyFetch } = await import('./client')
    await expect(shopifyFetch('{ shop { name } }')).rejects.toThrow(
      'Shopify API error: 401',
    )
  })

  it('throws on GraphQL errors', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: null,
          errors: [{ message: 'Field not found' }],
        }),
    } as unknown as Response)

    const { shopifyFetch } = await import('./client')
    await expect(shopifyFetch('{ badQuery }')).rejects.toThrow(
      'GraphQL errors: Field not found',
    )
  })
})
