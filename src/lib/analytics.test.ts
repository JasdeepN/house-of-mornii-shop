import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  initGA4,
  initMetaPixel,
  trackEvent,
  trackPageView,
  trackViewItem,
  trackAddToCart,
  trackViewItemList,
  trackBeginCheckout,
} from './analytics'

describe('analytics', () => {
  let originalGtag: unknown
  let originalFbq: unknown
  let originalDataLayer: unknown
  let originalFbqInternal: unknown
  let originalFbqVar: unknown
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    originalGtag = (window as any).gtag
    originalFbq = (window as any).fbq
    originalDataLayer = (window as any).dataLayer
    originalFbqInternal = (window as any)._fbq
    originalFbqVar = (window as any).fbq

    delete (window as any).gtag
    delete (window as any).fbq
    delete (window as any).dataLayer
    delete (window as any)._fbq

    originalCreateElement = document.createElement
  })

  afterEach(() => {
    ;(window as any).gtag = originalGtag
    ;(window as any).fbq = originalFbq
    ;(window as any).dataLayer = originalDataLayer
    ;(window as any)._fbq = originalFbqInternal
    ;(window as any).fbq = originalFbqVar
    document.createElement = originalCreateElement
  })

  describe('initGA4', () => {
    it('is a no-op when VITE_GA4_MEASUREMENT_ID is not set', () => {
      vi.stubEnv('VITE_GA4_MEASUREMENT_ID', '')
      const createElementSpy = vi.spyOn(document, 'createElement')

      initGA4()

      expect(createElementSpy).not.toHaveBeenCalled()
      expect(window.gtag).toBeUndefined()
    })

    it('injects the gtag script and configures the measurement ID', () => {
      vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-XXXXXXXXXX')

      const mockScript = {
        async: false,
        src: '',
      } as HTMLScriptElement
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript)

      initGA4()

      expect(createElementSpy).toHaveBeenCalledWith('script')
      expect(mockScript.async).toBe(true)
      expect(mockScript.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX')
      expect(appendChildSpy).toHaveBeenCalledWith(mockScript)
      expect(window.dataLayer).toEqual([])
      expect(typeof window.gtag).toBe('function')
    })

    it('pushes config and js events to dataLayer via gtag', () => {
      vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123')

      const mockScript = {} as HTMLScriptElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript)

      initGA4()

      expect(window.dataLayer).toHaveLength(2)
      expect(window.dataLayer[0]).toEqual(['js', expect.any(Date)])
      expect(window.dataLayer[1]).toEqual(['config', 'G-TEST123'])
    })

    it('preserves existing dataLayer if already present', () => {
      vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST456')
      const existingDataLayer: unknown[][] = [['existing', 'event']]
      ;(window as any).dataLayer = existingDataLayer

      const mockScript = {} as HTMLScriptElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript)

      initGA4()

      expect(window.dataLayer).toBe(existingDataLayer)
      expect(window.dataLayer).toHaveLength(3)
    })
  })

  describe('initMetaPixel', () => {
    it('is a no-op when VITE_META_PIXEL_ID is not set', () => {
      vi.stubEnv('VITE_META_PIXEL_ID', '')
      const createElementSpy = vi.spyOn(document, 'createElement')

      initMetaPixel()

      expect(createElementSpy).not.toHaveBeenCalled()
      expect(window.fbq).toBeUndefined()
    })

    it('injects the Meta Pixel script and fires init + PageView', () => {
      vi.stubEnv('VITE_META_PIXEL_ID', '123456789')

      const mockScript = {} as HTMLScriptElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript)

      initMetaPixel()

      expect(window.fbq).toBeDefined()
      expect(typeof window.fbq).toBe('function')
      expect(window._fbq).toBe(window.fbq)
      expect(mockScript.src).toBe('https://connect.facebook.net/en_US/fbevents.js')
      expect(mockScript.async).toBe(true)
    })

    it('queues calls when callMethod is not yet available', () => {
      vi.stubEnv('VITE_META_PIXEL_ID', '987654321')

      const mockScript = {} as HTMLScriptElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript)

      initMetaPixel()

      const fbqFn = window.fbq as (...args: unknown[]) => void
      expect(fbqFn).toBeDefined()

      // The fbq function should have queued the init and track calls
      const fbqInternal = window.fbq as any
      expect(fbqInternal.queue).toBeDefined()
      expect(fbqInternal.queue).toHaveLength(2)
      expect(fbqInternal.queue[0]).toEqual(['init', '987654321'])
      expect(fbqInternal.queue[1]).toEqual(['track', 'PageView'])
    })

    it('does not overwrite existing _fbq if already set', () => {
      vi.stubEnv('VITE_META_PIXEL_ID', '111222333')
      const existingFbq = function () {} as (...args: unknown[]) => void
      ;(window as any)._fbq = existingFbq

      const mockScript = {} as HTMLScriptElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript as any)
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript)

      initMetaPixel()

      expect(window._fbq).toBe(existingFbq)
    })
  })

  describe('trackEvent', () => {
    it('calls gtag with event name and params when gtag is available', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackEvent('test_event', { foo: 'bar' })

      expect(gtagMock).toHaveBeenCalledWith('event', 'test_event', { foo: 'bar' })
    })

    it('calls fbq with event name and params when fbq is available', () => {
      const fbqMock = vi.fn()
      ;(window as any).fbq = fbqMock

      trackEvent('test_event', { foo: 'bar' })

      expect(fbqMock).toHaveBeenCalledWith('track', 'test_event', { foo: 'bar' })
    })

    it('calls both gtag and fbq when both are available', () => {
      const gtagMock = vi.fn()
      const fbqMock = vi.fn()
      ;(window as any).gtag = gtagMock
      ;(window as any).fbq = fbqMock

      trackEvent('purchase', { value: 100 })

      expect(gtagMock).toHaveBeenCalledWith('event', 'purchase', { value: 100 })
      expect(fbqMock).toHaveBeenCalledWith('track', 'purchase', { value: 100 })
    })

    it('does nothing when neither gtag nor fbq is available', () => {
      // Neither is set
      expect(() => trackEvent('test_event')).not.toThrow()
    })

    it('passes undefined params when no params provided', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackEvent('simple_event')

      expect(gtagMock).toHaveBeenCalledWith('event', 'simple_event', undefined)
    })
  })

  describe('trackPageView', () => {
    it('calls trackEvent with page_view, page_path, and page_title', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackPageView('/products/aura-pendant', 'Aria Pendant')

      expect(gtagMock).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/products/aura-pendant',
        page_title: 'Aria Pendant',
      })
    })
  })

  describe('trackViewItem', () => {
    it('tracks view_item with default USD currency', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackViewItem({ id: 'prod-1', name: 'Aria Pendant', price: '89.00' })

      expect(gtagMock).toHaveBeenCalledWith('event', 'view_item', {
        currency: 'USD',
        value: 89.0,
        items: [{ item_id: 'prod-1', item_name: 'Aria Pendant', price: 89.0 }],
      })
    })

    it('tracks view_item with custom currency', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackViewItem({ id: 'prod-2', name: 'Moon Ring', price: '120.50', currency: 'EUR' })

      expect(gtagMock).toHaveBeenCalledWith('event', 'view_item', {
        currency: 'EUR',
        value: 120.5,
        items: [{ item_id: 'prod-2', item_name: 'Moon Ring', price: 120.5 }],
      })
    })

    it('parses decimal prices correctly', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackViewItem({ id: 'prod-3', name: 'Crown', price: '1234.56' })

      expect(gtagMock).toHaveBeenCalledWith('event', 'view_item', {
        currency: 'USD',
        value: 1234.56,
        items: [{ item_id: 'prod-3', item_name: 'Crown', price: 1234.56 }],
      })
    })
  })

  describe('trackAddToCart', () => {
    it('tracks add_to_cart with quantity and calculated value', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackAddToCart({ id: 'prod-1', name: 'Aria Pendant', price: '89.00', quantity: 2 })

      expect(gtagMock).toHaveBeenCalledWith('event', 'add_to_cart', {
        currency: 'USD',
        value: 178.0,
        items: [{ item_id: 'prod-1', item_name: 'Aria Pendant', price: 89.0, quantity: 2 }],
      })
    })

    it('tracks add_to_cart with custom currency', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackAddToCart({ id: 'prod-2', name: 'Ring', price: '50.00', quantity: 3, currency: 'GBP' })

      expect(gtagMock).toHaveBeenCalledWith('event', 'add_to_cart', {
        currency: 'GBP',
        value: 150.0,
        items: [{ item_id: 'prod-2', item_name: 'Ring', price: 50.0, quantity: 3 }],
      })
    })

    it('handles quantity of 1', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackAddToCart({ id: 'prod-3', name: 'Necklace', price: '150.00', quantity: 1 })

      expect(gtagMock).toHaveBeenCalledWith('event', 'add_to_cart', {
        currency: 'USD',
        value: 150.0,
        items: [{ item_id: 'prod-3', item_name: 'Necklace', price: 150.0, quantity: 1 }],
      })
    })
  })

  describe('trackViewItemList', () => {
    it('tracks view_item_list with item list name and indexed items', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      const items = [
        { id: 'prod-1', name: 'Aria Pendant', price: '89.00' },
        { id: 'prod-2', name: 'Moon Ring', price: '120.00' },
      ]

      trackViewItemList('Shop Products', items)

      expect(gtagMock).toHaveBeenCalledWith('event', 'view_item_list', {
        item_list_name: 'Shop Products',
        items: [
          { item_id: 'prod-1', item_name: 'Aria Pendant', price: 89.0, index: 0 },
          { item_id: 'prod-2', item_name: 'Moon Ring', price: 120.0, index: 1 },
        ],
      })
    })

    it('handles empty items array', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackViewItemList('Empty List', [])

      expect(gtagMock).toHaveBeenCalledWith('event', 'view_item_list', {
        item_list_name: 'Empty List',
        items: [],
      })
    })

    it('handles single item', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackViewItemList('Featured', [{ id: 'prod-1', name: 'Crown', price: '500.00' }])

      expect(gtagMock).toHaveBeenCalledWith('event', 'view_item_list', {
        item_list_name: 'Featured',
        items: [{ item_id: 'prod-1', item_name: 'Crown', price: 500.0, index: 0 }],
      })
    })
  })

  describe('trackBeginCheckout', () => {
    it('tracks begin_checkout with default USD currency', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackBeginCheckout('178.00')

      expect(gtagMock).toHaveBeenCalledWith('event', 'begin_checkout', {
        currency: 'USD',
        value: 178.0,
      })
    })

    it('tracks begin_checkout with custom currency', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackBeginCheckout('250.00', 'EUR')

      expect(gtagMock).toHaveBeenCalledWith('event', 'begin_checkout', {
        currency: 'EUR',
        value: 250.0,
      })
    })

    it('parses decimal values correctly', () => {
      const gtagMock = vi.fn()
      ;(window as any).gtag = gtagMock

      trackBeginCheckout('99.99')

      expect(gtagMock).toHaveBeenCalledWith('event', 'begin_checkout', {
        currency: 'USD',
        value: 99.99,
      })
    })
  })
})
