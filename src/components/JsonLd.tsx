import { absoluteSiteUrl, getContactConfig, getSiteConfig } from '@/lib/siteConfig'
import DOMPurify from 'dompurify'
import type { ProductSummary } from '@/lib/shopify'

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

export function productSchema(
  product: Pick<ProductSummary, 'title' | 'description' | 'handle' | 'featuredImage' | 'availableForSale' | 'vendor' | 'price'>,
) {
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
      price: product.price.min.amount,
      priceCurrency: product.price.min.currencyCode,
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
