import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('STOREFRONT_MODE and IS_CONFIGURED', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns demo mode and IS_CONFIGURED=false when env vars are empty', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')
    const { IS_CONFIGURED, STOREFRONT_MODE } = await import('./client')
    expect(IS_CONFIGURED).toBe(false)
    expect(STOREFRONT_MODE).toBe('demo')
  })

  it('returns demo mode when domain is CHANGE_ME placeholder', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'CHANGE_ME')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'some-token')
    const { IS_CONFIGURED, STOREFRONT_MODE } = await import('./client')
    expect(IS_CONFIGURED).toBe(false)
    expect(STOREFRONT_MODE).toBe('demo')
  })

  it('returns demo mode when domain is the example placeholder', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'your-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'some-token')
    const { IS_CONFIGURED, STOREFRONT_MODE } = await import('./client')
    expect(IS_CONFIGURED).toBe(false)
    expect(STOREFRONT_MODE).toBe('demo')
  })

  it('returns tokenless mode when domain is set but token is absent', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')
    const { IS_CONFIGURED, STOREFRONT_MODE } = await import('./client')
    expect(IS_CONFIGURED).toBe(true)
    expect(STOREFRONT_MODE).toBe('tokenless')
  })

  it('returns token mode when both domain and token are present', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'shpat_abc123')
    const { IS_CONFIGURED, STOREFRONT_MODE } = await import('./client')
    expect(IS_CONFIGURED).toBe(true)
    expect(STOREFRONT_MODE).toBe('token')
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

  it('throws when not configured (demo mode)', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', '')
    const { shopifyFetch } = await import('./client')
    await expect(shopifyFetch('{ shop { name } }')).rejects.toThrow(
      'Shopify is not configured',
    )
  })

  it('makes a POST request to the correct endpoint in token mode', async () => {
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
    expect((options as RequestInit).headers).toMatchObject({
      'X-Shopify-Storefront-Access-Token': 'test-token-123',
    })
    expect(result).toEqual({ shop: { name: 'Test' } })
  })

  it('makes a POST request without a token in tokenless mode', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', '')

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: { shop: { name: 'Test' } } }),
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    )

    const { shopifyFetch } = await import('./client')
    await shopifyFetch('{ shop { name } }')

    const [, options] = fetchSpy.mock.calls[0]
    expect((options as RequestInit).headers).not.toHaveProperty(
      'X-Shopify-Storefront-Access-Token',
    )
  })

  it('throws a StorefrontError with misconfigured category on 401', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)

    const { shopifyFetch, StorefrontError } = await import('./client')
    const err = await shopifyFetch('{ shop { name } }').catch((e) => e)
    expect(err).toBeInstanceOf(StorefrontError)
    expect(err.category).toBe('misconfigured')
    expect(err.statusCode).toBe(401)
  })

  it('throws a StorefrontError with upstream_unavailable category on 503', async () => {
    vi.stubEnv('VITE_SHOPIFY_STORE_DOMAIN', 'test-store.myshopify.com')
    vi.stubEnv('VITE_SHOPIFY_STOREFRONT_TOKEN', 'test-token-123')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as Response)

    const { shopifyFetch, StorefrontError } = await import('./client')
    const err = await shopifyFetch('{ shop { name } }').catch((e) => e)
    expect(err).toBeInstanceOf(StorefrontError)
    expect(err.category).toBe('upstream_unavailable')
  })

  it('throws a StorefrontError with query_error category on GraphQL errors', async () => {
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

    const { shopifyFetch, StorefrontError } = await import('./client')
    const err = await shopifyFetch('{ badQuery }').catch((e) => e)
    expect(err).toBeInstanceOf(StorefrontError)
    expect(err.category).toBe('query_error')
    expect(err.message).toContain('Field not found')
  })
})

