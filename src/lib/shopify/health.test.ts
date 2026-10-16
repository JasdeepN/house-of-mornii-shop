import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the client module to control STOREFRONT_MODE and IS_CONFIGURED
vi.mock('./client', () => ({
  STOREFRONT_MODE: 'token',
  IS_CONFIGURED: true,
}))

describe('health', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getHealthStatus', () => {
    it('returns healthy status when IS_CONFIGURED is true', async () => {
      const { getHealthStatus } = await import('./health')
      const result = getHealthStatus()

      expect(result.status).toBe('healthy')
      expect(result.configured).toBe(true)
    })

    it('returns mode "token"', async () => {
      const { getHealthStatus } = await import('./health')
      const result = getHealthStatus()

      expect(result.mode).toBe('token')
    })

    it('returns a valid ISO timestamp', async () => {
      const { getHealthStatus } = await import('./health')
      const result = getHealthStatus()

      expect(result.timestamp).toBeDefined()
      // Verify it's a valid ISO string
      const parsed = new Date(result.timestamp)
      expect(parsed.toString()).not.toBe('Invalid Date')
    })

    it('returns all required HealthStatus fields', async () => {
      const { getHealthStatus } = await import('./health')
      const result = getHealthStatus()

      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('mode')
      expect(result).toHaveProperty('configured')
      expect(result).toHaveProperty('timestamp')
    })

    it('returns unhealthy status when IS_CONFIGURED is false', async () => {
      vi.doMock('./client', () => ({
        STOREFRONT_MODE: 'token',
        IS_CONFIGURED: false,
      }))

      const { getHealthStatus } = await import('./health')
      const result = getHealthStatus()

      expect(result.status).toBe('unhealthy')
      expect(result.configured).toBe(false)
    })
  })
})
