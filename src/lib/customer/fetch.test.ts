import { afterEach, describe, expect, it, vi } from 'vitest'
import { customerFetch } from './fetch'
import { SignedOutError } from './errors'

function stub(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, ...response })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('customerFetch', () => {
  it('POSTs JSON to the same-origin passthrough and returns data', async () => {
    const fn = stub({ json: async () => ({ data: { customer: { id: '1' } } }) })
    const result = await customerFetch('query { customer { id } }', { a: 1 })
    expect(result).toEqual({ customer: { id: '1' } })
    const [url, init] = fn.mock.calls[0]
    expect(url).toBe('/api/customer/graphql')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('same-origin')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ query: 'query { customer { id } }', variables: { a: 1 } })
  })

  it('throws SignedOutError on 401', async () => {
    stub({ ok: false, status: 401 })
    await expect(customerFetch('q')).rejects.toBeInstanceOf(SignedOutError)
  })

  it('throws a plain Error on other non-OK statuses', async () => {
    stub({ ok: false, status: 502 })
    const err = await customerFetch('q').catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(SignedOutError)
  })

  it('throws the first GraphQL error message', async () => {
    stub({ json: async () => ({ errors: [{ message: 'first' }, { message: 'second' }] }) })
    await expect(customerFetch('q')).rejects.toThrow('first')
  })
})
