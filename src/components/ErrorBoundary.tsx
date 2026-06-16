// Error boundary component for consistent error handling
// Displays user-friendly error messages based on error category

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StorefrontError, type StorefrontErrorCategory } from '@/lib/shopify'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: StorefrontError
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    if (error instanceof StorefrontError) {
      return { hasError: true, error }
    }
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  private getCategoryTitle(category?: StorefrontErrorCategory): string {
    switch (category) {
      case 'not_found': return 'Content Not Found'
      case 'misconfigured': return 'Configuration Error'
      case 'upstream_unavailable': return 'Service Unavailable'
      case 'query_error': return 'Data Error'
      default: return 'Something went wrong'
    }
  }

  private getCategoryMessage(category?: StorefrontErrorCategory): string {
    switch (category) {
      case 'not_found':
        return 'The content you is looking for does not exist or has been removed.'
      case 'misconfigured':
        return 'The storefront is not properly configured. Please check your environment variables.'
      case 'upstream_unavailable':
        return 'Our storefront API is currently unavailable. Please try again later.'
      case 'query_error':
        return 'An error occurred while fetching data. Please try refreshing the page.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  public render() {
    if (this.state.hasError) {
      const error = this.state.error
      const category = error?.category

      // Show custom fallback if provided
      if (this.props.fallback) return this.props.fallback

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
              {this.getCategoryTitle(category)}
            </h2>
            <p className="text-muted-foreground mb-8">
              {this.getCategoryMessage(category)}
            </p>
            {category === 'misconfigured' && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                <span className="text-sm tracking-[0.2em] uppercase">Back to Home</span>
              </Link>
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
