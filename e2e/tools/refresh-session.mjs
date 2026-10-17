#!/usr/bin/env node
// Refreshes the saved Customer session that the dev-only end-to-end journeys use.
//   npm run e2e:session               saves E2E_CUSTOMER_SESSION to .env.e2e.local
//   npm run e2e:session -- --github   also stores it as the GitHub "dev" environment secret
// Shopify emails a one-time code to the test Customer; type it here within 10 minutes
// (the customer-session Worker's sign-in window).
import { chromium } from '@playwright/test'
import { createInterface } from 'node:readline/promises'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const BASE = 'https://dev.houseofmornii.com'
const EMAIL = 'jasdeepn4+hom-e2e@gmail.com'
const ENV_FILE = '.env.e2e.local'
const COOKIE = 'hom_customer_session'

const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(30_000)

  await page.goto(`${BASE}/api/customer/sign-in?return_to=%2Faccount&login_hint=${encodeURIComponent(EMAIL)}`)
  const email = page.locator('input[type="email"]:visible').first()
  await email.waitFor()
  if (!(await email.inputValue())) await email.fill(EMAIL)
  await email.press('Enter')

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const code = (await rl.question(`Shopify is emailing a 6-digit code to ${EMAIL}. Enter it within 10 minutes: `)).trim()
  rl.close()
  if (!/^\d{6}$/.test(code)) throw new Error('Expected a 6-digit code')

  const boxes = page.locator('input:visible')
  await boxes.first().waitFor()
  if ((await boxes.count()) >= 6) {
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill(code[i])
  } else {
    await boxes.first().fill(code)
    await boxes.first().press('Enter')
  }
  await page.waitForURL((url) => url.origin === BASE, { timeout: 60_000 })

  const session = await page.evaluate(async () => (await fetch('/api/customer/session', { credentials: 'same-origin' })).status)
  if (session !== 200) throw new Error(`Signed in at Shopify, but ${BASE} reports no session (status ${session}). Start again.`)
  const cookie = (await context.cookies(BASE)).find((c) => c.name === COOKIE)
  if (!cookie) throw new Error(`No ${COOKIE} cookie after signing in`)

  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split('\n') : []
  const at = lines.findIndex((l) => l.startsWith('E2E_CUSTOMER_SESSION='))
  if (at >= 0) lines[at] = `E2E_CUSTOMER_SESSION=${cookie.value}`
  else lines.push(`E2E_CUSTOMER_SESSION=${cookie.value}`)
  writeFileSync(ENV_FILE, lines.join('\n'), { mode: 0o600 })
  console.log(`Saved the session to ${ENV_FILE} (valid until ${new Date(cookie.expires * 1000).toISOString().slice(0, 10)}, renewed by every run).`)

  if (process.argv.includes('--github')) {
    const result = spawnSync('gh', ['secret', 'set', 'E2E_CUSTOMER_SESSION', '--env', 'dev'], { input: cookie.value, stdio: ['pipe', 'inherit', 'inherit'] })
    if (result.status !== 0) throw new Error('gh secret set failed')
    console.log('Stored it as the GitHub "dev" environment secret E2E_CUSTOMER_SESSION.')
  }
} finally {
  await browser.close()
}
