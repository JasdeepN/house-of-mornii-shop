// GA4 + Meta Pixel analytics scaffold
// Replace G-XXXXXXXXXX in index.html with your GA4 measurement ID
// Optionally add Meta Pixel fbq below

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    gtag: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  // GA4 via gtag
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }

  // Meta Pixel
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params)
  }
}

// Pre-defined e-commerce events
export function trackPageView(pagePath: string, pageTitle: string) {
  trackEvent('page_view', { page_path: pagePath, page_title: pageTitle })
}

export function trackViewItem(product: {
  id: string
  name: string
  price: string
  currency?: string
}) {
  trackEvent('view_item', {
    currency: product.currency || 'USD',
    value: parseFloat(product.price),
    items: [{ item_id: product.id, item_name: product.name, price: parseFloat(product.price) }],
  })
}

export function trackAddToCart(product: {
  id: string
  name: string
  price: string
  quantity: number
  currency?: string
}) {
  trackEvent('add_to_cart', {
    currency: product.currency || 'USD',
    value: parseFloat(product.price) * product.quantity,
    items: [{ item_id: product.id, item_name: product.name, price: parseFloat(product.price), quantity: product.quantity }],
  })
}

export function trackViewItemList(listName: string, items: { id: string; name: string; price: string }[]) {
  trackEvent('view_item_list', {
    item_list_name: listName,
    items: items.map((item, idx) => ({
      item_id: item.id,
      item_name: item.name,
      price: parseFloat(item.price),
      index: idx,
    })),
  })
}

export function trackBeginCheckout(value: string, currency = 'USD') {
  trackEvent('begin_checkout', {
    currency,
    value: parseFloat(value),
  })
}
