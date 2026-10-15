import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry, type RetryConfig } from './retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the result immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await withRetry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on TypeError and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network error'))
      .mockResolvedValueOnce('recovered')

    const result = await withRetry(fn, { initialDelayMs: 10 })

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after maxAttempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('Network error'))

    await expect(withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })).rejects.toThrow('Network error')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry on non-retryable Error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Bad request'))

    await expect(withRetry(fn, { initialDelayMs: 10 })).rejects.toThrow('Bad request')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on retryable HTTP status codes', async () => {
    const retryableError = new Error('Server error') as Error & { statusCode: number }
    retryableError.statusCode = 503

    const fn = vi
      .fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, { initialDelayMs: 10 })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry on non-retryable HTTP status codes', async () => {
    const nonRetryableError = new Error('Bad request') as Error & { statusCode: number }
    nonRetryableError.statusCode = 400

    const fn = vi.fn().mockRejectedValue(nonRetryableError)

    await expect(withRetry(fn, { initialDelayMs: 10 })).rejects.toThrow('Bad request')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('respects custom retryableStatuses', async () => {
    const error = new Error('Forbidden') as Error & { statusCode: number }
    error.statusCode = 403

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, { initialDelayMs: 10, retryableStatuses: [403] })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('uses exponential backoff with multiplier', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('Network error'))

    const promise = withRetry(fn, { maxAttempts: 3, initialDelayMs: 100, multiplier: 2 })

    // First attempt fails, should wait 100ms
    await vi.advanceTimersByTimeAsync(100)
    // Second attempt fails, should wait 200ms
    await vi.advanceTimersByTimeAsync(200)

    await expect(promise).rejects.toThrow('Network error')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('caps delay at maxDelayMs', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('Network error'))

    const promise = withRetry(fn, {
      maxAttempts: 4,
      initialDelayMs: 1000,
      multiplier: 2,
      maxDelayMs: 1500,
    })

    // First attempt fails, wait 1000ms
    await vi.advanceTimersByTimeAsync(1000)
    // Second attempt fails, wait 2000 -> capped at 1500ms
    await vi.advanceTimersByTimeAsync(1500)
    // Third attempt fails, wait 3000 -> capped at 1500ms
    await vi.advanceTimersByTimeAsync(1500)

    await expect(promise).rejects.toThrow('Network error')
    expect(fn).toHaveBeenCalledTimes(4)
  })

  it('uses default config when no config provided', async () => {
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await withRetry(fn)

    expect(result).toBe('ok')
  })

  it('merges partial config with defaults', async () => {
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await withRetry(fn, { maxAttempts: 5 })

    expect(result).toBe('ok')
  })

  it('retries on 408 status code', async () => {
    const error = new Error('Request timeout') as Error & { statusCode: number }
    error.statusCode = 408

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, { initialDelayMs: 10 })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on 429 status code', async () => {
    const error = new Error('Too many requests') as Error & { statusCode: number }
    error.statusCode = 429

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('ok')

    const result = await withRetry(fn, { initialDelayMs: 10 })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on 500, 502, 503, 504 status codes', async () => {
    for (const status of [500, 502, 503, 504]) {
      const error = new Error(`Status ${status}`) as Error & { statusCode: number }
      error.statusCode = status

      const fn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('ok')

      const result = await withRetry(fn, { initialDelayMs: 10 })

      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(2)
    }
  })

  it('does not retry on 401 status code', async () => {
    const error = new Error('Unauthorized') as Error & { statusCode: number }
    error.statusCode = 401

    const fn = vi.fn().mockRejectedValue(error)

    await expect(withRetry(fn, { initialDelayMs: 10 })).rejects.toThrow('Unauthorized')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not retry on 404 status code', async () => {
    const error = new Error('Not found') as Error & { statusCode: number }
    error.statusCode = 404

    const fn = vi.fn().mockRejectedValue(error)

    await expect(withRetry(fn, { initialDelayMs: 10 })).rejects.toThrow('Not found')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles non-Error throwables', async () => {
    const fn = vi.fn().mockRejectedValue('string error')

    await expect(withRetry(fn, { initialDelayMs: 10 })).rejects.toBe('string error')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles errors without statusCode property', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Generic error'))

    await expect(withRetry(fn, { initialDelayMs: 10 })).rejects.toThrow('Generic error')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
