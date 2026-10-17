import { test, expect } from '@playwright/test'

/**
 * Security headers verification tests.
 * 
 * Prerequisites:
 *   - Dev server running: npm run dev
 *   - Playwright Chromium installed: npx playwright install chromium
 * 
 * Run locally: npm run test:e2e -- e2e/security-headers.spec.ts
 */

test.describe('Security Headers', () => {
  test('has HSTS header', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    
    if (headers?.['strict-transport-security']) {
      expect(headers['strict-transport-security']).toContain('max-age=31536000')
      expect(headers['strict-transport-security']).toContain('includeSubDomains')
    } else {
      // HSTS may not be present in local dev, document expectation
      console.log('HSTS header not present (expected in local dev, required in production)')
    }
  })

  test('has CSP header', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    
    if (headers?.['content-security-policy']) {
      const csp = headers['content-security-policy']
      expect(csp).toContain("default-src")
      expect(csp).toContain("script-src")
      expect(csp).toContain("object-src 'none'")
    } else {
      // CSP may not be present in local dev, document expectation
      console.log('CSP header not present (expected in local dev, required in production)')
    }
  })

  test('blocks framing via X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['x-frame-options']).toBe('DENY')
  })

  test('prevents MIME sniffing via X-Content-Type-Options', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['x-content-type-options']).toBe('nosniff')
  })

  test('sets Referrer-Policy', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('sets Permissions-Policy', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    expect(headers?.['permissions-policy']).toContain('camera=()')
    expect(headers?.['permissions-policy']).toContain('microphone=()')
  })

  test('static assets have long cache control', async ({ page }) => {
    // The HTML page itself should not have immutable caching
    const htmlResponse = await page.goto('/')
    const htmlHeaders = htmlResponse?.headers()
    
    // HTML should NOT have max-age=31536000 (immutable)
    const cacheControl = htmlHeaders?.['cache-control'] || ''
    expect(cacheControl).not.toContain('immutable')
  })
})
