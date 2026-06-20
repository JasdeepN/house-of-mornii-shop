// Error boundary component for consistent error handling
// Displays user-friendly error messages based on error category
// Uses centralized logger and error message registry

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StorefrontError } from '@/lib/shopify'
import { Link } from 'react-router-dom'
import { logger } from '@/lib/logger'
import { getErrorMessage, normalizeErrorCategory } from '@/lib/errorMessages'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught error', {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      errorName: error.name,
    })
  }

  private getErrorDisplay() {
    const error = this.state.error
    if (!error) {
      return getErrorMessage('unknown')
    }

    if (error instanceof StorefrontError) {
      const category = normalizeErrorCategory(error.category)
      return getErrorMessage(category, error.context)
    }

    return getErrorMessage('unknown')
  }

  public render() {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) return this.props.fallback

      const display = this.getErrorDisplay()

      return (
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="container px-4 text-center max-w-md">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4.016A11.955 11.955 11.955 11.955 12 2a12 12 12 12 2.016 11.955 11.955 11.955 11.955 12 2a12 12 12 12 2.016 11.955 11.955 11.955 11.955 12 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold tracking-wider mb-4">
              {display.title}
            </h2>
            <p className="text-muted-foreground mb-8">
              {display.message}
            </p>
            {(display.showHomeLink || display.title === 'Configuration Error') && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                <span className="text-sm tracking-[0.2em] uppercase">Back to Home</span>
              </Link>
            )}
            {display.showRetry && (
              <button
                onClick={() => window.location.reload()}
                className="text-accent hover:underline tracking-widest text-sm"
              >
                TRY AGAIN
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
export default ErrorBoundary
