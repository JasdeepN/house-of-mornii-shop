import type { BrowserContext } from '@playwright/test'
import { BASE_URL } from './env'

/**
 * Lets a browser context through Cloudflare Access, for the private preview (#62).
 *
 * The Zero Trust organisation uses strict service-token authentication, so Access sets no
 * cookie: every request to the target needs the service token's two headers. They go to the
 * target origin only. Sent to Shopify they would leak the token and fail its CORS preflight,
 * and Chromium does not carry them across a redirect to another host.
 *
 * Does nothing unless E2E_ACCESS_CLIENT_ID and E2E_ACCESS_CLIENT_SECRET are set.
 */
export async function passAccess(context: BrowserContext): Promise<void> {
  const id = process.env.E2E_ACCESS_CLIENT_ID
  const secret = process.env.E2E_ACCESS_CLIENT_SECRET
  if (!id || !secret) return
  const origin = new URL(BASE_URL).origin
  await context.route(
    (url) => url.origin === origin,
    (route) =>
      route.continue({
        headers: { ...route.request().headers(), 'cf-access-client-id': id, 'cf-access-client-secret': secret },
      }),
  )
}
