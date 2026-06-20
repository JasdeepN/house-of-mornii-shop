import { describe, it, expect } from 'vitest'
import {
  luxuryEase,
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  pageTransition,
  pageTransitionConfig,
  viewportOnce,
} from './animations'

describe('luxuryEase', () => {
  it('is a 4-element cubic-bezier array', () => {
    expect(luxuryEase).toHaveLength(4)
    luxuryEase.forEach((v) => expect(typeof v).toBe('number'))
  })
})

describe('fadeSlideUp', () => {
  it('has hidden and visible states', () => {
    expect(fadeSlideUp.hidden).toBeDefined()
    expect(fadeSlideUp.visible).toBeDefined()
  })

  it('hidden starts with opacity 0 and positive y', () => {
    expect(fadeSlideUp.hidden.opacity).toBe(0)
    expect(fadeSlideUp.hidden.y).toBeGreaterThan(0)
  })

  it('visible ends with opacity 1 and y 0', () => {
    expect(fadeSlideUp.visible.opacity).toBe(1)
    expect(fadeSlideUp.visible.y).toBe(0)
  })
})

describe('staggerContainer', () => {
  it('has staggerChildren in visible transition', () => {
    expect(staggerContainer.visible.transition.staggerChildren).toBeGreaterThan(0)
  })
})

describe('staggerItem', () => {
  it('visible is a function accepting index', () => {
    expect(typeof staggerItem.visible).toBe('function')
    const result = staggerItem.visible(2)
    expect(result.opacity).toBe(1)
    expect(result.transition.delay).toBeGreaterThan(0)
  })
})

describe('pageTransition', () => {
  it('has initial, animate, and exit states', () => {
    expect(pageTransition.initial).toBeDefined()
    expect(pageTransition.animate).toBeDefined()
    expect(pageTransition.exit).toBeDefined()
  })

  it('animate has full opacity', () => {
    expect(pageTransition.animate.opacity).toBe(1)
  })
})

describe('pageTransitionConfig', () => {
  it('has duration and ease', () => {
    expect(pageTransitionConfig.duration).toBeGreaterThan(0)
    expect(pageTransitionConfig.ease).toBe(luxuryEase)
  })
})

describe('viewportOnce', () => {
  it('has once: true', () => {
    expect(viewportOnce.once).toBe(true)
  })

  it('has a negative margin', () => {
    expect(viewportOnce.margin).toMatch(/^-/)
  })
})
