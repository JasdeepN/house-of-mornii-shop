import { describe, it, expect, vi, afterEach } from 'vitest'
import { MotionGlobalConfig } from 'framer-motion'
import { followReducedMotion } from './reduced-motion'

function mockMatchMedia(matches: boolean) {
  const listeners: (() => void)[] = []
  const query = {
    matches,
    addEventListener: (_: string, l: () => void) => listeners.push(l),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', () => query)
  return { query, fire: () => listeners.forEach((l) => l()) }
}

describe('followReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    MotionGlobalConfig.skipAnimations = false
  })

  it('skips animations when the shopper prefers reduced motion', () => {
    mockMatchMedia(true)
    followReducedMotion()
    expect(MotionGlobalConfig.skipAnimations).toBe(true)
  })

  it('keeps animations otherwise, and follows later changes', () => {
    const m = mockMatchMedia(false)
    followReducedMotion()
    expect(MotionGlobalConfig.skipAnimations).toBe(false)
    m.query.matches = true
    m.fire()
    expect(MotionGlobalConfig.skipAnimations).toBe(true)
  })
})
