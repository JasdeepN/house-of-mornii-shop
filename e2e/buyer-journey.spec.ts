import { test, expect } from '@playwright/test'

/**
 * Buyer journey smoke test.
 *
 * Prerequisites:
 *   - Shopify dev store configured: VITE_SHOPIFY_STORE_DOMAIN + VITE_SHOPIFY_STOREFRONT_TOKEN
 *   - At least one collection with at least one in-stock product published to the Headless channel
 *   - Playwright Chromium installed: npx playwright install chromium
 *
 * Run locally: npm run test:e2e
 * Run in CI: E2E_BASE_URL=https://preview.example.com npx playwright test
 */

test.describe('Buyer journey', () => {
  test('home page loads with brand header', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/House of Mornii/)
    await expect(page.locator('header')).toBeVisible()
  })

  test('collections page shows at least one collection card', async ({ page }) => {
    await page.goto('/collections')
    await expect(page).toHaveTitle(/Collection/)
    // Wait for collection cards to appear (live data load)
    const cards = page.locator('[data-testid="collection-card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigating to a collection shows products', async ({ page }) => {
    await page.goto('/collections')
    const firstCard = page.locator('[data-testid="collection-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()

    await expect(page).toHaveURL(/\/collections\//)
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('product detail page loads from collection', async ({ page }) => {
    await page.goto('/collections')
    const firstCard = page.locator('[data-testid="collection-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()

    await expect(page).toHaveURL(/\/products\//)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="add-to-cart"]')).toBeVisible()
  })

  test('add to cart opens cart flyout with one item', async ({ page }) => {
    await page.goto('/collections')
    const firstCard = page.locator('[data-testid="collection-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()

    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()

    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })
    await expect(flyout.locator('[data-testid="cart-item"]')).toHaveCount(1)
  })

  test('checkout button is a valid Shopify URL (not a dead # link)', async ({ page }) => {
    await page.goto('/collections')
    const firstCard = page.locator('[data-testid="collection-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()

    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()

    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })

    const checkoutBtn = flyout.locator('[data-testid="checkout-button"]')
    await expect(checkoutBtn).toBeVisible()

    const href = await checkoutBtn.getAttribute('href')
    expect(href, 'Checkout URL must not be a dead # placeholder').not.toBe('#')
    expect(href, 'Checkout URL must be a Shopify domain or absolute URL').toMatch(/https?:\/\//)
  })
})

test.describe('Checkout flow', () => {
  test('complete checkout flow with single product', async ({ page }) => {
    // Navigate to collections page
    await page.goto('/collections')
    
    // Get first product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()
    
    // Add to cart
    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()
    
    // Verify cart flyout opens
    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })
    
    // Verify checkout button exists and has valid URL
    const checkoutBtn = flyout.locator('[data-testid="checkout-button"]')
    await expect(checkoutBtn).toBeVisible()
    
    const href = await checkoutBtn.getAttribute('href')
    expect(href, 'Checkout URL must be a valid URL').toMatch(/https?:\/\//)
  })

  test('add multiple products to cart', async ({ page }) => {
    // Navigate to collections page
    await page.goto('/collections')
    
    // Get first product and add to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()
    
    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()
    
    // Verify cart flyout opens with 1 item
    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })
    await expect(flyout.locator('[data-testid="cart-item"]')).toHaveCount(1)
    
    // Go back to collections
    await page.goto('/collections')
    
    // Get second product and add to cart
    const secondProduct = page.locator('[data-testid="product-card"]').nth(1)
    await expect(secondProduct).toBeVisible({ timeout: 10_000 })
    await secondProduct.click()
    
    const secondAtcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(secondAtcButton).toBeEnabled({ timeout: 10_000 })
    await secondAtcButton.click()
    
    // Verify cart has 2 items
    await expect(flyout.locator('[data-testid="cart-item"]')).toHaveCount(2)
  })

  test('update cart item quantity', async ({ page }) => {
    // Navigate to collections page
    await page.goto('/collections')
    
    // Get first product and add to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()
    
    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()
    
    // Open cart flyout
    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })
    
    // Increase quantity
    const increaseBtn = flyout.locator('[aria-label*="Increase quantity"]').first()
    await increaseBtn.click()
    
    // Verify quantity updated
    const quantity = flyout.locator('[role="status"][aria-live="polite"]').first()
    await expect(quantity).toHaveText('2')
  })

  test('remove item from cart', async ({ page }) => {
    // Navigate to collections page
    await page.goto('/collections')
    
    // Get first product and add to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()
    
    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()
    
    // Open cart flyout
    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })
    
    // Remove item
    const removeBtn = flyout.locator('[aria-label*="Remove"]').first()
    await removeBtn.click()
    
    // Verify cart is empty
    await expect(flyout.locator('[data-testid="cart-item"]')).toHaveCount(0)
  })

  test('empty cart state', async ({ page }) => {
    // Navigate to collections page
    await page.goto('/collections')
    
    // Get first product and add to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()
    
    const atcButton = page.locator('[data-testid="add-to-cart"]')
    await expect(atcButton).toBeEnabled({ timeout: 10_000 })
    await atcButton.click()
    
    // Open cart flyout
    const flyout = page.locator('[data-testid="cart-flyout"]')
    await expect(flyout).toBeVisible({ timeout: 5_000 })
    
    // Remove all items
    const removeBtns = flyout.locator('[aria-label*="Remove"]')
    const count = await removeBtns.count()
    for (let i = 0; i < count; i++) {
      await removeBtns.nth(0).click()
      await page.waitForTimeout(500)
    }
    
    // Verify empty state
    await expect(flyout.locator('[data-testid="cart-item"]')).toHaveCount(0)
    await expect(flyout.locator('p:text("Your bag is empty")')).toBeVisible()
  })
})

test.describe('SEO / meta', () => {
  test('root page has og:image meta tag', async ({ page }) => {
    await page.goto('/')
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /og-image/)
  })

  test('product page has product-specific og:title', async ({ page }) => {
    await page.goto('/collections')
    const firstCard = page.locator('[data-testid="collection-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()

    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await expect(firstProduct).toBeVisible({ timeout: 10_000 })
    await firstProduct.click()

    // Wait for the product name to appear in the page title
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).not.toHaveAttribute('content', 'House of Mornii')
  })
})
