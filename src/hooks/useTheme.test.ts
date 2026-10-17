import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('always returns light', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('ignores a stored dark preference and toggling', () => {
    localStorage.setItem('hom-theme-preference', 'dark')
    const { result } = renderHook(() => useTheme())
    result.current.toggleTheme()
    expect(result.current.theme).toBe('light')
    expect(document.body.getAttribute('data-theme')).toBe('light')
  })
})
