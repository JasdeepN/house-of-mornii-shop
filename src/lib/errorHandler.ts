// Unified error handler hook
// Replaces useShopifyError.ts with centralized messages from errorMessages.ts
// Provides consistent error display properties across the application

import { useMemo } from 'react'
import { StorefrontError } from '@/lib/shopify'
import {
  getErrorMessage,
  normalizeErrorCategory,
  type ErrorCategory,
  type ErrorMessage,
} from './errorMessages'
import { logger, type LogContext } from './logger'

// Error display interface for UI components
export interface ErrorDisplay {
  title: string
  message: string
  showRetry: boolean
  showHomeLink: boolean
}

// Re-export ErrorMessage for convenience
export type { ErrorMessage }

/**
 * Check if an error is a service-level failure (upstream_unavailable, misconfigured, network_error)
 */
export function isServiceError(error?: Error): boolean {
  if (!error) return false

  if (error instanceof StorefrontError) {
    return [
      'upstream_unavailable',
      'misconfigured',
      'network_error',
    ].includes(error.category)
  }

  // Treat all non-Storefront errors as service errors (they're unexpected)
  return true
}

/**
 * Get the error category from any Error object
 */
export function getErrorCategory(error: Error): ErrorCategory {
  if (error instanceof StorefrontError) {
    return normalizeErrorCategory(error.category)
  }

  return 'unknown'
}

/**
 * Build context object from error for logging
 */
function buildErrorContext(error: Error): LogContext {
  const context: LogContext = {
    action: 'errorHandler',
  }

  if (error instanceof StorefrontError) {
    // Try to extract product/collection info from message or stack
    if (error.message) {
      const productMatch = error.message.match(/product["']?:\s*([^,]+)/)
      if (productMatch) {
        context.productId = productMatch[1].trim()
      }
    }
  }

  return context
}

/**
 * React hook for getting error display properties from any Error
 * Uses centralized error messages to eliminate duplication
 *
 * @param error - The error to handle (typically from React Query's error prop)
 * @returns ErrorDisplay object or null if no error
 *
 * @example
 * const { data, error } = useProduct(productId)
 * const errorDisplay = useErrorHandler(error)
 *
 * if (errorDisplay) {
 *   return <ErrorUI title={errorDisplay.title} message={errorDisplay.message} />
 * }
 */
export function useErrorHandler(error?: Error): ErrorDisplay | null {
  return useMemo(() => {
    if (!error) {
      return null
    }

    const category = getErrorCategory(error)
    const context = buildErrorContext(error)

    // Log the error via centralized logger
    logger.error(`Error in component: ${error.name || 'unknown'}`, {
      ...context,
      action: 'useErrorHandler',
    })

    // Get user-friendly message from registry
    const message = getErrorMessage(category, context)

    return {
      title: message.title,
      message: message.message,
      showRetry: message.showRetry,
      showHomeLink: message.showHomeLink,
    }
  }, [error])
}

/**
 * Standalone error handler for non-React contexts
 * Returns ErrorDisplay without React hooks
 */
export function handleSyncError(error?: Error): ErrorDisplay | null {
  if (!error) {
    return null
  }

  const category = getErrorCategory(error)
  const context = buildErrorContext(error)

  // Log the error via centralized logger
  logger.error(`Sync error: ${error.name || 'unknown'}`, {
    ...context,
    action: 'handleSyncError',
  })

  // Get user-friendly message from registry
  const message = getErrorMessage(category, context)

  return {
    title: message.title,
    message: message.message,
    showRetry: message.showRetry,
    showHomeLink: message.showHomeLink,
  }
}
