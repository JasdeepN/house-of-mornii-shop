import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useShopBrand } from '@/lib/shopify'
import { absoluteSiteUrl, getSiteConfig } from '@/lib/siteConfig'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'product' | 'article'
  /** Ask search engines to leave the page out of their index (the 404 page). */
  noindex?: boolean
}

function setMeta(property: string, content: string): HTMLMetaElement {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement | null
  }
  if (!el) {
    el = document.createElement('meta')
    if (property.startsWith('og:') || property.startsWith('article:')) {
      el.setAttribute('property', property)
    } else {
      el.setAttribute('name', property)
    }
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
  return el
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

export function useSEO({ title, description, image, type = 'website', noindex = false }: SEOProps = {}) {
  const { pathname } = useLocation()
  const coverUrl = useShopBrand().coverImage?.url

  useEffect(() => {
    const site = getSiteConfig()
    // Prefer the Brand cover image; the static og-image.png is the fallback until one is set
    const defaultImage = coverUrl || absoluteSiteUrl(site.ogImagePath)
    const fullTitle = title ? `${title} | ${site.name}` : site.name
    const desc = description || site.description
    const img = image || defaultImage
    const url = absoluteSiteUrl(pathname)

    document.title = fullTitle

    // Standard meta
    setMeta('description', desc)

    // Open Graph
    setMeta('og:title', fullTitle)
    setMeta('og:description', desc)
    setMeta('og:type', type)
    setMeta('og:url', url)
    setMeta('og:image', img)
    setMeta('og:site_name', site.name)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)
    setMeta('twitter:image:alt', title || site.ogImageAlt)

    // Canonical
    setCanonical(url)

    // Robots: noindex only where asked; the tag is removed again when the page leaves
    const robots = noindex ? setMeta('robots', 'noindex, follow') : null
    return () => robots?.remove()
  }, [title, description, image, type, noindex, pathname, coverUrl])
}
