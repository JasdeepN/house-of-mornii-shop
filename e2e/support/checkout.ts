import { expect, type Page } from '@playwright/test'
import { requireEnv } from './env'

const CHECKOUT_ORIGIN = 'https://checkout-dev.houseofmornii.com'

/**
 * If the page is on the dev store's password page, enters E2E_STORE_PASSWORD and continues;
 * otherwise does nothing.
 *
 * Shopify then redirects to the checkout domain's root, which can hang, so this waits for the
 * navigation to commit rather than load. The password cookie is set by then; navigate on
 * explicitly (a Checkout URL you saved, or `unlockCheckout` before the Bag page link).
 */
export async function passStorePassword(page: Page): Promise<void> {
  if (!new URL(page.url()).pathname.startsWith('/password')) return
  const field = page.locator('input[type="password"]')
  await field.fill(requireEnv('E2E_STORE_PASSWORD'))
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/password'), { waitUntil: 'commit', timeout: 30_000 }),
    field.press('Enter'),
  ])
}

/**
 * Passes the store password once per browser context, up front, so a later Proceed to Checkout
 * link goes straight to the checkout form. Without it, Shopify holds the first checkout request
 * for 25 to 80 seconds before showing the password page.
 */
export async function unlockCheckout(page: Page): Promise<void> {
  await page.goto(`${CHECKOUT_ORIGIN}/password`, { waitUntil: 'domcontentloaded' })
  await passStorePassword(page)
}

/** Adds a Product to the Bag from its Product page and waits until the Bag holds it. */
export async function addProductToBag(page: Page, handle: string): Promise<void> {
  await page.goto(`/products/${handle}`)
  const add = page.getByRole('button', { name: /add to bag/i })
  await add.click()
  // The Cart id is stored once the first mutation lands; "ADDING..." clears when the mutation ends.
  await page.waitForFunction(() => !!localStorage.getItem('hom-cart-id'), undefined, { timeout: 30_000 })
  await page.getByRole('button', { name: /adding/i }).waitFor({ state: 'detached', timeout: 30_000 })
}

/** Opens the Bag page and returns the Proceed to Checkout link's href. */
export async function checkoutLinkHref(page: Page): Promise<string> {
  await page.goto('/cart')
  const link = page.getByRole('link', { name: /proceed to checkout/i })
  await link.waitFor({ timeout: 30_000 })
  const href = await link.getAttribute('href')
  if (!href) throw new Error('Proceed to Checkout has no href')
  return href
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  address1: string
  city: string
  province: string
  postalCode: string
  country: string
  phone: string
}

export const TEST_ADDRESS: ShippingAddress = {
  firstName: 'Test',
  lastName: 'Customer',
  address1: '1 Front St W',
  city: 'Toronto',
  province: 'Ontario',
  postalCode: 'M5J 2X6',
  country: 'Canada',
  phone: '4165550100',
}

const field = (page: Page, name: string) => page.locator(`[name=${name}]:not([aria-hidden])`)

/**
 * Waits for Shopify's checkout form (about 25 to 50s after the first navigation) and returns the
 * email the form carries: prefilled by sso=silent for a signed-in Customer, empty for a guest.
 */
export async function waitForCheckoutForm(page: Page): Promise<string> {
  await page.waitForURL(/checkouts/, { waitUntil: 'commit', timeout: 90_000 })
  const email = page.locator('input[name=email]')
  await email.waitFor({ timeout: 120_000 })
  return email.inputValue()
}

/**
 * Fills the address, then the Bogus Gateway card (number 1 approves) and clicks Pay now.
 * The dev store ships only to the United States, so the Canadian address is used when the
 * country list offers Canada and a New York address otherwise.
 *
 * The Payment section renders about 2 minutes after the form (the shipping method is chosen
 * automatically: its "Enter your shipping address" notice stays stale), so waits are generous.
 * With pay=false it stops with every card field filled and the Pay now button visible.
 */
export async function fillAddressAndPay(page: Page, opts: { email?: string; pay: boolean }): Promise<void> {
  if (opts.email) await page.locator('input[name=email]').fill(opts.email)
  const countries = await page.locator('select[name=countryCode] option').allInnerTexts()
  const canada = countries.includes('Canada')
  const a = canada
    ? { ...TEST_ADDRESS }
    : { ...TEST_ADDRESS, address1: '350 5th Ave', city: 'New York', province: 'New York', postalCode: '10118', country: 'United States', phone: '2125550100' }
  await page.locator('select[name=countryCode]').selectOption({ label: a.country })
  await field(page, 'firstName').fill(a.firstName)
  await field(page, 'lastName').fill(a.lastName)
  await field(page, 'address1').pressSequentially(a.address1, { delay: 20 })
  await page.keyboard.press('Escape')
  await field(page, 'city').fill(a.city)
  await field(page, 'zone').selectOption({ label: a.province })
  await field(page, 'postalCode').fill(a.postalCode)
  await field(page, 'phone').fill(a.phone)
  await field(page, 'phone').blur()

  const card = (title: string, name: string | RegExp) =>
    page.frameLocator(`iframe[title*="${title}" i]`).getByRole('textbox', { name })
  // Shopify's card fields validate keystrokes, so type them; a fill() shows the text but stays "empty".
  const type = async (input: ReturnType<typeof card>, value: string, timeout = 30_000) => {
    await input.click({ timeout })
    await input.clear()
    await input.pressSequentially(value, { delay: 60 })
    await input.press('Tab')
  }
  await type(card('Card number', 'Card number'), '1', 240_000)
  await type(card('Expiration', /Expiration/), '1230')
  await type(card('Security', 'Security code'), '123')
  await type(card('Name on card', 'Name on card'), 'Test Customer')
  const payNow = page.getByRole('button', { name: /pay now/i })
  await payNow.waitFor({ timeout: 30_000 })
  if (opts.pay) await payNow.click()
}

export interface Confirmation {
  orderName: string | null
  confirmationNumber: string | null
}

/** On the thank-you page, reads the Order name ("#1001") and the confirmation number. */
export async function readConfirmation(page: Page): Promise<Confirmation> {
  // Payment shows "Processing…" for a while; poll until the page names the Order, wherever Shopify puts it.
  let result: Confirmation = { orderName: null, confirmationNumber: null }
  await expect(async () => {
    const text = await page.locator('body').innerText()
    result = {
      orderName: text.match(/Order\s+(#\d+)/i)?.[1] ?? null,
      confirmationNumber: text.match(/Confirmation\s*(?:#|number)?\s*:?\s*([A-Z0-9]{6,})/i)?.[1] ?? null,
    }
    expect(result.orderName ?? result.confirmationNumber, 'the thank-you page names the Order').toBeTruthy()
  }).toPass({ timeout: 240_000, intervals: [3_000] })
  return result
}
