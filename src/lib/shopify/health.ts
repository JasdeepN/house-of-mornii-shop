// Health check utilities for Shopify Storefront API
// Provides status information for deployment verification and monitoring

import { STOREFRONT_MODE, IS_CONFIGURED } from './client'

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  mode: typeof STOREFRONT_MODE
  configured: boolean
  timestamp: string
}

export function getHealthStatus(): HealthStatus {
  // Always 'healthy' at runtime — the app throws on startup in client.ts
  // if live Shopify credentials are missing, so this code path is only
  // ever reached when properly configured.
  const status: HealthStatus['status'] = IS_CONFIGURED ? 'healthy' : 'unhealthy'

  return {
    status,
    mode: STOREFRONT_MODE,
    configured: IS_CONFIGURED,
    timestamp: new Date().toISOString(),
  }
}
