// workers/enquiry.test.ts — Vitest coverage for the enquiry Worker, driven
// through worker.fetch with stubbed Turnstile, KV and send_email bindings.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import worker from './enquiry'

const APP = 'https://dev.example.com'
const TO = 'owner@example.com'
const DRY = 'dry-run-secret'

class MemoryKV {
  store = new Map<string, string>()
  async get(key: string): Promise<unknown> {
    const v = this.store.get(key)
    return v === undefined ? null : JSON.parse(v)
  }
  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }
}

interface Sent {
  from: string
  to: string
  raw: string
}

let kv: MemoryKV
let sent: Sent[]
let sendError: Error | null
const fetchMock = vi.fn()

const env = (overrides: Record<string, unknown> = {}) => ({
  EMAIL: {
    send: async (message: Sent) => {
      if (sendError) throw sendError
      sent.push(message)
    },
  },
  RATE: kv,
  APP_ORIGIN: APP,
  ENQUIRY_TO: TO,
  TURNSTILE_SECRET_KEY: 'ts-secret',
  ENQUIRY_DRY_RUN_TOKEN: DRY,
  ...overrides,
})

const valid = (overrides: Record<string, unknown> = {}) => ({
  kind: 'product',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '416 555 0100',
  message: 'Is this piece available in a smaller size?',
  product: { title: 'Gold Hoop Earrings', url: '/products/gold-hoop', variant: 'Small' },
  turnstileToken: 'tok',
  ...overrides,
})

function post(body: unknown, headers: Record<string, string> = {}, e = env()) {
  return worker.fetch(
    new Request(`${APP}/api/enquiry`, {
      method: 'POST',
      headers: { Origin: APP, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.7', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    e,
  )
}

// Decodes the base64 body of the raw message.
function decode(raw: string) {
  const [head, ...rest] = raw.split('\r\n\r\n')
  const text = new TextDecoder().decode(Uint8Array.from(atob(rest.join('').replace(/\s/g, '')), (c) => c.charCodeAt(0)))
  return { head, text }
}

beforeEach(() => {
  kv = new MemoryKV()
  sent = []
  sendError = null
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ success: true })))
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('sending', () => {
  it('sends a product enquiry with the right headers and body', async () => {
    const res = await post(valid())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sent).toHaveLength(1)
    expect(sent[0].from).toBe('enquiries@notify.houseofmornii.com')
    expect(sent[0].to).toBe(TO)
    const { head, text } = decode(sent[0].raw)
    expect(head).toContain('From: "House of Mornii website" <enquiries@notify.houseofmornii.com>')
    expect(head).toContain(`To: <${TO}>`)
    expect(head).toContain('Reply-To: "Ada Lovelace" <ada@example.com>')
    expect(head).toContain('Subject: Enquiry: Gold Hoop Earrings (Ada Lovelace)')
    expect(head).toMatch(/Message-ID: <[^>]+@notify\.houseofmornii\.com>/)
    expect(head).toMatch(/Date: .+ \+0000/)
    expect(text).toContain('Product: Gold Hoop Earrings')
    expect(text).toContain(`URL: ${APP}/products/gold-hoop`)
    expect(text).toContain('Variant: Small')
    expect(text).toContain('Phone: 416 555 0100')
    expect(text).toContain('Is this piece available in a smaller size?')
    expect(text).toContain('America/Toronto')
  })

  it('sends a styling request with no product', async () => {
    const res = await post(valid({ kind: 'styling', product: undefined, phone: undefined }))
    expect(res.status).toBe(200)
    const { head, text } = decode(sent[0].raw)
    expect(head).toContain('Subject: Styling appointment request (Ada Lovelace)')
    expect(text).toContain('Type: Styling appointment request')
    expect(text).not.toContain('Product:')
  })

  it('encodes non-ASCII names in headers', async () => {
    await post(valid({ name: 'Zoë Müller' }))
    const { head, text } = decode(sent[0].raw)
    expect(head).toMatch(/Reply-To: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?= <ada@example.com>/)
    expect(text).toContain('Name: Zoë Müller')
  })

  it('strips CR/LF so a field cannot inject headers', async () => {
    const res = await post(valid({ name: 'Eve\r\nBcc: evil@example.com', email: 'eve@example.com' }))
    expect(res.status).toBe(200)
    const { head } = decode(sent[0].raw)
    expect(head).not.toMatch(/^Bcc:/m)
    expect(head.split('\r\n').filter((l) => l.startsWith('Reply-To:'))).toHaveLength(1)
  })

  it('rejects an email carrying a line break', async () => {
    const res = await post(valid({ email: 'a@example.com\r\nBcc: x@example.com' }))
    expect(res.status).toBe(400)
    expect(sent).toHaveLength(0)
  })

  it('returns 502 when the send fails', async () => {
    sendError = new Error('boom')
    const res = await post(valid())
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'send_failed' })
  })
})

describe('validation', () => {
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ['empty name', { name: '  ' }, 'name'],
    ['long name', { name: 'a'.repeat(101) }, 'name'],
    ['bad email', { email: 'nope' }, 'email'],
    ['long email', { email: `${'a'.repeat(250)}@example.com` }, 'email'],
    ['long phone', { phone: '1'.repeat(31) }, 'phone'],
    ['short message', { message: 'too short' }, 'message'],
    ['long message', { message: 'x'.repeat(2001) }, 'message'],
    ['unknown kind', { kind: 'other' }, 'kind'],
    ['missing product', { product: undefined }, 'product'],
    ['foreign product url', { product: { title: 'Ring', url: 'https://evil.example.net/x' } }, 'product'],
    ['protocol-relative product url', { product: { title: 'Ring', url: '//evil.example.net/x' } }, 'product'],
  ]
  it.each(cases)('rejects %s', async (_label, patch, field) => {
    const res = await post(valid(patch))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('invalid')
    expect(body.fields[field]).toBeTruthy()
    expect(sent).toHaveLength(0)
  })

  it('accepts an absolute product url on our origin', async () => {
    const res = await post(valid({ product: { title: 'Ring', url: `${APP}/products/ring` } }))
    expect(res.status).toBe(200)
  })

  it('rejects malformed JSON', async () => {
    const res = await post('{nope')
    expect(res.status).toBe(400)
  })
})

describe('request gates', () => {
  it('rejects a foreign origin', async () => {
    const res = await post(valid(), { Origin: 'https://evil.example.net' })
    expect(res.status).toBe(403)
    expect(sent).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a missing origin', async () => {
    const res = await post(valid(), { Origin: '' })
    expect(res.status).toBe(403)
  })

  it('rejects a non-JSON content type', async () => {
    const res = await post(valid(), { 'Content-Type': 'text/plain' })
    expect(res.status).toBe(400)
    expect(sent).toHaveLength(0)
  })

  it('answers GET with 405', async () => {
    const res = await worker.fetch(new Request(`${APP}/api/enquiry`), env())
    expect(res.status).toBe(405)
  })

  it('logs one JSON line with no personal data', async () => {
    await post(valid())
    const logged = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0] as string)
    expect(logged).toHaveLength(1)
    expect(JSON.parse(logged[0])).toEqual({ worker: 'enquiry', outcome: 'sent', kind: 'product' })
    expect(logged[0]).not.toContain('ada@example.com')
  })
})

describe('Turnstile', () => {
  it('sends the secret, token and client IP to siteverify', async () => {
    await post(valid())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const form = init.body as URLSearchParams
    expect(form.get('secret')).toBe('ts-secret')
    expect(form.get('response')).toBe('tok')
    expect(form.get('remoteip')).toBe('203.0.113.7')
  })

  it('returns 403 and sends nothing when the check fails', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false })))
    const res = await post(valid())
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'forbidden' })
    expect(sent).toHaveLength(0)
  })

  it('fails closed when siteverify errors', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    expect((await post(valid())).status).toBe(403)
    expect(sent).toHaveLength(0)
  })

  it('fails closed without a token', async () => {
    expect((await post(valid({ turnstileToken: undefined }))).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('rate limit', () => {
  it('allows 5 per IP then answers 429', async () => {
    for (let i = 0; i < 5; i++) expect((await post(valid())).status).toBe(200)
    const res = await post(valid())
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'rate_limited' })
    expect(sent).toHaveLength(5)
  })

  it('counts each IP separately', async () => {
    for (let i = 0; i < 5; i++) await post(valid())
    expect((await post(valid(), { 'CF-Connecting-IP': '198.51.100.9' })).status).toBe(200)
  })

  it('starts a new window once the old one has expired', async () => {
    kv.store.set('enquiry:203.0.113.7', JSON.stringify({ count: 5, resetAt: Date.now() - 1 }))
    expect((await post(valid())).status).toBe(200)
  })
})

describe('dry run', () => {
  it('runs every check but sends nothing with the right token', async () => {
    const res = await post(valid(), { 'X-Enquiry-Dry-Run': DRY })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, dryRun: true })
    expect(sent).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('still validates during a dry run', async () => {
    const res = await post(valid({ email: 'bad' }), { 'X-Enquiry-Dry-Run': DRY })
    expect(res.status).toBe(400)
  })

  it('still checks Turnstile during a dry run', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false })))
    expect((await post(valid(), { 'X-Enquiry-Dry-Run': DRY })).status).toBe(403)
  })

  // The e2e suite retries from one CI runner IP; Turnstile is still checked.
  it('does not count against the rate limit', async () => {
    for (let i = 0; i < 8; i++) expect((await post(valid(), { 'X-Enquiry-Dry-Run': DRY })).status).toBe(200)
    expect(kv.store.has('enquiry:203.0.113.7')).toBe(false)
    expect((await post(valid())).status).toBe(200)
  })

  it('treats a wrong token as a normal send', async () => {
    const res = await post(valid(), { 'X-Enquiry-Dry-Run': 'wrong' })
    expect(await res.json()).toEqual({ ok: true })
    expect(sent).toHaveLength(1)
  })

  it('ignores the header when the Worker has no token', async () => {
    const res = await post(valid(), { 'X-Enquiry-Dry-Run': DRY }, env({ ENQUIRY_DRY_RUN_TOKEN: undefined }))
    expect(await res.json()).toEqual({ ok: true })
    expect(sent).toHaveLength(1)
  })
})
