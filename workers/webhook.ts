// workers/webhook.ts — Shopify webhook HMAC verification + topic dispatch
//
// Shopify signs every webhook request body with HMAC-SHA256 using the shared
// secret configured for the webhook subscription (SHOPIFY_WEBHOOK_SECRET).
// The signature is sent base64-encoded in the `X-Shopify-Hmac-Sha256` header.
//
// Verification uses the Web Crypto API (`crypto.subtle`), available natively
// in the Cloudflare Workers runtime (no Node crypto polyfill needed).

export interface WebhookEnv {
  SHOPIFY_WEBHOOK_SECRET?: string
  [key: string]: unknown
}

/**
 * Compute the base64-encoded HMAC-SHA256 signature of `body` using `secret`.
 */
async function computeHmacSha256Base64(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))

  // Convert ArrayBuffer -> base64
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Constant-time string comparison to avoid timing side-channels when
 * comparing HMAC digests. Both inputs are compared as UTF-8 byte sequences;
 * if lengths differ the function still compares full length to avoid
 * leaking length via early-exit timing, then returns false.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)

  const maxLength = Math.max(aBytes.length, bBytes.length)
  let mismatch = aBytes.length === bBytes.length ? 0 : 1

  for (let i = 0; i < maxLength; i++) {
    const aByte = i < aBytes.length ? aBytes[i] : 0
    const bByte = i < bBytes.length ? bBytes[i] : 0
    mismatch |= aByte ^ bByte
  }

  return mismatch === 0
}

/**
 * Verify a Shopify webhook request's HMAC signature.
 *
 * @param rawBody - the exact raw request body string (must be read/verified
 *                  before JSON parsing since re-serialization can alter bytes)
 * @param hmacHeader - value of the `X-Shopify-Hmac-Sha256` header, or null if missing
 * @param secret - the SHOPIFY_WEBHOOK_SECRET value
 */
export async function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null,
  secret: string | undefined
): Promise<boolean> {
  if (!secret || !hmacHeader) {
    return false
  }

  const expected = await computeHmacSha256Base64(secret, rawBody)
  return timingSafeEqual(expected, hmacHeader)
}

export interface WebhookDispatchResult {
  topic: string
  handled: boolean
}

/**
 * Side-effect dispatch for a verified webhook. Currently: structured logging
 * plus an optional notification stub. Future automation (e.g. Slack/email)
 * can extend `notify()` without touching the HMAC verification logic.
 */
export async function dispatchWebhookTopic(
  topic: string,
  payload: unknown
): Promise<WebhookDispatchResult> {
  switch (topic) {
    case 'orders/create': {
      console.log(
        JSON.stringify({
          level: 'info',
          event: 'webhook.orders_create',
          topic,
          orderId: (payload as { id?: unknown })?.id,
        })
      )
      await notify('orders/create', payload)
      return { topic, handled: true }
    }
    case 'inventory_levels/update': {
      console.log(
        JSON.stringify({
          level: 'info',
          event: 'webhook.inventory_levels_update',
          topic,
          inventoryItemId: (payload as { inventory_item_id?: unknown })?.inventory_item_id,
        })
      )
      await notify('inventory_levels/update', payload)
      return { topic, handled: true }
    }
    default: {
      console.log(
        JSON.stringify({
          level: 'info',
          event: 'webhook.unhandled_topic',
          topic,
        })
      )
      return { topic, handled: false }
    }
  }
}

/**
 * Notification stub — no external integration wired up yet. Replace with a
 * real Slack/email call in a follow-up iteration. Intentionally a no-op
 * beyond a debug log so side effects stay idempotent for webhook retries.
 */
async function notify(topic: string, _payload: unknown): Promise<void> {
  console.log(JSON.stringify({ level: 'debug', event: 'webhook.notify_stub', topic }))
}
