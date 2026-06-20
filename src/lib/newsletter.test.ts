import { describe, it, expect, vi, afterEach } from 'vitest'
import { subscribeToNewsletter, NewsletterSubscriptionError } from './newsletter'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('subscribeToNewsletter', () => {
  it('uses prototype mode when no endpoint is configured', async () => {
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', '')
    vi.useFakeTimers()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = subscribeToNewsletter({ email: 'guest@example.com', source: 'test' })

    await vi.advanceTimersByTimeAsync(300)
    await expect(result).resolves.toEqual({ mode: 'prototype' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts to the configured provider-neutral endpoint', async () => {
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', '/api/newsletter')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(subscribeToNewsletter({ email: 'guest@example.com', source: 'footer' })).resolves.toEqual({ mode: 'endpoint' })

    expect(fetchMock).toHaveBeenCalledWith('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'guest@example.com', source: 'footer' }),
    })
  })

  it('throws when the configured endpoint rejects the subscription', async () => {
    vi.stubEnv('VITE_NEWSLETTER_ENDPOINT', '/api/newsletter')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await expect(subscribeToNewsletter({ email: 'guest@example.com', source: 'footer' })).rejects.toBeInstanceOf(NewsletterSubscriptionError)
  })
})