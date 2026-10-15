// workers/catalog-sync.test.ts — Vitest coverage for the nightly prod→dev
// catalog sync Worker: prod→dev transform, idempotent upsert (create vs
// update by handle), collection sync, and the no-PII (no orders/customers)
// guarantee.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import worker, {
  transformProductForDev,
  transformCollectionForDev,
  upsertDevProduct,
  upsertDevCollection,
  runCatalogSync,
  CATALOG_PRODUCTS_QUERY,
  CATALOG_COLLECTIONS_QUERY,
  type CatalogSyncEnv,
  type AdminProductNode,
  type AdminCollectionNode,
} from './catalog-sync'

const PROD_DOMAIN = 'prod-store.myshopify.com'
const DEV_DOMAIN = 'dev-store.myshopify.com'
const PROD_TOKEN = 'prod-admin-token'
const DEV_TOKEN = 'dev-admin-token'

function baseEnv(overrides: Partial<CatalogSyncEnv> = {}): CatalogSyncEnv {
  return {
    PROD_SHOPIFY_STORE_DOMAIN: PROD_DOMAIN,
    PROD_ADMIN_ACCESS_TOKEN: PROD_TOKEN,
    DEV_SHOPIFY_STORE_DOMAIN: DEV_DOMAIN,
    DEV_ADMIN_ACCESS_TOKEN: DEV_TOKEN,
    ...overrides,
  }
}

const sampleProduct: AdminProductNode = {
  id: 'gid://shopify/Product/1',
  title: 'Regal Peacock Necklace',
  handle: 'regal-peacock-necklace',
  vendor: 'House of Mornii',
  productType: 'Necklace',
  status: 'ACTIVE',
  tags: ['peacock', 'gold'],
  description: 'A regal necklace.',
  descriptionHtml: '<p>A regal necklace.</p>',
  featuredImage: { id: 'img1', url: 'https://cdn.shopify.com/prod/featured.jpg', altText: 'Featured' },
  images: { nodes: [{ id: 'img1', url: 'https://cdn.shopify.com/prod/featured.jpg', altText: 'Featured' }] },
  options: [{ name: 'Size', values: ['Small', 'Large'] }],
  variants: {
    nodes: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Small',
        sku: 'PEACOCK-S',
        price: '49.00',
        compareAtPrice: '59.00',
        selectedOptions: [{ name: 'Size', value: 'Small' }],
        image: { id: 'img1', url: 'https://cdn.shopify.com/prod/variant.jpg', altText: 'Variant' },
        inventoryQuantity: 5,
      },
    ],
  },
}

const sampleCollection: AdminCollectionNode = {
  id: 'gid://shopify/Collection/1',
  title: 'Necklaces',
  handle: 'necklaces',
  descriptionHtml: '<p>All necklaces.</p>',
  image: { id: 'col-img', url: 'https://cdn.shopify.com/prod/collection.jpg', altText: 'Collection' },
}

describe('transformProductForDev', () => {
  it('maps Admin read shape to productSet upsert input, matched by handle', () => {
    const result = transformProductForDev(sampleProduct)

    expect(result.identifier).toEqual({ handle: 'regal-peacock-necklace' })
    expect(result.input.handle).toBe('regal-peacock-necklace')
    expect(result.input.title).toBe('Regal Peacock Necklace')
    expect(result.input.descriptionHtml).toBe('<p>A regal necklace.</p>')
    expect(result.input.vendor).toBe('House of Mornii')
    expect(result.input.tags).toEqual(['peacock', 'gold'])
  })

  it('references prod CDN image URLs instead of re-uploading binaries', () => {
    const result = transformProductForDev(sampleProduct)

    expect(result.input.files).toEqual([
      { originalSource: 'https://cdn.shopify.com/prod/featured.jpg', alt: 'Featured', contentType: 'IMAGE' },
    ])
    expect(result.input.variants?.[0].file).toEqual({
      originalSource: 'https://cdn.shopify.com/prod/variant.jpg',
      alt: 'Variant',
      contentType: 'IMAGE',
    })
  })

  it('maps product options and variant option values', () => {
    const result = transformProductForDev(sampleProduct)

    expect(result.input.productOptions).toEqual([{ name: 'Size', values: [{ name: 'Small' }, { name: 'Large' }] }])
    expect(result.input.variants?.[0].optionValues).toEqual([{ optionName: 'Size', name: 'Small' }])
    expect(result.input.variants?.[0].price).toBe('49.00')
    expect(result.input.variants?.[0].compareAtPrice).toBe('59.00')
    expect(result.input.variants?.[0].sku).toBe('PEACOCK-S')
  })

  it('omits optional fields that are absent on the prod product', () => {
    const minimal: AdminProductNode = {
      id: 'gid://shopify/Product/2',
      title: 'Simple Ring',
      handle: 'simple-ring',
      variants: { nodes: [] },
    }
    const result = transformProductForDev(minimal)

    expect(result.input.files).toBeUndefined()
    expect(result.input.productOptions).toBeUndefined()
    expect(result.input.variants).toBeUndefined()
    expect(result.input.vendor).toBeUndefined()
  })
})

describe('transformCollectionForDev', () => {
  it('maps to CollectionInput for create (no existing dev id)', () => {
    const result = transformCollectionForDev(sampleCollection)

    expect(result.input.id).toBeUndefined()
    expect(result.input.handle).toBe('necklaces')
    expect(result.input.title).toBe('Necklaces')
    expect(result.input.descriptionHtml).toBe('<p>All necklaces.</p>')
    expect(result.input.image).toEqual({ src: 'https://cdn.shopify.com/prod/collection.jpg', altText: 'Collection' })
  })

  it('includes the existing dev collection id for update', () => {
    const result = transformCollectionForDev(sampleCollection, 'gid://shopify/Collection/999')
    expect(result.input.id).toBe('gid://shopify/Collection/999')
  })
})

describe('upsertDevProduct — idempotent by handle', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls productSet with identifier.handle so repeated calls update rather than duplicate', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ data: { productSet: { product: { id: 'gid://shopify/Product/1', handle: 'regal-peacock-necklace' }, userErrors: [] } } }),
          { status: 200 }
        )
    )

    const result = await upsertDevProduct(baseEnv(), sampleProduct)

    expect(result.ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain(DEV_DOMAIN)
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.query).toContain('productSet')
    expect(body.variables.identifier).toEqual({ handle: 'regal-peacock-necklace' })

    // Second (nightly re-run) call — same handle, still one product upserted,
    // no duplicate-creation branch exercised.
    await upsertDevProduct(baseEnv(), sampleProduct)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    const secondBody = JSON.parse((fetchSpy.mock.calls[1][1] as RequestInit).body as string)
    expect(secondBody.variables.identifier).toEqual({ handle: 'regal-peacock-necklace' })
  })

  it('reports userErrors as a failed (non-throwing) result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ data: { productSet: { product: null, userErrors: [{ field: ['handle'], message: 'already taken' }] } } }),
        { status: 200 }
      )
    )

    const result = await upsertDevProduct(baseEnv(), sampleProduct)
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual([{ field: ['handle'], message: 'already taken' }])
  })

  it('throws if dev credentials are missing', async () => {
    await expect(upsertDevProduct(baseEnv({ DEV_ADMIN_ACCESS_TOKEN: undefined }), sampleProduct)).rejects.toThrow(
      /DEV_SHOPIFY_STORE_DOMAIN|DEV_ADMIN_ACCESS_TOKEN/
    )
  })
})

describe('upsertDevCollection — match by handle, update vs create', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls collectionCreate when no existing dev collection matches the handle', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      if (body.query.includes('collectionByHandle')) {
        return new Response(JSON.stringify({ data: { collectionByHandle: null } }), { status: 200 })
      }
      expect(body.query).toContain('collectionCreate')
      return new Response(
        JSON.stringify({ data: { collectionCreate: { collection: { id: 'gid://shopify/Collection/1', handle: 'necklaces' }, userErrors: [] } } }),
        { status: 200 }
      )
    })

    const result = await upsertDevCollection(baseEnv(), sampleCollection)
    expect(result.ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('calls collectionUpdate (not collectionCreate) when a dev collection with the same handle exists', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      if (body.query.includes('collectionByHandle')) {
        return new Response(
          JSON.stringify({ data: { collectionByHandle: { id: 'gid://shopify/Collection/999', handle: 'necklaces' } } }),
          { status: 200 }
        )
      }
      expect(body.query).toContain('collectionUpdate')
      expect(body.variables.input.id).toBe('gid://shopify/Collection/999')
      return new Response(
        JSON.stringify({ data: { collectionUpdate: { collection: { id: 'gid://shopify/Collection/999', handle: 'necklaces' }, userErrors: [] } } }),
        { status: 200 }
      )
    })

    const result = await upsertDevCollection(baseEnv(), sampleCollection)
    expect(result.ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})

describe('runCatalogSync — orchestration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reads products+collections from PROD and upserts into DEV, returning a summary', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const domain = String(url)
      const body = JSON.parse((init as RequestInit).body as string)

      if (domain.includes(PROD_DOMAIN) && body.query.includes('CatalogSyncCollections')) {
        return new Response(
          JSON.stringify({ data: { collections: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [sampleCollection] } } }),
          { status: 200 }
        )
      }
      if (domain.includes(PROD_DOMAIN) && body.query.includes('CatalogSyncProducts')) {
        return new Response(
          JSON.stringify({ data: { products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [sampleProduct] } } }),
          { status: 200 }
        )
      }
      if (domain.includes(DEV_DOMAIN) && body.query.includes('collectionByHandle')) {
        return new Response(JSON.stringify({ data: { collectionByHandle: null } }), { status: 200 })
      }
      if (domain.includes(DEV_DOMAIN) && body.query.includes('collectionCreate')) {
        return new Response(
          JSON.stringify({ data: { collectionCreate: { collection: { id: 'c1', handle: 'necklaces' }, userErrors: [] } } }),
          { status: 200 }
        )
      }
      if (domain.includes(DEV_DOMAIN) && body.query.includes('productSet')) {
        return new Response(
          JSON.stringify({ data: { productSet: { product: { id: 'p1', handle: 'regal-peacock-necklace' }, userErrors: [] } } }),
          { status: 200 }
        )
      }
      throw new Error(`Unexpected fetch: ${domain} ${body.query.slice(0, 40)}`)
    })

    const summary = await runCatalogSync(baseEnv())

    expect(summary).not.toBeNull()
    expect(summary?.products.total).toBe(1)
    expect(summary?.products.succeeded).toBe(1)
    expect(summary?.collections.total).toBe(1)
    expect(summary?.collections.succeeded).toBe(1)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('returns null and logs when prod credentials are missing (no requests made)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await runCatalogSync(baseEnv({ PROD_ADMIN_ACCESS_TOKEN: undefined }))

    expect(summary).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('returns null and logs when dev credentials are missing (no write requests made)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await runCatalogSync(baseEnv({ DEV_ADMIN_ACCESS_TOKEN: undefined }))

    expect(summary).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('continues syncing remaining products after one upsert fails (partial-failure observability)', async () => {
    const failingProduct: AdminProductNode = { ...sampleProduct, id: 'gid://shopify/Product/2', handle: 'broken-item' }
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const domain = String(url)
      const body = JSON.parse((init as RequestInit).body as string)

      if (domain.includes(PROD_DOMAIN) && body.query.includes('CatalogSyncCollections')) {
        return new Response(
          JSON.stringify({ data: { collections: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } }),
          { status: 200 }
        )
      }
      if (domain.includes(PROD_DOMAIN) && body.query.includes('CatalogSyncProducts')) {
        return new Response(
          JSON.stringify({
            data: { products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [sampleProduct, failingProduct] } },
          }),
          { status: 200 }
        )
      }
      if (domain.includes(DEV_DOMAIN) && body.query.includes('productSet')) {
        if (body.variables.identifier.handle === 'broken-item') {
          return new Response(
            JSON.stringify({ data: { productSet: { product: null, userErrors: [{ field: ['title'], message: 'boom' }] } } }),
            { status: 200 }
          )
        }
        return new Response(
          JSON.stringify({ data: { productSet: { product: { id: 'p1', handle: 'regal-peacock-necklace' }, userErrors: [] } } }),
          { status: 200 }
        )
      }
      throw new Error(`Unexpected fetch: ${domain}`)
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await runCatalogSync(baseEnv())

    expect(summary?.products.total).toBe(2)
    expect(summary?.products.succeeded).toBe(1)
    expect(summary?.products.failed).toBe(1)
    expect(summary?.products.failures[0].handle).toBe('broken-item')
  })
})

describe('No orders/customers — catalog-only guarantee', () => {
  it('the products query does not request order or customer fields', () => {
    expect(CATALOG_PRODUCTS_QUERY).not.toMatch(/orders?\s*\(/i)
    expect(CATALOG_PRODUCTS_QUERY).not.toMatch(/customers?\s*\(/i)
    expect(CATALOG_PRODUCTS_QUERY).not.toContain('email')
  })

  it('the collections query does not request order or customer fields', () => {
    expect(CATALOG_COLLECTIONS_QUERY).not.toMatch(/orders?\s*\(/i)
    expect(CATALOG_COLLECTIONS_QUERY).not.toMatch(/customers?\s*\(/i)
    expect(CATALOG_COLLECTIONS_QUERY).not.toContain('email')
  })

  it('runCatalogSync never issues a request whose query mentions orders or customers', async () => {
    const seenQueries: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      seenQueries.push(body.query)

      if (body.query.includes('CatalogSyncCollections')) {
        return new Response(
          JSON.stringify({ data: { collections: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } }),
          { status: 200 }
        )
      }
      if (body.query.includes('CatalogSyncProducts')) {
        return new Response(
          JSON.stringify({ data: { products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } }),
          { status: 200 }
        )
      }
      return new Response(JSON.stringify({ data: {} }), { status: 200 })
    })

    await runCatalogSync(baseEnv())

    for (const query of seenQueries) {
      expect(query).not.toMatch(/\border(s)?\s*\(/i)
      expect(query).not.toMatch(/\bcustomer(s)?\s*\(/i)
    }
  })

  it('the deployed Worker exposes no HTTP route (scheduled-only; no accidental data-export endpoint)', async () => {
    const request = new Request('https://worker.example/anything')
    const response = await worker.fetch()
    expect(response.status).toBe(404)
    void request
  })
})
