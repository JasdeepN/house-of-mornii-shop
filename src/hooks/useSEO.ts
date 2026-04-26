import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { absoluteSiteUrl, getSiteConfig } from '@/lib/siteConfig'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'product' | 'article'
}

function setMeta(property: string, content: string) {
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

export function useSEO({ title, description, image, type = 'website' }: SEOProps = {}) {
  const { pathname } = useLocation()

  useEffect(() => {
    const site = getSiteConfig()
    const defaultImage = absoluteSiteUrl(site.ogImagePath)
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
  }, [title, description, image, type, pathname])
}
