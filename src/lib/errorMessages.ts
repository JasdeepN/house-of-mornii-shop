// Centralized error message registry
// Eliminates duplication across ErrorBoundary, ProductPage, CollectionPage, and hooks
// Maps error categories to user-friendly messages

import type { LogContext } from './logger'

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

// Map category + context to user-friendly message
export function getErrorMessage(
  category: ErrorCategory,
  context?: LogContext
): ErrorMessage {
  const handler = ERROR_REGISTRY[category] || ERROR_REGISTRY.unknown
  return handler(context)
}

// Individual category getters (for granular control)
export function getNotFoundMessage(context?: LogContext): ErrorMessage {
  return ERROR_REGISTRY.not_found(context)
}

export function getMisconfiguredMessage(): ErrorMessage {
  return ERROR_REGISTRY.misconfigured()
}

export function getUnavailableMessage(): ErrorMessage {
  return ERROR_REGISTRY.upstream_unavailable()
}

export function getQueryErrorMessage(): ErrorMessage {
  return ERROR_REGISTRY.query_error()
}

export function getNetworkErrorMessage(): ErrorMessage {
  return ERROR_REGISTRY.network_error()
}

// Generic fallback for unhandled errors
export function getGenericErrorMessage(showRetry?: boolean): ErrorMessage {
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again later.',
    showRetry: showRetry ?? true,
    showHomeLink: false,
  }
}

// Map StorefrontError category string to ErrorCategory type
export function normalizeErrorCategory(
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
