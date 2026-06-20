import { absoluteSiteUrl, getContactConfig, getSiteConfig } from '@/lib/siteConfig'
import DOMPurify from 'dompurify'

interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(JSON.stringify(data), {
          ADD_ATTR: ['type'],
          FORBID_ATTR: ['src', 'href', 'onclick', 'onerror', 'onload']
        })
      }}
    />
  )
}

// ─── Schema factories ───────────────────────────────────────────────────────

export function organizationSchema() {
  const site = getSiteConfig()
  const contact = getContactConfig()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    logo: absoluteSiteUrl('/favicon.svg'),
    description: site.description,
    sameAs: contact.instagramUrl ? [contact.instagramUrl] : [],
  }
}

export function productSchema(product: {
  title: string
  description: string
  handle: string
  featuredImage?: { url: string } | null
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  availableForSale: boolean
  vendor?: string
}) {
  const site = getSiteConfig()

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    url: `${site.url}/products/${product.handle}`,
    image: product.featuredImage?.url,
    brand: {
      '@type': 'Brand',
      name: product.vendor || site.name,
    },
    offers: {
      '@type': 'Offer',
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${site.url}/products/${product.handle}`,
    },
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
