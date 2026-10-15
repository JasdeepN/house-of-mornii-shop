// Unified error handler hook
// Replaces useShopifyError.ts; the category-to-message registry (ERROR_REGISTRY) lives in this file
// Provides consistent error display properties across the application

import { useMemo } from 'react'
import { StorefrontError } from '@/lib/shopify'
import { logger, type LogContext } from './logger'

// Error categories (extended from StorefrontError)
export type ErrorCategory =
  | 'not_found'           // Resource does not exist
  | 'misconfigured'       // Invalid credentials/config
  | 'upstream_unavailable' // Shopify service error
  | 'query_error'         // GraphQL-level error
  | 'network_error'       // Unhandled network failure
  | 'unknown'             // Fallback for unhandled errors

// User-facing error message structure
export interface ErrorMessage {
  title: string           // Short heading for UI
  message: string         // Detailed explanation
  showRetry: boolean      // Whether to show retry button
  showHomeLink: boolean   // Whether to show home link
}

// Error display interface for UI components
export interface ErrorDisplay {
  title: string
  message: string
  showRetry: boolean
  showHomeLink: boolean
}

// Message registry by category
const ERROR_REGISTRY: Record<ErrorCategory, (context?: LogContext) => ErrorMessage> = {
  not_found: (context?: LogContext) => ({
    title: 'Content Not Found',
    message: context?.productId
      ? `The product "${context.productId}" you're looking for does not exist or has been removed.`
      : context?.collectionId
        ? `The collection "${context.collectionId}" you're looking for does not exist or has been removed.`
        : "The content you're looking for does not exist or has been removed.",
    showRetry: false,
    showHomeLink: true,
  }),

  misconfigured: () => ({
    title: 'Configuration Error',
    message: 'The storefront is not properly configured. Please try again later.',
    showRetry: false,
    showHomeLink: true,
  }),

  upstream_unavailable: () => ({
    title: 'Service Unavailable',
    message: "We're experiencing technical difficulties. Please try again shortly.",
    showRetry: true,
    showHomeLink: false,
  }),

  query_error: () => ({
    title: 'Data Error',
    message: 'An error occurred while loading data. Please refresh the page.',
    showRetry: true,
    showHomeLink: false,
  }),

  network_error: () => ({
    title: 'Connection Error',
    message: 'Unable to fetch products.',
    showRetry: false,
    showHomeLink: false,
  }),

  unknown: () => ({
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again later.',
    showRetry: true,
    showHomeLink: false,
  }),
}

// Map StorefrontError category string to ErrorCategory type
function normalizeErrorCategory(
  category: string
): ErrorCategory {
  const validCategories: ErrorCategory[] = [
    'not_found',
    'misconfigured',
    'upstream_unavailable',
    'query_error',
    'network_error',
  ]

  return (validCategories.includes(category as ErrorCategory)
    ? category as ErrorCategory
    : 'unknown')
}

/**
 * Check if an error is a service-level failure (upstream_unavailable, misconfigured, network_error)
 */
export function isServiceError(error?: Error | null): boolean {
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
 * Shared body of useErrorHandler and handleSyncError: categorize, log, and map to display properties.
 * Only the log prefix and the log action differ between the two callers.
 */
function describeError(error: Error, action: string, logPrefix: string): ErrorDisplay {
  const category = getErrorCategory(error)
  const context = buildErrorContext(error)

  // Log the error via centralized logger
  logger.error(`${logPrefix}: ${error.name || 'unknown'}`, {
    ...context,
    action,
  })

  // Get user-friendly message from registry
  const handler = ERROR_REGISTRY[category] || ERROR_REGISTRY.unknown
  const message = handler(context)

  return {
    title: message.title,
    message: message.message,
    showRetry: message.showRetry,
    showHomeLink: message.showHomeLink,
  }
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
export function useErrorHandler(error?: Error | null): ErrorDisplay | null {
  return useMemo(() => {
    if (!error) {
      return null
    }

    return describeError(error, 'useErrorHandler', 'Error in component')
  }, [error])
}

/**
 * Standalone error handler for non-React contexts
 * Returns ErrorDisplay without React hooks
 */
export function handleSyncError(error?: Error | null): ErrorDisplay | null {
  if (!error) {
    return null
  }

  return describeError(error, 'handleSyncError', 'Sync error')
}
