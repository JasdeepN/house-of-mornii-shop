// workers/customer-session.test.ts — Vitest coverage for the customer-session
// Worker: sign-in, callback, session, graphql passthrough, sign-out, renewal.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import worker from './customer-session'

const APP = 'https://dev.example.com'
const SHOP = '123'

class MemoryKV {
  store = new Map<string, string>()
  ttls = new Map<string, number | undefined>()
  async get(key: string): Promise<unknown> {
    const v = this.store.get(key)
    return v === undefined ? null : JSON.parse(v)
  }
  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, value)
    this.ttls.set(key, options?.expirationTtl)
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

let kv: MemoryKV
const env = () => ({ SESSIONS: kv, SHOP_ID: SHOP, CLIENT_ID: 'client-1', APP_ORIGIN: APP, API_VERSION: '2026-10' })
const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request(`${APP}${path}`, init), env())

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function idToken(nonce: string) {
  const payload = btoa(JSON.stringify({ nonce })).replace(/=+$/, '')
  return `h.${payload}.s`
}

async function seedSession(overrides: Record<string, unknown> = {}, id = 'sid') {
  await kv.put(
    `session:${id}`,
    JSON.stringify({ accessToken: 'at', refreshToken: 'rt', idToken: 'idt', expiresAt: Date.now() + 3_600_000, ...overrides }),
  )
  return { headers: { Cookie: `hom_customer_session=${id}` } }
}

beforeEach(() => {
  kv = new MemoryKV()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('GET /sign-in', () => {
  const start = async (query = '') => {
    const res = await call(`/api/customer/sign-in${query}`)
    return { res, url: new URL(res.headers.get('Location')!) }
  }

  it('redirects to Shopify authorize with PKCE and stores pending state', async () => {
    const { res, url } = await start('?return_to=/account')
    expect(res.status).toBe(302)
    expect(url.origin + url.pathname).toBe(`https://shopify.com/authentication/${SHOP}/oauth/authorize`)
    const p = url.searchParams
    expect(p.get('client_id')).toBe('client-1')
    expect(p.get('response_type')).toBe('code')
    expect(p.get('redirect_uri')).toBe(`${APP}/api/customer/callback`)
    expect(p.get('scope')).toBe('openid email customer-account-api:full')
    expect(p.get('code_challenge_method')).toBe('S256')
    expect(p.has('login_hint')).toBe(false)
    expect(res.headers.get('Set-Cookie')).toBe(
      `hom_customer_signin=${p.get('state')}; Path=/api/customer; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    )

    const state = p.get('state')!
    const pending = (await kv.get(`sign-in:${state}`, 'json')) as { verifier: string; nonce: string; returnTo: string }
    expect(pending.returnTo).toBe('/account')
    expect(pending.nonce).toBe(p.get('nonce'))
    expect(kv.ttls.get(`sign-in:${state}`)).toBe(600)
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pending.verifier))
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(p.get('code_challenge')).toBe(expected)
  })

  it.each(['//evil.com', 'https://evil.com', '/a\\b', 'account', ''])('rejects return_to %j', async (value) => {
    const { url } = await start(`?return_to=${encodeURIComponent(value)}`)
    const pending = (await kv.get(`sign-in:${url.searchParams.get('state')}`, 'json')) as { returnTo: string }
    expect(pending.returnTo).toBe('/')
  })

  it.each(['/\t/evil.com', '/\n/evil.com', '/\r/evil.com', '/\t\\evil.com'])('rejects return_to with control chars %j', async (value) => {
    const { url } = await start(`?return_to=${encodeURIComponent(value)}`)
    const pending = (await kv.get(`sign-in:${url.searchParams.get('state')}`, 'json')) as { returnTo: string }
    expect(pending.returnTo).toBe('/')
  })

  it('keeps an encoded double slash as a path on our own origin', async () => {
    const { url } = await start(`?return_to=${encodeURIComponent('/%2F%2Fevil.com?x=1#h')}`)
    const pending = (await kv.get(`sign-in:${url.searchParams.get('state')}`, 'json')) as { returnTo: string }
    expect(new URL(pending.returnTo, APP).origin).toBe(APP)
    expect(pending.returnTo).toBe('/%2F%2Fevil.com?x=1#h')
  })

  it('defaults return_to to /', async () => {
    const { url } = await start()
    const pending = (await kv.get(`sign-in:${url.searchParams.get('state')}`, 'json')) as { returnTo: string }
    expect(pending.returnTo).toBe('/')
  })

  it('passes a trimmed login_hint', async () => {
    const { url } = await start(`?login_hint=${encodeURIComponent('  a@b.com ')}`)
    expect(url.searchParams.get('login_hint')).toBe('a@b.com')
  })

  it('omits a blank or over-long login_hint', async () => {
    expect((await start('?login_hint=%20%20')).url.searchParams.has('login_hint')).toBe(false)
    expect((await start(`?login_hint=${'a'.repeat(255)}`)).url.searchParams.has('login_hint')).toBe(false)
    expect((await start(`?login_hint=${'a'.repeat(254)}`)).url.searchParams.has('login_hint')).toBe(true)
  })
})

describe('GET /callback', () => {
  const cb = (query: string, cookie: string | null = 'st') =>
    call(`/api/customer/callback?${query}`, cookie === null ? {} : { headers: { Cookie: `hom_customer_signin=${cookie}` } })

  async function pending(returnTo = '/orders') {
    await kv.put('sign-in:st', JSON.stringify({ verifier: 'ver', nonce: 'non', returnTo }), { expirationTtl: 600 })
  }

  it('400s without the sign-in cookie, or with one for another state', async () => {
    await pending()
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'AT', id_token: idToken('non'), expires_in: 3600 }))
    const missing = await cb('state=st&code=c', null)
    expect(missing.status).toBe(400)
    expect(await missing.text()).toContain('Unknown or expired sign-in')
    expect((await cb('state=st&code=c', 'other')).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(kv.store.has('sign-in:st')).toBe(true)
  })

  it('clears the sign-in cookie on error responses', async () => {
    await pending()
    const res = await cb('state=st&error=access_denied')
    expect(res.headers.get('Set-Cookie')).toContain('hom_customer_signin=; Path=/api/customer; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
    expect((await cb('state=nope&code=c', 'nope')).headers.get('Set-Cookie')).toContain('Max-Age=0')
    expect((await cb('state=st', null)).headers.get('Set-Cookie')).toContain('Max-Age=0')
  })

  it('400s on unknown state', async () => {
    const res = await cb('state=nope&code=c')
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('400s on a Shopify error and clears the pending entry', async () => {
    await pending()
    const res = await cb('state=st&error=access_denied')
    expect(res.status).toBe(400)
    expect(kv.store.has('sign-in:st')).toBe(false)
  })

  it('exchanges the code, creates a session and sets the cookie', async () => {
    await pending()
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: 'AT', refresh_token: 'RT', id_token: idToken('non'), expires_in: 3600 }),
    )
    const res = await cb('state=st&code=thecode')
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/orders')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`https://shopify.com/authentication/${SHOP}/oauth/token`)
    const headers = new Headers(init.headers)
    expect(headers.get('Origin')).toBe(APP)
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('User-Agent')).toBeTruthy()
    const form = new URLSearchParams(init.body)
    expect(Object.fromEntries(form)).toEqual({
      grant_type: 'authorization_code',
      client_id: 'client-1',
      redirect_uri: `${APP}/api/customer/callback`,
      code: 'thecode',
      code_verifier: 'ver',
    })

    expect(kv.store.has('sign-in:st')).toBe(false)
    const cookies = res.headers.getSetCookie()
    expect(cookies).toHaveLength(2)
    expect(cookies).toContain('hom_customer_signin=; Path=/api/customer; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
    const cookie = cookies.find((c) => c.startsWith('hom_customer_session='))!
    expect(cookie).toMatch(/^hom_customer_session=[^;]+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000$/)
    const id = cookie.split(';')[0].split('=')[1]
    const session = (await kv.get(`session:${id}`, 'json')) as Record<string, unknown>
    expect(session).toMatchObject({ accessToken: 'AT', refreshToken: 'RT' })
    expect(session.idToken).toBe(idToken('non'))
    expect(session.expiresAt).toBeGreaterThan(Date.now())
    expect(kv.ttls.get(`session:${id}`)).toBe(2592000)
  })

  it('rejects a nonce mismatch without creating a session', async () => {
    await pending()
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ access_token: 'AT', refresh_token: 'RT', id_token: idToken('other'), expires_in: 3600 }),
    )
    const res = await cb('state=st&code=c')
    expect(res.status).toBe(400)
    expect([...kv.store.keys()].some((k) => k.startsWith('session:'))).toBe(false)
  })

  it('400s when Shopify rejects the code, 502s when it is down', async () => {
    await pending()
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_grant' }, 400))
    expect((await cb('state=st&code=c')).status).toBe(400)
    await pending()
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 503 }))
    expect((await cb('state=st&code=c')).status).toBe(502)
  })
})

describe('GET /session', () => {
  it('401s without a cookie or session', async () => {
    const res = await call('/api/customer/session')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ signedIn: false })
    const res2 = await call('/api/customer/session', { headers: { Cookie: 'hom_customer_session=ghost' } })
    expect(res2.status).toBe(401)
  })

  it('returns the customer using the raw access token', async () => {
    const init = await seedSession()
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { customer: { id: 'gid://c/1', firstName: 'Ada', lastName: null, emailAddress: { emailAddress: 'a@b.com' } } } }),
    )
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ signedIn: true, customer: { id: 'gid://c/1', name: 'Ada', email: 'a@b.com' } })
    const [url, req] = fetchMock.mock.calls[0]
    expect(url).toBe(`https://shopify.com/${SHOP}/account/customer/api/2026-10/graphql`)
    const headers = new Headers(req.headers)
    expect(headers.get('Authorization')).toBe('at')
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('User-Agent')).toBeTruthy()
    expect(JSON.parse(req.body).query).toContain('emailAddress')
  })

  it('ends the session on an upstream 401', async () => {
    const init = await seedSession()
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(401)
    expect(kv.store.has('session:sid')).toBe(false)
  })
})

describe('POST /graphql', () => {
  const post = (init: RequestInit & { headers?: Record<string, string> }, body = '{"query":"{ x }"}') =>
    call('/api/customer/graphql', {
      method: 'POST',
      body,
      ...init,
      headers: { Origin: APP, 'Content-Type': 'application/json', ...init.headers },
    })

  it('403s on a foreign Origin', async () => {
    expect((await post({ headers: { Origin: 'https://evil.com' } })).status).toBe(403)
  })

  it('415s on a non-JSON body', async () => {
    expect((await post({ headers: { 'Content-Type': 'text/plain' } })).status).toBe(415)
  })

  it('401s without a session', async () => {
    expect((await post({})).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes the body through and returns upstream status and body', async () => {
    const init = await seedSession()
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { ok: true } }, 200))
    const res = await post(init)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { ok: true } })
    const [, req] = fetchMock.mock.calls[0]
    expect(req.body).toBe('{"query":"{ x }"}')
    expect(new Headers(req.headers).get('Authorization')).toBe('at')
  })

  it('returns non-200 upstream statuses as-is', async () => {
    const init = await seedSession()
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [] }, 429))
    expect((await post(init)).status).toBe(429)
  })

  it('ends the session on an upstream 401', async () => {
    const init = await seedSession()
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    expect((await post(init)).status).toBe(401)
    expect(kv.store.has('session:sid')).toBe(false)
  })
})

describe('POST /sign-out', () => {
  const out = (headers: Record<string, string>) =>
    call('/api/customer/sign-out', { method: 'POST', headers: { Origin: APP, ...headers } })

  it('403s on a foreign Origin', async () => {
    const res = await call('/api/customer/sign-out', { method: 'POST', headers: { Origin: 'https://evil.com' } })
    expect(res.status).toBe(403)
  })

  it('deletes the session, clears the cookie and logs out of Shopify', async () => {
    const init = await seedSession()
    const res = await out({ ...init.headers, 'Content-Type': 'application/x-www-form-urlencoded' })
    expect(res.status).toBe(303)
    expect(kv.store.has('session:sid')).toBe(false)
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0')
    const loc = new URL(res.headers.get('Location')!)
    expect(loc.origin + loc.pathname).toBe(`https://shopify.com/authentication/${SHOP}/logout`)
    expect(loc.searchParams.get('id_token_hint')).toBe('idt')
    expect(loc.searchParams.get('post_logout_redirect_uri')).toBe(`${APP}/`)
  })

  it('goes home when there is no ID token or session', async () => {
    const init = await seedSession({ idToken: '' })
    const res = await out(init.headers)
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(`${APP}/`)
    const res2 = await out({})
    expect(res2.headers.get('Location')).toBe(`${APP}/`)
    expect(res2.headers.get('Set-Cookie')).toContain('Max-Age=0')
  })
})

describe('token renewal', () => {
  const expiring = () => seedSession({ expiresAt: Date.now() + 30_000 })
  const customerOk = () => jsonResponse({ data: { customer: { id: 'c', firstName: 'A', lastName: 'B', emailAddress: { emailAddress: 'e' } } } })

  it('refreshes near expiry, keeping the ID token and old refresh token when none returns', async () => {
    const init = await expiring()
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: 'AT2', expires_in: 3600 })).mockResolvedValueOnce(customerOk())
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(200)
    const form = new URLSearchParams(fetchMock.mock.calls[0][1].body)
    expect(form.get('grant_type')).toBe('refresh_token')
    expect(form.get('refresh_token')).toBe('rt')
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Authorization')).toBe('AT2')
    const saved = (await kv.get('session:sid', 'json')) as Record<string, unknown>
    expect(saved).toMatchObject({ accessToken: 'AT2', refreshToken: 'rt', idToken: 'idt' })
    expect(saved.expiresAt as number).toBeGreaterThan(Date.now() + 3_000_000)
  })

  it('stores a new refresh token when one comes back', async () => {
    const init = await expiring()
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: 'AT2', refresh_token: 'RT2', expires_in: 3600 }))
      .mockResolvedValueOnce(customerOk())
    await call('/api/customer/session', init)
    expect(await kv.get('session:sid', 'json')).toMatchObject({ refreshToken: 'RT2', idToken: 'idt' })
  })

  it('ends the session when the token endpoint answers 4xx', async () => {
    const init = await expiring()
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'invalid_grant' }, 400))
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(401)
    expect(kv.store.has('session:sid')).toBe(false)
  })

  it('keeps the session and 502s on a 5xx', async () => {
    const init = await expiring()
    fetchMock.mockResolvedValueOnce(new Response('down', { status: 503 }))
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(502)
    expect(kv.store.has('session:sid')).toBe(true)
  })

  it('keeps the session and 502s on a network error', async () => {
    const init = await expiring()
    fetchMock.mockRejectedValueOnce(new TypeError('network'))
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(502)
    expect(kv.store.has('session:sid')).toBe(true)
  })
})

describe('errors and routing', () => {
  it('404s unknown routes with JSON', async () => {
    const res = await call('/api/customer/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect((await call('/api/customer/spike')).status).toBe(404)
  })

  it('502s without leaking details on unexpected errors', async () => {
    const init = await seedSession()
    fetchMock.mockRejectedValueOnce(new Error('secret stack detail at=at'))
    const res = await call('/api/customer/session', init)
    expect(res.status).toBe(502)
    const text = await res.text()
    expect(text).not.toContain('secret')
  })
})
