// workers/shopify-proxy.test.ts — Vitest coverage for the Shopify Automation
// Worker: HMAC verification, mutation-block guard, webhook dispatch, and
// backup snapshot key/serialization shape.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import worker, { MUTATION_PATTERN, runScheduledBackup, type WorkerEnv } from './shopify-proxy'
import { verifyShopifyWebhook, dispatchWebhookTopic } from './webhook'
import { BACKUP_RESOURCES } from './backup-queries'

const WEBHOOK_SECRET = 'test-webhook-secret'
const ADMIN_TOKEN = 'test-admin-token'
const STORE_DOMAIN = 'test-store.myshopify.com'

function baseEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    SHOPIFY_ADMIN_ACCESS_TOKEN: ADMIN_TOKEN,
    SHOPIFY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    SHOPIFY_STORE_DOMAIN: STORE_DOMAIN,
    ALLOWED_ORIGIN: 'https://houseofmornii.com',
    ...overrides,
  }
}

/** Compute a valid base64 HMAC-SHA256 signature for test payloads. */
async function signBody(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

describe('MUTATION_PATTERN', () => {
  it('matches mutation operations', () => {
    expect(MUTATION_PATTERN.test('mutation { productCreate { id } }')).toBe(true)
    expect(MUTATION_PATTERN.test('MUTATION createOrder { id }')).toBe(true)
  })

  it('does not match read queries', () => {
    expect(MUTATION_PATTERN.test('query { products(first: 1) { nodes { id } } }')).toBe(false)
  })
})

describe('POST /api/shopify/admin — mutation guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects mutation queries with 403', async () => {
    const request = new Request('https://worker.example/api/shopify/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://houseofmornii.com' },
      body: JSON.stringify({ query: 'mutation { productCreate { id } }' }),
    })

    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toMatch(/not permitted/i)
  })

  it('forwards read queries to the Admin API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { products: { nodes: [] } } }), { status: 200 })
    )

    const request = new Request('https://worker.example/api/shopify/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://houseofmornii.com' },
      body: JSON.stringify({ query: 'query { products(first: 1) { nodes { id } } }' }),
    })

    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/admin/api/2026-01/graphql.json'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('returns 500 when admin token is not configured', async () => {
    const request = new Request('https://worker.example/api/shopify/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query { products(first: 1) { nodes { id } } }' }),
    })

    const response = await worker.fetch(request, baseEnv({ SHOPIFY_ADMIN_ACCESS_TOKEN: undefined }))
    expect(response.status).toBe(500)
  })

  it('handles CORS preflight', async () => {
    const request = new Request('https://worker.example/api/shopify/admin', {
      method: 'OPTIONS',
      headers: { Origin: 'https://houseofmornii.com' },
    })
    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://houseofmornii.com')
  })
})

describe('verifyShopifyWebhook (HMAC)', () => {
  const body = JSON.stringify({ id: 12345, email: 'buyer@example.com' })

  it('accepts a valid signature', async () => {
    const signature = await signBody(WEBHOOK_SECRET, body)
    const result = await verifyShopifyWebhook(body, signature, WEBHOOK_SECRET)
    expect(result).toBe(true)
  })

  it('rejects an invalid signature', async () => {
    const result = await verifyShopifyWebhook(body, 'not-a-real-signature==', WEBHOOK_SECRET)
    expect(result).toBe(false)
  })

  it('rejects a missing signature header', async () => {
    const result = await verifyShopifyWebhook(body, null, WEBHOOK_SECRET)
    expect(result).toBe(false)
  })

  it('rejects when secret is not configured', async () => {
    const signature = await signBody(WEBHOOK_SECRET, body)
    const result = await verifyShopifyWebhook(body, signature, undefined)
    expect(result).toBe(false)
  })

  it('rejects a signature computed with the wrong secret', async () => {
    const signature = await signBody('wrong-secret', body)
    const result = await verifyShopifyWebhook(body, signature, WEBHOOK_SECRET)
    expect(result).toBe(false)
  })
})

describe('POST /api/shopify/webhook route', () => {
  it('returns 401 for invalid HMAC', async () => {
    const body = JSON.stringify({ id: 1 })
    const request = new Request('https://worker.example/api/shopify/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': 'bogus==',
        'X-Shopify-Topic': 'orders/create',
      },
      body,
    })

    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(401)
  })

  it('returns 401 when signature header is missing', async () => {
    const body = JSON.stringify({ id: 1 })
    const request = new Request('https://worker.example/api/shopify/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Topic': 'orders/create' },
      body,
    })

    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(401)
  })

  it('returns 200 and dispatches on valid orders/create webhook', async () => {
    const body = JSON.stringify({ id: 999, email: 'buyer@example.com' })
    const signature = await signBody(WEBHOOK_SECRET, body)

    const request = new Request('https://worker.example/api/shopify/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': signature,
        'X-Shopify-Topic': 'orders/create',
      },
      body,
    })

    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
  })

  it('returns 200 for valid inventory_levels/update webhook', async () => {
    const body = JSON.stringify({ inventory_item_id: 42, available: 10 })
    const signature = await signBody(WEBHOOK_SECRET, body)

    const request = new Request('https://worker.example/api/shopify/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Hmac-Sha256': signature,
        'X-Shopify-Topic': 'inventory_levels/update',
      },
      body,
    })

    const response = await worker.fetch(request, baseEnv())
    expect(response.status).toBe(200)
  })
})

describe('dispatchWebhookTopic', () => {
  it('marks known topics as handled', async () => {
    const result = await dispatchWebhookTopic('orders/create', { id: 1 })
    expect(result).toEqual({ topic: 'orders/create', handled: true })
  })

  it('marks unknown topics as unhandled', async () => {
    const result = await dispatchWebhookTopic('unknown/topic', {})
    expect(result).toEqual({ topic: 'unknown/topic', handled: false })
  })
})

describe('runScheduledBackup', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('writes one R2 key per resource and updates the KV index', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(
        JSON.stringify({
          data: {
            products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'p1' }] },
            collections: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'c1' }] },
            orders: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'o1' }] },
          },
        }),
        { status: 200 }
      )
    )

    const r2Put = vi.fn().mockResolvedValue(undefined)
    const kvPut = vi.fn().mockResolvedValue(undefined)

    const env = baseEnv({
      SHOPIFY_BACKUPS: { put: r2Put },
      BACKUP_INDEX: { put: kvPut },
    })

    const summary = await runScheduledBackup(env)

    expect(summary).not.toBeNull()
    expect(summary?.keys).toHaveLength(BACKUP_RESOURCES.length)
    for (const resource of BACKUP_RESOURCES) {
      expect(summary?.keys.some((k) => k.endsWith(`${resource}.json`))).toBe(true)
      expect(summary?.counts[resource]).toBe(1)
    }
    expect(r2Put).toHaveBeenCalledTimes(BACKUP_RESOURCES.length)
    expect(kvPut).toHaveBeenCalledWith('latest-backup', expect.stringContaining('"keys"'))

    // Verify snapshot key shape: backups/<ISO-date>/<resource>.json
    const [firstKey] = r2Put.mock.calls[0]
    expect(firstKey).toMatch(/^backups\/\d{4}-\d{2}-\d{2}\/\w+\.json$/)
  })

  it('returns null and logs when admin token missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const env = baseEnv({ SHOPIFY_ADMIN_ACCESS_TOKEN: undefined })
    const summary = await runScheduledBackup(env)
    expect(summary).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('returns null and logs when R2 binding missing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const env = baseEnv({ SHOPIFY_BACKUPS: undefined })
    const summary = await runScheduledBackup(env)
    expect(summary).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('returns null and logs structured error on partial failure', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const env = baseEnv({
      SHOPIFY_BACKUPS: { put: vi.fn() },
      BACKUP_INDEX: { put: vi.fn() },
    })

    const summary = await runScheduledBackup(env)
    expect(summary).toBeNull()
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('backup.failed'))
  })
})

describe('scheduled() handler', () => {
  it('invokes the backup exporter', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ data: { products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } }),
        { status: 200 }
      )
    )
    const r2Put = vi.fn().mockResolvedValue(undefined)
    const env = baseEnv({ SHOPIFY_BACKUPS: { put: r2Put }, BACKUP_INDEX: { put: vi.fn() } })

    await worker.scheduled({}, env)
    expect(r2Put).toHaveBeenCalled()
  })
})
