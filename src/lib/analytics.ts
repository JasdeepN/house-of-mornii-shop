// GA4 + Meta Pixel analytics
// Configure via environment variables:
//   VITE_GA4_MEASUREMENT_ID  — GA4 measurement ID (e.g. G-XXXXXXXXXX)
//   VITE_META_PIXEL_ID       — Meta Pixel ID (numeric string)
// Both are opt-in: analytics loads only when the variable is set.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    gtag: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

/**
 * Inject the GA4 gtag.js script and configure the measurement ID.
 * Call once at app startup. No-op if VITE_GA4_MEASUREMENT_ID is not set.
 */
export function initGA4(): void {
  const id = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined
  if (!id) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args as Record<string, unknown>)
  }
  window.gtag('js', new Date())
  window.gtag('config', id)
}

/**
 * Inject the Meta Pixel script and fire the initial PageView.
 * Call once at app startup. No-op if VITE_META_PIXEL_ID is not set.
 */
export function initMetaPixel(): void {
  const id = import.meta.env.VITE_META_PIXEL_ID as string | undefined
  if (!id) return

  // Meta Pixel base code (inline version)
  const n = (window.fbq = window.fbq || function (...args: unknown[]) {
    const fn = window.fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue?: unknown[] }
    if (fn.callMethod) {
      fn.callMethod(...args)
    } else {
      fn.queue = fn.queue || []
      fn.queue.push(args)
    }
  })
  if (!window._fbq) window._fbq = n

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  window.fbq('init', id)
  window.fbq('track', 'PageView')
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
