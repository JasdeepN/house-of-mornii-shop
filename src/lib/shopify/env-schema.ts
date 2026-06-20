// Environment variable validation schema using Zod
// Ensures required Shopify credentials are present and valid

import { z } from 'zod'

const StorefrontModeSchema = z.enum(['demo', 'tokenless', 'token'])

const EnvSchema = z.object({
  VITE_SHOPIFY_STORE_DOMAIN: z.string().optional(),
  VITE_SHOPIFY_STOREFRONT_TOKEN: z.string().optional(),
  VITE_SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().optional(),
})

export function validateEnv(): {
  mode: StorefrontMode
  errors: string[]
} {
  const parsed = EnvSchema.safeParse(import.meta.env)
  
  if (!parsed.success) {
    return {
      mode: 'demo',
      errors: parsed.error.errors.map(e => e.message),
    }
  }

  const { VITE_SHOPIFY_STORE_DOMAIN, VITE_SHOPIFY_STOREFRONT_TOKEN } = parsed.data
  
  if (!VITE_SHOPIFY_STORE_DOMAIN) {
    return { mode: 'demo', errors: ['VITE_SHOPIFY_STORE_DOMAIN is required'] }
  }

  if (VITE_SHOPIFY_STOREFRONT_TOKEN) {
    return { mode: 'token', errors: [] }
  }

  return { mode: 'tokenless', errors: [] }
}
