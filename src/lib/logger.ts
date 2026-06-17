// Centralized logging utility with dev/prod differentiation
// Dev mode: Full stack traces, error context, timestamps, colored output
// Prod mode: Sanitized messages, structured JSON for future Sentry/Datadog integration

const IS_DEV = import.meta.env.DEV

// Severity levels
export type LogLevel = 'error' | 'warn' | 'info'

// Context object attached to all log entries
export interface LogContext {
  component?: string      // React component name
  page?: string           // Current route/page
  productId?: string      // Product ID context
  collectionId?: string   // Collection ID context
  variantId?: string      // Variant ID context
  action?: string         // User action that triggered error
  [key: string]: unknown  // Extensible for future fields
}

// Base log entry structure (used in both dev and prod)
export interface LogEntry {
  timestamp: string       // ISO 8601 format
  level: LogLevel
  message: string         // Sanitized for prod, detailed for dev
  context?: LogContext
  stack?: string          // Only in dev mode
  metadata?: Record<string, unknown>
}

// ANSI color codes for terminal output
const COLORS = {
  error: '\x1b[31m',    // Red
  warn: '\x1b[33m',     // Yellow
  info: '\x1b[36m',     // Cyan
  reset: '\x1b[0m',
  bold: '\x1b[1m',
} as const

// Format a log entry for console output in dev mode
function formatDevEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, stack } = entry
  const color = COLORS[level] || ''
  const reset = COLORS.reset
  const bold = COLORS.bold

  let output = `${bold}${color}[${level.toUpperCase()}]${reset} ${color}[${timestamp}]${reset} ${bold}${message}${reset}`

  if (context && Object.keys(context).length > 0) {
    output += `\n${color}┌─────────────────────────────────────────────────────┐${reset}`
    for (const [key, value] of Object.entries(context)) {
      const displayValue = typeof value === 'string' ? value : JSON.stringify(value)
      output += `\n│ ${bold}${key}:${' '.repeat(Math.max(1, 40 - key.length))}${reset} ${displayValue}`
    }
    output += `\n${color}└─────────────────────────────────────────────────────┘${reset}`
  }

  if (stack && IS_DEV) {
    output += `\n${color}│ Stack trace:${' '.repeat(53)}${reset}`
    const lines = stack.split('\n')
    for (const line of lines.slice(0, 5)) { // Limit to 5 lines
      output += `\n│ ${line.trim()}`
    }
    if (lines.length > 5) {
      output += `\n│ ... (${lines.length - 5} more lines)`
    }
    output += `\n${color}└─────────────────────────────────────────────────────┘${reset}`
  }

  return output
}

// Format a log entry for structured output in prod mode
function formatProdEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, metadata } = entry
  // Sanitize: exclude stack traces in production
  const sanitizedEntry: Record<string, unknown> = {
    timestamp,
    level,
    message,
  }

  if (context && Object.keys(context).length > 0) {
    sanitizedEntry.context = context
  }

  if (metadata && Object.keys(metadata).length > 0) {
    sanitizedEntry.metadata = metadata
  }

  return JSON.stringify(sanitizedEntry)
}

// Child logger interface with pre-populated context
export interface ChildLogger {
  error(message: string, metadata?: Record<string, unknown>): void
  warn(message: string, metadata?: Record<string, unknown>): void
  info(message: string, metadata?: Record<string, unknown>): void
}

// Main logger interface
export interface ILogger {
  error(message: string, context?: LogContext, metadata?: Record<string, unknown>): void
  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void
  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void

  // Child logger with pre-populated context
  child(context: LogContext): ChildLogger
}

// Create a child logger with pre-populated context
function createChildLogger(parentContext: LogContext): ChildLogger {
  return {
    error: (message: string, metadata?: Record<string, unknown>) => {
      logger.error(message, parentContext, metadata)
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
      logger.warn(message, parentContext, metadata)
    },
    info: (message: string, metadata?: Record<string, unknown>) => {
      logger.info(message, parentContext, metadata)
    },
  }
}

// Main logger instance
export const logger: ILogger = {
  error: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      stack: IS_DEV ? new Error().stack : undefined,
      metadata,
    }

    if (IS_DEV) {
      console.error(formatDevEntry(entry))
    } else {
      console.error(formatProdEntry(entry))
    }
  },

  warn: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      metadata,
    }

    if (IS_DEV) {
      console.warn(formatDevEntry(entry))
    } else {
      console.warn(formatProdEntry(entry))
    }
  },

  info: (message: string, context?: LogContext, metadata?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      metadata,
    }

    if (IS_DEV) {
      console.log(formatDevEntry(entry))
    } else {
      console.log(formatProdEntry(entry))
    }
  },

  child: createChildLogger,
}

// Default export for convenience
export default logger
