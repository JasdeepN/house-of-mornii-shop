// workers/enquiry.ts — Shopper enquiries by email (#59). One form serves
// Product pages and the Contact page's "Book a styling". The Worker checks the
// origin, validates, rate-limits, verifies Turnstile, then sends with the
// Cloudflare Email Workers `send_email` binding to a single fixed address.
//
//   POST /api/enquiry   JSON body, see EnquiryBody
//     200 {ok:true}                  sent
//     200 {ok:true,dryRun:true}      every check passed, nothing sent
//     400 {error:'invalid',fields}   Shopper-facing message per field
//     403 {error:'forbidden'}        bad origin or failed Turnstile
//     429 {error:'rate_limited'}
//     502 {error:'send_failed'}
//
// Dry run: only when ENQUIRY_DRY_RUN_TOKEN is set and X-Enquiry-Dry-Run equals
// it. Production never sets the token, so dry run cannot happen there. A dry
// run skips the rate limit (the e2e suite retries from one CI runner IP) but
// still passes validation and Turnstile.
//
// Rate limit: 5 per IP per 10 minutes, counted in KV. The Workers Rate Limiting
// binding only supports 10 or 60 second windows, so it cannot express this.
// KV is eventually consistent, so the cap is approximate; that is acceptable
// for an abuse brake sitting behind Turnstile.

import { EmailMessage } from 'cloudflare:email'

interface KVStore {
  get(key: string, type: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

interface EmailSender {
  send(message: unknown): Promise<unknown>
}

export interface EnquiryEnv {
  EMAIL: EmailSender
  RATE: KVStore
  /** The storefront origin the browser sees, e.g. https://dev.houseofmornii.com */
  APP_ORIGIN: string
  /** The single destination; the send_email binding is restricted to it too. */
  ENQUIRY_TO: string
  TURNSTILE_SECRET_KEY: string
  /** Set on dev only. */
  ENQUIRY_DRY_RUN_TOKEN?: string
}

type Env = EnquiryEnv

type Kind = 'product' | 'styling'

/** The request body, as the form sends it (validate() reads it untyped). */
export interface EnquiryBody {
  kind: Kind
  name: string
  email: string
  phone?: string
  message: string
  product?: { title: string; url: string; variant?: string }
  turnstileToken: string
}

interface Enquiry {
  kind: Kind
  name: string
  email: string
  phone: string
  message: string
  product?: { title: string; url: string; variant: string }
}

const SENDER_ADDRESS = 'enquiries@notify.houseofmornii.com'
const SENDER_NAME = 'House of Mornii website'
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const RATE_LIMIT = 5
const RATE_WINDOW_SECONDS = 600
// KV refuses a TTL below 60 seconds.
const KV_MIN_TTL = 60
const MAX_BODY_BYTES = 16_384
const EMAIL_PATTERN = /^[^\s@<>(),;:"[\]\\]+@[^\s@<>(),;:"[\]\\]+\.[^\s@<>(),;:"[\]\\]+$/

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const isSameOrigin = (request: Request, env: Env) => request.headers.get('Origin') === env.APP_ORIGIN

function log(outcome: string, kind?: string): void {
  console.log(JSON.stringify({ worker: 'enquiry', outcome, kind: kind ?? null }))
}

/** Compares in time that depends only on the lengths, not on where they differ. */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  const x = new Uint8Array(ha)
  const y = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

const singleLine = (value: unknown) => (typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim() : '')
const multiLine = (value: unknown) => (typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '')

/** Strips control characters from a single-line value before it goes near a header. */
// eslint-disable-next-line no-control-regex
const stripControl = (value: string) => value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()

function isSameOriginUrl(value: string, env: Env): boolean {
  if (!value || /[\\\s]/.test(value)) return false
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    return new URL(value).origin === env.APP_ORIGIN
  } catch {
    return false
  }
}

function validate(raw: unknown, env: Env): { ok: true; enquiry: Enquiry } | { ok: false; fields: Record<string, string> } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const fields: Record<string, string> = {}

  const kind = body.kind
  if (kind !== 'product' && kind !== 'styling') fields.kind = 'Choose what your enquiry is about.'

  const name = stripControl(singleLine(body.name))
  if (!name) fields.name = 'Please tell us your name.'
  else if (name.length > 100) fields.name = 'Please keep your name under 100 characters.'

  const email = stripControl(singleLine(body.email))
  if (!email) fields.email = 'Please enter your email address.'
  else if (email.length > 254 || !EMAIL_PATTERN.test(email)) fields.email = 'Please enter a valid email address.'

  const phone = stripControl(singleLine(body.phone))
  if (phone.length > 30) fields.phone = 'Please keep your phone number under 30 characters.'

  const message = multiLine(body.message)
  if (message.length < 10) fields.message = 'Please write at least 10 characters.'
  else if (message.length > 2000) fields.message = 'Please keep your message under 2000 characters.'

  let product: Enquiry['product']
  if (kind === 'product') {
    const p = (body.product && typeof body.product === 'object' ? body.product : {}) as Record<string, unknown>
    const title = stripControl(singleLine(p.title))
    const url = stripControl(singleLine(p.url))
    const variant = stripControl(singleLine(p.variant))
    if (!title || title.length > 200 || variant.length > 200) fields.product = 'Tell us which piece you are asking about.'
    else if (!isSameOriginUrl(url, env) || url.length > 500) fields.product = 'That product link is not valid.'
    else product = { title, url, variant }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return { ok: true, enquiry: { kind: kind as Kind, name, email, phone, message, product } }
}

async function verifyTurnstile(token: unknown, ip: string, env: Env): Promise<boolean> {
  if (typeof token !== 'string' || !token || token.length > 2048) return false
  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token })
    if (ip) form.set('remoteip', ip)
    const response = await fetch(SITEVERIFY_URL, { method: 'POST', body: form })
    if (!response.ok) return false
    return ((await response.json()) as { success?: boolean }).success === true
  } catch {
    return false
  }
}

/** True when the IP is still under its cap. Counts this attempt. */
async function underRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `enquiry:${ip || 'unknown'}`
  const now = Date.now()
  const stored = (await env.RATE.get(key, 'json')) as { count: number; resetAt: number } | null
  const current = stored && stored.resetAt > now ? stored : { count: 0, resetAt: now + RATE_WINDOW_SECONDS * 1000 }
  if (current.count >= RATE_LIMIT) return false
  const ttl = Math.max(KV_MIN_TTL, Math.ceil((current.resetAt - now) / 1000))
  await env.RATE.put(key, JSON.stringify({ count: current.count + 1, resetAt: current.resetAt }), { expirationTtl: ttl })
  return true
}

function base64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** RFC 2047 encoded-word for header text that has non-ASCII characters. */
function headerText(value: string): string {
  return /^[\u0020-\u007e]*$/.test(value) ? value : `=?UTF-8?B?${base64Utf8(value)}?=`
}

function mailbox(name: string, address: string): string {
  if (/^[\u0020-\u007e]*$/.test(name)) return `"${name.replace(/(["\\])/g, '\\$1')}" <${address}>`
  return `${headerText(name)} <${address}>`
}

function torontoTime(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date)
}

export function buildMessage(enquiry: Enquiry, env: Env, now = new Date()): string {
  const { kind, name, email, phone, message, product } = enquiry
  const subject = kind === 'product' && product ? `Enquiry: ${product.title} (${name})` : `Styling appointment request (${name})`
  const lines = [
    `Type: ${kind === 'product' ? 'Product enquiry' : 'Styling appointment request'}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '(not given)'}`,
  ]
  if (product) {
    lines.push(`Product: ${product.title}`)
    lines.push(`URL: ${product.url.startsWith('/') ? env.APP_ORIGIN + product.url : product.url}`)
    if (product.variant) lines.push(`Variant: ${product.variant}`)
  }
  lines.push('', 'Message:', message, '', `Received: ${torontoTime(now)} (America/Toronto)`)
  const body = base64Utf8(lines.join('\r\n')).replace(/(.{76})/g, '$1\r\n')

  return [
    `From: ${mailbox(SENDER_NAME, SENDER_ADDRESS)}`,
    `To: <${env.ENQUIRY_TO}>`,
    `Reply-To: ${mailbox(name, email)}`,
    `Subject: ${headerText(subject)}`,
    `Date: ${now.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@notify.houseofmornii.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
    '',
  ].join('\r\n')
}

async function handle(request: Request, env: Env): Promise<{ response: Response; outcome: string; kind?: string }> {
  const fail = (response: Response, outcome: string, kind?: string) => ({ response, outcome, kind })

  if (request.method !== 'POST') return fail(json({ error: 'method_not_allowed' }, 405), 'method_not_allowed')
  if (!isSameOrigin(request, env)) return fail(json({ error: 'forbidden' }, 403), 'bad_origin')
  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().startsWith('application/json')) {
    return fail(json({ error: 'invalid', fields: {} }, 400), 'bad_content_type')
  }

  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) return fail(json({ error: 'invalid', fields: {} }, 400), 'too_large')
    raw = JSON.parse(text)
  } catch {
    return fail(json({ error: 'invalid', fields: {} }, 400), 'bad_json')
  }

  const result = validate(raw, env)
  if (!result.ok) return fail(json({ error: 'invalid', fields: result.fields }, 400), 'invalid')
  const { enquiry } = result
  const ip = request.headers.get('CF-Connecting-IP') ?? ''

  const dryRunHeader = request.headers.get('X-Enquiry-Dry-Run')
  const dryRun = !!env.ENQUIRY_DRY_RUN_TOKEN && !!dryRunHeader && (await safeEqual(dryRunHeader, env.ENQUIRY_DRY_RUN_TOKEN))

  if (!dryRun && !(await underRateLimit(ip, env))) return fail(json({ error: 'rate_limited' }, 429), 'rate_limited', enquiry.kind)

  const token = (raw as { turnstileToken?: unknown }).turnstileToken
  if (!(await verifyTurnstile(token, ip, env))) return fail(json({ error: 'forbidden' }, 403), 'turnstile_failed', enquiry.kind)

  if (dryRun) return fail(json({ ok: true, dryRun: true }), 'dry_run', enquiry.kind)

  try {
    await env.EMAIL.send(new EmailMessage(SENDER_ADDRESS, env.ENQUIRY_TO, buildMessage(enquiry, env)))
  } catch (error) {
    console.error('enquiry send failed', error instanceof Error ? error.message : 'unknown')
    return fail(json({ error: 'send_failed' }, 502), 'send_failed', enquiry.kind)
  }
  return fail(json({ ok: true }), 'sent', enquiry.kind)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== '/api/enquiry') return json({ error: 'not_found' }, 404)
    const { response, outcome, kind } = await handle(request, env)
    log(outcome, kind)
    return response
  },
}
