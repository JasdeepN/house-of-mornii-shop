// Hook for getting error display properties from StorefrontError
// Provides consistent error messages across the application

import { useMemo } from 'react'
import { StorefrontError, type StorefrontErrorCategory } from '@/lib/shopify'

export interface ErrorDisplay {
  title: string
  message: string
  showRetry: boolean
  showHomeLink: boolean
}

export function useShopifyError(error?: Error): ErrorDisplay | null {
  return useMemo(() => {
    if (!error || !(error instanceof StorefrontError)) {
      return null
    }

    const { category } = error

    switch (category) {
      case 'not_found':
        return {
          title: 'Content Not Found',
          message: 'The content you is looking for does not exist or has been removed.',
          showRetry: false,
          showHomeLink: true,
        }
      case 'misconfigured':
        return {
          title: 'Configuration Error',
          message: 'The storefront is not properly configured. Please check your environment variables.',
          showRetry: false,
          showHomeLink: true,
        }
      case 'upstream_unavailable':
        return {
          title: 'Service Unavailable',
          message: 'Our storefront API is currently unavailable. Please try again later.',
          showRetry: true,
          showHomeLink: false,
        }
      case 'query_error':
        return {
          title: 'Data Error',
          message: 'An error occurred while fetching data. Please try refreshing the page.',
          showRetry: true,
          showHomeLink: false,
        }
      default:
        return null
    }
  }, [error])
}
