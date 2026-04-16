interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ─── Schema factories ───────────────────────────────────────────────────────

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://houseofmornii.com'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'House of Mornii',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: 'Regal costume jewellery embodying timeless luxury and modern artistry.',
    sameAs: [
      'https://instagram.com/houseofmornii',
    ],
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    url: `${SITE_URL}/products/${product.handle}`,
    image: product.featuredImage?.url,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'House of Mornii',
    },
    offers: {
      '@type': 'Offer',
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/products/${product.handle}`,
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
