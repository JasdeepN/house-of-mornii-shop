import { test, expect } from '@playwright/test'
import { requireDevTarget } from '../support/env'
import { TEST_CUSTOMER_EMAIL, useTestCustomerSession } from '../support/customer'
import { TEST_PRODUCTS } from '../support/test-products'
import {
  unlockCheckout,
  addProductToBag,
  checkoutLinkHref,
  waitForCheckoutForm,
  fillAddressAndPay,
  readConfirmation,
} from '../support/checkout'
import {
  waitForOrder,
  waitForOrderByConfirmation,
  findRecentOrders,
  orderMismatches,
  cancelAndArchiveOrder,
} from '../support/orders'

test.beforeAll(() => requireDevTarget())

test('the signed-in Customer buys the One Variant Product and sees the Order', async ({ page, context }) => {
  // Checkout needs about 3 minutes by itself: the form takes ~45s and Payment ~2 minutes more.
  test.setTimeout(480_000)
  if (!process.env.E2E_CUSTOMER_SESSION) {
    throw new Error('E2E_CUSTOMER_SESSION is empty: refresh the saved session (see docs)')
  }
  await useTestCustomerSession(context)
  const startedAt = new Date(Date.now() - 60_000).toISOString()
  let orderId: string | null = null
  let paid = false

  try {
    await unlockCheckout(page)
    await addProductToBag(page, TEST_PRODUCTS.oneVariant.handle)
    const href = await checkoutLinkHref(page)
    expect(new URL(href).searchParams.get('sso')).toBe('silent')

    await page.getByRole('link', { name: /proceed to checkout/i }).click()
    const prefilled = await waitForCheckoutForm(page)
    // Shopify recognises the signed-in Customer through sso=silent; fill the email only if it did not.
    if (prefilled.toLowerCase() === TEST_CUSTOMER_EMAIL) {
      expect(prefilled.toLowerCase()).toBe(TEST_CUSTOMER_EMAIL)
    } else {
      test.info().annotations.push({ type: 'note', description: 'Shopify did not prefill the email; filled it' })
    }
    await fillAddressAndPay(page, { email: prefilled ? undefined : TEST_CUSTOMER_EMAIL, pay: true })
    paid = true

    const confirmation = await readConfirmation(page)
    expect(confirmation.orderName ?? confirmation.confirmationNumber, 'thank-you page shows an Order').toBeTruthy()

    // Phones show only the confirmation number; desktop also shows the Order name.
    const order = confirmation.orderName
      ? await waitForOrder(confirmation.orderName, 120_000)
      : await waitForOrderByConfirmation(confirmation.confirmationNumber!)
    expect(order, 'Admin finds the Order').not.toBeNull()
    orderId = order!.id
    expect(
      orderMismatches(order!, { email: TEST_CUSTOMER_EMAIL, productTitle: TEST_PRODUCTS.oneVariant.title, unitPrice: '10.00' }),
    ).toEqual([])

    // The Orders page can lag the checkout; reload until the Order shows (up to about 60s).
    await page.goto('/account/orders')
    await expect(async () => {
      await page.reload()
      await expect(page.getByRole('heading', { name: order!.name })).toBeVisible({ timeout: 8_000 })
    }).toPass({ timeout: 90_000, intervals: [3_000] })
  } finally {
    // Clean-up always runs when an Order was created, even when the page never named it.
    const ids = new Set<string>()
    if (orderId) ids.add(orderId)
    else if (paid) {
      // Payment may still be processing when a later step fails: give the Order time to appear.
      const deadline = Date.now() + 120_000
      while (ids.size === 0 && Date.now() < deadline) {
        for (const o of await findRecentOrders(TEST_CUSTOMER_EMAIL, startedAt)) ids.add(o.id)
        if (ids.size === 0) await new Promise((resolve) => setTimeout(resolve, 5_000))
      }
    }
    for (const id of ids) await cancelAndArchiveOrder(id)
  }
})
