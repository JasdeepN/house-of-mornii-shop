import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { useCustomerSession } from './session'
import { SignedOutError } from './errors'
import { makeWrapper, stubSession } from './test-utils'

afterEach(() => vi.unstubAllGlobals())

describe('CustomerSessionProvider', () => {
  it('starts loading, then signed-in on 200', async () => {
    const fn = stubSession('in')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomerSession(), { wrapper: Wrapper })
    expect(result.current.session.status).toBe('loading')
    await waitFor(() =>
      expect(result.current.session).toEqual({
        status: 'signed-in',
        customer: { id: 'gid://c/1', name: 'Ada Lovelace', email: 'ada@example.com' },
      }),
    )
    expect(fn.mock.calls[0][0]).toBe('/api/customer/session')
  })

  it('is signed-out on 401', async () => {
    stubSession('out')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomerSession(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
  })

  it('is signed-out, without throwing, on a network error', async () => {
    stubSession('network-error')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(() => useCustomerSession(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
  })

  it('switches to signed-out when any query fails with SignedOutError', async () => {
    stubSession('in')
    const { Wrapper } = makeWrapper()
    const { result } = renderHook(
      () => {
        useQuery({ queryKey: ['x'], retry: false, queryFn: async () => { throw new SignedOutError() } })
        return useCustomerSession()
      },
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
  })

  describe('signIn / signOut', () => {
    const assign = vi.fn()
    const original = window.location
    beforeEach(() => {
      assign.mockReset()
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '/cart', search: '?a=1', assign },
      })
    })
    afterEach(() => Object.defineProperty(window, 'location', { configurable: true, value: original }))

    it('signIn without an email', async () => {
      stubSession('out')
      const { Wrapper } = makeWrapper()
      const { result } = renderHook(() => useCustomerSession(), { wrapper: Wrapper })
      await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
      act(() => result.current.signIn())
      expect(assign).toHaveBeenCalledWith('/api/customer/sign-in?return_to=' + encodeURIComponent('/cart?a=1'))
    })

    it('signIn with an email adds login_hint', async () => {
      stubSession('out')
      const { Wrapper } = makeWrapper()
      const { result } = renderHook(() => useCustomerSession(), { wrapper: Wrapper })
      await waitFor(() => expect(result.current.session.status).toBe('signed-out'))
      act(() => result.current.signIn('a+b@example.com'))
      expect(assign).toHaveBeenCalledWith(
        '/api/customer/sign-in?return_to=' + encodeURIComponent('/cart?a=1') + '&login_hint=' + encodeURIComponent('a+b@example.com'),
      )
    })

    it('signOut submits a hidden POST form', async () => {
      stubSession('in')
      const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
      const { Wrapper } = makeWrapper()
      const { result } = renderHook(() => useCustomerSession(), { wrapper: Wrapper })
      await waitFor(() => expect(result.current.session.status).toBe('signed-in'))
      act(() => result.current.signOut())
      const form = document.body.querySelector('form') as HTMLFormElement
      expect(form.method).toBe('post')
      expect(form.getAttribute('action')).toBe('/api/customer/sign-out')
      expect(form.hidden).toBe(true)
      expect(submit).toHaveBeenCalledOnce()
      form.remove()
      submit.mockRestore()
    })
  })
})
