import { test, expect } from '../support/test'
import { isDevTarget } from '../support/env'

test.describe('dev target guard', () => {
  test('accepts only the exact dev origin', () => {
    expect(isDevTarget('https://dev.houseofmornii.com')).toBe(true)
    expect(isDevTarget('https://dev.houseofmornii.com/shop?x=1')).toBe(true)
  })

  test('rejects production and look-alikes', () => {
    for (const url of [
      'https://houseofmornii.com',
      'https://www.houseofmornii.com',
      'https://dev.houseofmornii.com.evil.com',
      'https://evil.com/https://dev.houseofmornii.com',
      'https://dev.houseofmornii.com@evil.com',
      'http://dev.houseofmornii.com',
      'https://dev.houseofmornii.com:8443',
      'http://localhost:5173',
      'not a url',
      '',
    ]) {
      expect(isDevTarget(url), url).toBe(false)
    }
  })
})
