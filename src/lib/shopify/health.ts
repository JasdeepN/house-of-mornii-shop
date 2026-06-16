// Health check utilities for Shopify Storefront API
// Provides status information for deployment verification and monitoring

import { STOREFRONT_MODE, IS_CONFIGURED } from './client'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  mode: typeof STOREFRONT_MODE
  configured: boolean
  timestamp: string
}

export function getHealthStatus(): HealthStatus {
  let status: HealthStatus['status'] = 'healthy'

  if (STOREFRONT_MODE === 'demo') {
    status = 'degraded'
  } else if (!IS_CONFIGURED) {
    status = 'unhealthy'
  }

  return {
    status,
    mode: STOREFRONT_MODE,
    configured: IS_CONFIGURED,
    timestamp: new Date().toISOString(),
  }
}
