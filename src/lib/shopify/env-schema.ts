// Environment variable validation schema using Zod
// Ensures required Shopify credentials are present and valid

import { z } from 'zod'
import type { StorefrontMode } from './client'

const EnvSchema = z.object({
  VITE_SHOPIFY_STORE_DOMAIN: z.string().optional(),
  VITE_SHOPIFY_STOREFRONT_TOKEN: z.string().optional(),
  // C2: Client only knows whether the Admin proxy is enabled (non-secret flag).
  // The real Admin token (SHOPIFY_ADMIN_ACCESS_TOKEN) is server-side only, in the Worker.
  VITE_SHOPIFY_ADMIN_PROXY_ENABLED: z.string().optional(),
})

/**
 * Validates that required Shopify credentials are present.
 * Only 'token' mode is supported — the app throws on startup in `client.ts`
 * if credentials are missing, so this always resolves to 'token' when errors
 * is empty. Errors are still surfaced for diagnostic purposes (e.g. HealthPage).
 */
export function validateEnv(): {
  mode: StorefrontMode
  errors: string[]
} {
  const parsed = EnvSchema.safeParse(import.meta.env)
  const errors: string[] = []

  if (!parsed.success) {
    errors.push(...parsed.error.errors.map(e => e.message))
  } else {
    const { VITE_SHOPIFY_STORE_DOMAIN, VITE_SHOPIFY_STOREFRONT_TOKEN } = parsed.data

    if (!VITE_SHOPIFY_STORE_DOMAIN) {
      errors.push('VITE_SHOPIFY_STORE_DOMAIN is required')
    }
    if (!VITE_SHOPIFY_STOREFRONT_TOKEN) {
      errors.push('VITE_SHOPIFY_STOREFRONT_TOKEN is required')
    }
  }

  return { mode: 'token', errors }
}
