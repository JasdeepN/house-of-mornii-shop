import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('WelcomePopup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  async function renderPopup() {
    const { WelcomePopup } = await import('./WelcomePopup')
    render(<WelcomePopup />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
  }

  it('stays closed while the popup is switched off', async () => {
    vi.stubEnv('VITE_WELCOME_POPUP_ENABLED', '')

    await renderPopup()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('hom_welcome_shown')).toBeNull()
  })

  it('opens after four seconds when switched on', async () => {
    vi.stubEnv('VITE_WELCOME_POPUP_ENABLED', 'true')

    await renderPopup()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(sessionStorage.getItem('hom_welcome_shown')).toBe('1')
  })
})
