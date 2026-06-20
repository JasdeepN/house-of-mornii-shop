// Error handler unit tests
// Tests the centralized error handling system including useErrorHandler, isServiceError, and getErrorCategory

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { StorefrontError } from './shopify'
import { useErrorHandler, isServiceError, getErrorCategory, handleSyncError } from './errorHandler'

describe('getErrorCategory', () => {
  it('returns correct category for StorefrontError', () => {
    expect(getErrorCategory(new StorefrontError('Not found', 'not_found'))).toBe('not_found')
    expect(getErrorCategory(new StorefrontError('API down', 'upstream_unavailable'))).toBe('upstream_unavailable')
    expect(getErrorCategory(new StorefrontError('Bad config', 'misconfigured'))).toBe('misconfigured')
    expect(getErrorCategory(new StorefrontError('Query error', 'query_error'))).toBe('query_error')
    expect(getErrorCategory(new StorefrontError('Network error', 'network_error'))).toBe('network_error')
  })

  it('returns unknown for non-StorefrontError', () => {
    expect(getErrorCategory(new Error('Generic error'))).toBe('unknown')
    expect(getErrorCategory(new TypeError('Type error'))).toBe('unknown')
  })
})

describe('isServiceError', () => {
  it('returns true for service-level errors', () => {
    expect(isServiceError(new StorefrontError('API down', 'upstream_unavailable'))).toBe(true)
    expect(isServiceError(new StorefrontError('Bad config', 'misconfigured'))).toBe(true)
    expect(isServiceError(new StorefrontError('Network error', 'network_error'))).toBe(true)
  })

  it('returns false for resource errors', () => {
    expect(isServiceError(new StorefrontError('Not found', 'not_found'))).toBe(false)
    expect(isServiceError(new StorefrontError('Query error', 'query_error'))).toBe(false)
  })

  it('returns true for non-StorefrontError (unexpected errors)', () => {
    expect(isServiceError(new Error('Generic error'))).toBe(true)
  })

  it('returns false for undefined', () => {
    expect(isServiceError(undefined)).toBe(false)
  })
})

describe('useErrorHandler', () => {
  it('returns null when no error', () => {
    const { result } = renderHook(() => useErrorHandler(undefined))
    expect(result.current).toBeNull()
  })

  it('returns correct display for not_found', () => {
    const error = new StorefrontError('Product not found', 'not_found', 404)
    const { result } = renderHook(() => useErrorHandler(error))
    
    expect(result.current).not.toBeNull()
    expect(result.current!.title).toBe('Content Not Found')
    expect(result.current!.showRetry).toBe(false)
    expect(result.current!.showHomeLink).toBe(true)
  })

  it('returns correct display for upstream_unavailable', () => {
    const error = new StorefrontError('API down', 'upstream_unavailable', 500)
    const { result } = renderHook(() => useErrorHandler(error))
    
    expect(result.current).not.toBeNull()
    expect(result.current!.title).toBe('Service Unavailable')
    expect(result.current!.showRetry).toBe(true)
    expect(result.current!.showHomeLink).toBe(false)
  })

  it('returns correct display for misconfigured', () => {
    const error = new StorefrontError('Bad config', 'misconfigured', 401)
    const { result } = renderHook(() => useErrorHandler(error))
    
    expect(result.current).not.toBeNull()
    expect(result.current!.title).toBe('Configuration Error')
    expect(result.current!.showRetry).toBe(false)
    expect(result.current!.showHomeLink).toBe(true)
  })

  it('returns correct display for network_error', () => {
    const error = new StorefrontError('DNS failed', 'network_error')
    const { result } = renderHook(() => useErrorHandler(error))
    
    expect(result.current).not.toBeNull()
    expect(result.current!.title).toBe('Connection Error')
    expect(result.current!.showRetry).toBe(false)
  })

  it('returns correct display for unknown errors', () => {
    const error = new Error('Something unexpected')
    const { result } = renderHook(() => useErrorHandler(error))
    
    expect(result.current).not.toBeNull()
    expect(result.current!.title).toBe('Something Went Wrong')
    expect(result.current!.showRetry).toBe(true)
  })
})

describe('handleSyncError', () => {
  it('returns null when no error', () => {
    expect(handleSyncError(undefined)).toBeNull()
  })

  it('returns display for StorefrontError', () => {
    const error = new StorefrontError('Not found', 'not_found')
    const result = handleSyncError(error)
    
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Content Not Found')
  })

  it('returns display for generic Error', () => {
    const error = new Error('Unexpected error')
    const result = handleSyncError(error)
    
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Something Went Wrong')
  })
})
