import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'product' | 'article'
}

const SITE_NAME = 'House of Mornii'
const DEFAULT_DESCRIPTION = 'Regal costume jewellery embodying timeless luxury and modern artistry. Heritage-inspired pieces crafted to honor tradition while celebrating contemporary elegance.'
const DEFAULT_IMAGE = '' // Set to your OG image URL when available

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
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    const desc = description || DEFAULT_DESCRIPTION
    const img = image || DEFAULT_IMAGE
    const url = `${window.location.origin}${pathname}`

    document.title = fullTitle

    // Standard meta
    setMeta('description', desc)

    // Open Graph
    setMeta('og:title', fullTitle)
    setMeta('og:description', desc)
    setMeta('og:type', type)
    setMeta('og:url', url)
    if (img) setMeta('og:image', img)
    setMeta('og:site_name', SITE_NAME)

    // Twitter Card
    setMeta('twitter:card', img ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    if (img) setMeta('twitter:image', img)

    // Canonical
    setCanonical(url)
  }, [title, description, image, type, pathname])
}
