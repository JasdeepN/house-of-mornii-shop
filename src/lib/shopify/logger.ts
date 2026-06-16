// Structured logging utility for Shopify Storefront API
// Logs all API events with context for debugging and monitoring

import { STOREFRONT_MODE, type StorefrontMode } from './client'
import { type StorefrontErrorCategory } from './client'

export interface ShopifyLogEntry {
  timestamp: string
  mode: StorefrontMode
  category?: StorefrontErrorCategory
  message: string
  details?: Record<string, unknown>
}

export const shopifyLogger = {
  log: (entry: ShopifyLogEntry) => {
    // In production, send to logging service (e.g., Sentry, LogRocket)
    console.log(JSON.stringify(entry))
  },

  info: (message: string, details?: Record<string, unknown>) => {
    shopifyLogger.log({
      timestamp: new Date().toISOString(),
      mode: STOREFRONT_MODE,
      message,
      details,
    })
  },

  error: (
    category: StorefrontErrorCategory,
    message: string,
    details?: Record<string, unknown>,
  ) => {
    shopifyLogger.log({
      timestamp: new Date().toISOString(),
      mode: STOREFRONT_MODE,
      category,
      message,
      details,
    })
  },
}
