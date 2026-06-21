// src/lib/shopify/retry.ts — Exponential backoff retry utility for Shopify API calls
//
// Implements retry logic per Shopify best practices:
// https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/error-handling

export interface RetryConfig {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  multiplier?: number
  retryableStatuses?: number[]
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  multiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

/**
 * Execute an async function with exponential backoff retry.
 * Only retries on network errors or configured HTTP status codes.
 * Non-retryable errors (4xx except listed) are thrown immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
): Promise<T> {
  const { maxAttempts = DEFAULT_CONFIG.maxAttempts!, initialDelayMs = DEFAULT_CONFIG.initialDelayMs!, maxDelayMs = DEFAULT_CONFIG.maxDelayMs!, multiplier = DEFAULT_CONFIG.multiplier!, retryableStatuses = DEFAULT_CONFIG.retryableStatuses! } = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  let lastError: Error | unknown
  let delay = initialDelayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      const shouldRetry = isRetryableError(error, retryableStatuses)
      if (!shouldRetry || attempt === maxAttempts) {
        throw error
      }

      await sleep(delay)
      delay = Math.min(delay * multiplier, maxDelayMs)
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError
}

function isRetryableError(error: Error | unknown, retryableStatuses: number[]): boolean {
  // Network errors (TypeError from fetch rejection) are always retryable
  if (error instanceof TypeError) {
    return true
  }

  // StorefrontError with statusCode property
  if (error instanceof Error && 'statusCode' in error) {
    const statusCode = (error as any).statusCode
    return typeof statusCode === 'number' && retryableStatuses.includes(statusCode)
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
