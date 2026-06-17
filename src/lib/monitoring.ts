// External monitoring integration placeholder
// Provides a unified interface for error reporting to services like Sentry, Datadog, etc.
// Currently logs to console in all environments; integrate external SDK when DSN is configured

import { logger } from './logger'
import { STOREFRONT_MODE } from './shopify'

export type Severity = 'error' | 'warn' | 'info'

export interface MonitoringEvent {
  timestamp: string
  environment: string
  mode: typeof STOREFRONT_MODE
  severity: Severity
  message: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  context?: Record<string, unknown>
}

/**
 * Report an error event to the monitoring service
 * If SENTRY_DSN is configured, sends to Sentry; otherwise logs to console
 */
export function reportError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  const event: MonitoringEvent = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PROD ? 'production' : import.meta.env.DEV ? 'development' : 'staging',
    mode: STOREFRONT_MODE,
    severity: 'error',
    message: error.message,
    error: {
      name: error.name || 'Error',
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined, // Exclude stack in production
    },
    context,
  }

  // Send to external service if configured
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN
  if (sentryDsn) {
    reportToSentry(event)
  } else {
    // Fallback: log to console
    logger.error(`[MONITORING] ${error.name}: ${error.message}`, {
      ...context,
      action: 'reportError',
      environment: event.environment,
      mode: event.mode,
    })
  }
}

/**
 * Report a warning event
 */
export function reportWarning(
  message: string,
  context?: Record<string, unknown>,
): void {
  const event: MonitoringEvent = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PROD ? 'production' : import.meta.env.DEV ? 'development' : 'staging',
    mode: STOREFRONT_MODE,
    severity: 'warn',
    message,
    context,
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN
  if (sentryDsn) {
    // Sentry warning integration placeholder
    console.warn('[MONITORING]', event)
  } else {
    logger.warn(`[MONITORING] ${message}`, context)
  }
}

/**
 * Report an info event
 */
export function reportInfo(
  message: string,
  context?: Record<string, unknown>,
): void {
  const event: MonitoringEvent = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PROD ? 'production' : import.meta.env.DEV ? 'development' : 'staging',
    mode: STOREFRONT_MODE,
    severity: 'info',
    message,
    context,
  }

  logger.info(`[MONITORING] ${message}`, context)
}

/**
 * Placeholder for Sentry integration
 * When VITE_SENTRY_DSN is configured, initialize Sentry SDK here
 */
async function reportToSentry(event: MonitoringEvent): Promise<void> {
  // TODO: Initialize Sentry when DSN is available
  // import * as Sentry from '@sentry/react'
  // Sentry.captureException(new Error(event.message), {
  //   level: event.severity,
  //   contexts: {
  //     custom: {
  //       environment: event.environment,
  //       mode: event.mode,
  //     },
  //   },
  //   tags: {
  //     storefront_mode: event.mode,
  //   },
  // })
  
  console.error('[MONITORING] Sentry event (DSN configured but SDK not initialized):', event)
}

/**
 * Set user context for error reporting (e.g., authenticated user ID)
 */
export function setUserContext(userId: string, userEmail?: string): void {
  // TODO: Set Sentry user context
  // Sentry.setUser({ id: userId, email: userEmail })
  logger.info('[MONITORING] User context set', { userId, userEmail, action: 'setUserContext' })
}

/**
 * Add tags to all subsequent error reports
 */
export function addTags(tags: Record<string, string>): void {
  // TODO: Add Sentry tags
  // Object.entries(tags).forEach(([key, value]) => Sentry.setTag(key, value))
  logger.info('[MONITORING] Tags added', { ...tags, action: 'addTags' })
}
