// workers/customer-session.ts — Customer sign-in through the Customer Account
// API, run by a Worker so that Customer tokens never reach the browser
// (docs/adr/0002-customer-tokens-live-in-a-separate-worker.md).
//
// Public client with PKCE. Each Customer session lives in KV behind an opaque
// HttpOnly cookie. Routes, all under /api/customer:
//   GET  /sign-in?return_to=/path&login_hint=email  start hosted sign-in
//   GET  /callback                                  finish it, create the session
//   GET  /session                                   who is signed in (401 when nobody)
//   POST /graphql                                   Customer Account API passthrough
//   POST /sign-out                                  end the session and the Shopify sign-in
//
// Known limit: the ID token's signature is not verified; only its nonce is
// checked. It arrives straight from Shopify's token endpoint over TLS.

interface SessionStore {
  get(key: string, type: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface CustomerSessionEnv {
  SESSIONS: SessionStore
  SHOP_ID: string
  CLIENT_ID: string
  /** The storefront origin the browser sees, e.g. https://dev.houseofmornii.com */
  APP_ORIGIN: string
  API_VERSION: string
}

type Env = CustomerSessionEnv

interface PendingSignIn {
  verifier: string
  nonce: string
  returnTo: string
}

interface Session {
  accessToken: string
  refreshToken: string
  idToken: string
  expiresAt: number
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in: number
}

const COOKIE = 'hom_customer_session'
// Binds a pending sign-in to the browser that started it (login CSRF).
const SIGN_IN_COOKIE = 'hom_customer_signin'
const signInCookie = (value: string, maxAge: number) =>
  `${SIGN_IN_COOKIE}=${value}; Path=/api/customer; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
const SIGN_IN_TTL_SECONDS = 60 * 10
const RENEW_BEFORE_MS = 60_000
const MAX_LOGIN_HINT = 254
// Shopify refuses requests without these.
const SHOPIFY_HEADERS = { Accept: 'application/json', 'User-Agent': 'house-of-mornii-customer-session/1.0' }
const CUSTOMER_QUERY = '{ customer { id firstName lastName emailAddress { emailAddress } } }'

class TokenError extends Error {
  status: number
  constructor(status: number) {
    super(`Token endpoint answered ${status}`)
    this.status = status
  }
}

const authBase = (env: Env) => `https://shopify.com/authentication/${env.SHOP_ID}`
const graphqlUrl = (env: Env) => `https://shopify.com/${env.SHOP_ID}/account/customer/api/${env.API_VERSION}/graphql`
const callbackUrl = (env: Env) => `${env.APP_ORIGIN}/api/customer/callback`

function base64url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const randomToken = (bytes = 32) => base64url(crypto.getRandomValues(new Uint8Array(bytes)))

async function pkceChallenge(verifier: string): Promise<string> {
  return base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
}

/**
 * Only paths on our own site, so sign-in can't redirect elsewhere. Browsers
 * strip tab, CR and LF from URLs, so the value is resolved the way a browser
 * would and kept only if it stays on our origin.
 */
function safeReturnTo(value: string | null, env: Env): string {
  if (!value || !value.startsWith('/') || value.includes('\\')) return '/'
  try {
    const resolved = new URL(value, env.APP_ORIGIN)
    if (resolved.origin !== env.APP_ORIGIN) return '/'
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    return '/'
  }
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function redirect(location: string, status = 302, headers: Record<string, string> = {}): Response {
  return new Response(null, { status, headers: { Location: location, 'Cache-Control': 'no-store', ...headers } })
}

const isSameOrigin = (request: Request, env: Env) => request.headers.get('Origin') === env.APP_ORIGIN

async function tokenRequest(env: Env, params: Record<string, string>): Promise<TokenResponse> {
  // Public client: Shopify requires an Origin matching a registered JavaScript origin.
  const response = await fetch(`${authBase(env)}/oauth/token`, {
    method: 'POST',
    headers: { ...SHOPIFY_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', Origin: env.APP_ORIGIN },
    body: new URLSearchParams({ client_id: env.CLIENT_ID, ...params }),
  })
  if (!response.ok) throw new TokenError(response.status)
  return (await response.json()) as TokenResponse
}

function idTokenNonce(idToken: string): string | undefined {
  try {
    const payload = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return (JSON.parse(atob(payload)) as { nonce?: string }).nonce
  } catch {
    return undefined
  }
}

async function saveSession(env: Env, id: string, session: Session): Promise<void> {
  await env.SESSIONS.put(`session:${id}`, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS })
}

/**
 * Loads the Customer session, renewing the access token when it is near
 * expiry. Refresh tokens don't rotate and renewal returns no new ID token, so
 * both are carried over. A 4xx from the token endpoint ends the session; any
 * other failure throws and the session is kept.
 */
async function loadSession(request: Request, env: Env): Promise<{ id: string; session: Session } | null> {
  const id = readCookie(request, COOKIE)
  if (!id) return null
  const session = (await env.SESSIONS.get(`session:${id}`, 'json')) as Session | null
  if (!session) return null
  if (session.expiresAt - Date.now() > RENEW_BEFORE_MS) return { id, session }

  try {
    const token = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: session.refreshToken })
    const renewed: Session = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? session.refreshToken,
      idToken: token.id_token ?? session.idToken,
      expiresAt: Date.now() + token.expires_in * 1000,
    }
    await saveSession(env, id, renewed)
    return { id, session: renewed }
  } catch (error) {
    if (error instanceof TokenError && error.status >= 400 && error.status < 500) {
      await env.SESSIONS.delete(`session:${id}`)
      return null
    }
    throw error
  }
}

function callCustomerApi(env: Env, session: Session, body: string): Promise<Response> {
  return fetch(graphqlUrl(env), {
    method: 'POST',
    // The Customer Account API takes the raw token, without a "Bearer" prefix.
    headers: { ...SHOPIFY_HEADERS, 'Content-Type': 'application/json', Authorization: session.accessToken },
    body,
  })
}

async function signIn(url: URL, env: Env): Promise<Response> {
  const verifier = randomToken(48)
  const state = randomToken()
  const nonce = randomToken()
  const pending: PendingSignIn = { verifier, nonce, returnTo: safeReturnTo(url.searchParams.get('return_to'), env) }
  await env.SESSIONS.put(`sign-in:${state}`, JSON.stringify(pending), { expirationTtl: SIGN_IN_TTL_SECONDS })

  const params: Record<string, string> = {
    client_id: env.CLIENT_ID,
    response_type: 'code',
    redirect_uri: callbackUrl(env),
    scope: 'openid email customer-account-api:full',
    state,
    nonce,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
  }
  const hint = (url.searchParams.get('login_hint') ?? '').trim()
  if (hint && hint.length <= MAX_LOGIN_HINT) params.login_hint = hint

  const authorize = new URL(`${authBase(env)}/oauth/authorize`)
  authorize.search = new URLSearchParams(params).toString()
  return redirect(authorize.toString(), 302, { 'Set-Cookie': signInCookie(state, SIGN_IN_TTL_SECONDS) })
}

async function callback(request: Request, url: URL, env: Env): Promise<Response> {
  const response = await finishSignIn(request, url, env)
  response.headers.append('Set-Cookie', signInCookie('', 0))
  return response
}

async function finishSignIn(request: Request, url: URL, env: Env): Promise<Response> {
  const state = url.searchParams.get('state') ?? ''
  if (!state || readCookie(request, SIGN_IN_COOKIE) !== state) {
    return json({ error: 'Unknown or expired sign-in. Start again.' }, 400)
  }
  const pending = state ? ((await env.SESSIONS.get(`sign-in:${state}`, 'json')) as PendingSignIn | null) : null
  if (!pending) return json({ error: 'Unknown or expired sign-in. Start again.' }, 400)

  const shopifyError = url.searchParams.get('error')
  const code = url.searchParams.get('code')
  if (shopifyError || !code) {
    await env.SESSIONS.delete(`sign-in:${state}`)
    return json({ error: shopifyError ?? 'Missing code', description: url.searchParams.get('error_description') }, 400)
  }

  let token: TokenResponse
  try {
    token = await tokenRequest(env, {
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl(env),
      code,
      code_verifier: pending.verifier,
    })
  } catch (error) {
    await env.SESSIONS.delete(`sign-in:${state}`)
    if (error instanceof TokenError && error.status >= 400 && error.status < 500) {
      return json({ error: 'Sign-in was rejected. Start again.' }, 400)
    }
    throw error
  }
  await env.SESSIONS.delete(`sign-in:${state}`)

  if (!token.id_token || idTokenNonce(token.id_token) !== pending.nonce) {
    return json({ error: 'Nonce mismatch' }, 400)
  }

  const id = randomToken()
  await saveSession(env, id, {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? '',
    idToken: token.id_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  })
  const done = redirect(pending.returnTo)
  done.headers.append('Set-Cookie', `${COOKIE}=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`)
  return done
}

async function sessionInfo(request: Request, env: Env): Promise<Response> {
  const loaded = await loadSession(request, env)
  if (!loaded) return json({ signedIn: false }, 401)

  const response = await callCustomerApi(env, loaded.session, JSON.stringify({ query: CUSTOMER_QUERY }))
  if (response.status === 401) {
    await env.SESSIONS.delete(`session:${loaded.id}`)
    return json({ signedIn: false }, 401)
  }
  if (!response.ok) return json({ error: 'Upstream error' }, 502)

  const body = (await response.json()) as {
    data?: { customer?: { id: string; firstName?: string | null; lastName?: string | null; emailAddress?: { emailAddress?: string | null } | null } }
  }
  const customer = body.data?.customer
  if (!customer) return json({ error: 'Upstream error' }, 502)
  return json({
    signedIn: true,
    customer: {
      id: customer.id,
      name: [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim(),
      email: customer.emailAddress?.emailAddress ?? null,
    },
  })
}

async function graphql(request: Request, env: Env): Promise<Response> {
  if (!isSameOrigin(request, env)) return json({ error: 'Forbidden' }, 403)
  if (!(request.headers.get('Content-Type') ?? '').startsWith('application/json')) {
    return json({ error: 'Send JSON' }, 415)
  }
  const loaded = await loadSession(request, env)
  if (!loaded) return json({ signedIn: false }, 401)

  const response = await callCustomerApi(env, loaded.session, await request.text())
  if (response.status === 401) {
    await env.SESSIONS.delete(`session:${loaded.id}`)
    return json({ signedIn: false }, 401)
  }
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

async function signOut(request: Request, env: Env): Promise<Response> {
  if (!isSameOrigin(request, env)) return json({ error: 'Forbidden' }, 403)
  const id = readCookie(request, COOKIE)
  const session = id ? ((await env.SESSIONS.get(`session:${id}`, 'json')) as Session | null) : null
  if (id) await env.SESSIONS.delete(`session:${id}`)

  const clearCookie = { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` }
  if (!session?.idToken) return redirect(`${env.APP_ORIGIN}/`, 303, clearCookie)

  const logout = new URL(`${authBase(env)}/logout`)
  logout.search = new URLSearchParams({
    id_token_hint: session.idToken,
    post_logout_redirect_uri: `${env.APP_ORIGIN}/`,
  }).toString()
  return redirect(logout.toString(), 303, clearCookie)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const route = url.pathname.replace(/^\/api\/customer/, '')
    try {
      if (request.method === 'GET' && route === '/sign-in') return await signIn(url, env)
      if (request.method === 'GET' && route === '/callback') return await callback(request, url, env)
      if (request.method === 'GET' && route === '/session') return await sessionInfo(request, env)
      if (request.method === 'POST' && route === '/graphql') return await graphql(request, env)
      if (request.method === 'POST' && route === '/sign-out') return await signOut(request, env)
      return json({ error: 'Not found' }, 404)
    } catch (error) {
      // Log only the status or error name: never tokens, bodies or stacks.
      console.error('[customer-session]', error instanceof TokenError ? error.message : error instanceof Error ? error.name : 'unknown')
      return json({ error: 'Upstream error' }, 502)
    }
  },
}
