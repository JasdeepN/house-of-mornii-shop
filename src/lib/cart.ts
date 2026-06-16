export function isValidCheckoutUrl(url: string): boolean {
  try {
    const checkoutUrl = new URL(url)
    const hostname = checkoutUrl.hostname.toLowerCase()

    return checkoutUrl.protocol === 'https:' && (
      hostname === 'shopify.com' ||
      hostname.endsWith('.shopify.com') ||
      hostname.endsWith('.myshopify.com')
    )
  } catch {
    return false
  }
}