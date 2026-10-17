const CHECKOUT_HOSTS = new Set([
  'checkout.houseofmornii.com',
  'checkout-dev.houseofmornii.com',
])

export function isValidCheckoutUrl(url: string): boolean {
  try {
    const checkoutUrl = new URL(url)
    const hostname = checkoutUrl.hostname.toLowerCase()

    return checkoutUrl.protocol === 'https:' && (
      hostname === 'shopify.com' ||
      hostname.endsWith('.shopify.com') ||
      hostname.endsWith('.myshopify.com') ||
      CHECKOUT_HOSTS.has(hostname)
    )
  } catch {
    return false
  }
}

/** Checkout href for a Cart; signed-in Customers get `sso=silent` so checkout recognises them. */
export function checkoutLink(checkoutUrl: string, signedIn: boolean): string {
  if (!signedIn) return checkoutUrl
  try {
    const url = new URL(checkoutUrl)
    url.searchParams.set('sso', 'silent')
    return url.toString()
  } catch {
    return checkoutUrl
  }
}
