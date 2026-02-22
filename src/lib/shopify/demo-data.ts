// Demo product & collection data — used when Shopify credentials are not configured.
// This lets the site render a full shopping experience for development / demos.

import type { ShopifyProduct, ShopifyCollection } from './types'

// ─── Helper ──────────────────────────────────────────────────────────────────

let _id = 0
function gid(resource: string) {
  return `gid://shopify/${resource}/${++_id}`
}

function money(amount: string, currencyCode = 'CAD') {
  return { amount, currencyCode }
}

function placeholder(w: number, h: number, label: string) {
  return {
    url: `https://placehold.co/${w}x${h}/1a1a2e/c4a35a?text=${encodeURIComponent(label)}`,
    altText: label,
    width: w,
    height: h,
  }
}

function demoProduct(
  title: string,
  handle: string,
  price: string,
  description: string,
  tags: string[] = [],
  compareAtPrice?: string,
): ShopifyProduct {
  const id = gid('Product')
  const variantId = gid('ProductVariant')
  const img = placeholder(800, 800, title)
  const variant = {
    id: variantId,
    title: 'Default Title',
    availableForSale: true,
    price: money(price),
    compareAtPrice: compareAtPrice ? money(compareAtPrice) : null,
    selectedOptions: [{ name: 'Title', value: 'Default Title' }],
    image: img,
  }

  return {
    id,
    handle,
    title,
    description,
    descriptionHtml: `<p>${description}</p>`,
    availableForSale: true,
    featuredImage: img,
    images: { edges: [{ node: img }] },
    options: [{ id: gid('ProductOption'), name: 'Title', values: ['Default Title'] }],
    variants: { edges: [{ node: variant }] },
    priceRange: {
      minVariantPrice: money(price),
      maxVariantPrice: money(price),
    },
    tags,
    vendor: 'House of Mornii',
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

const everydayProducts: ShopifyProduct[] = [
  demoProduct(
    'Aria Pendant',
    'aria-pendant',
    '89.00',
    'A delicate teardrop pendant in brushed gold vermeil, suspended from a fine cable chain. The perfect everyday luxury.',
    ['everyday', 'pendant', 'gold'],
  ),
  demoProduct(
    'Seren Studs',
    'seren-studs',
    '59.00',
    'Minimalist crescent moon studs in sterling silver with a satin finish. Subtle elegance for any occasion.',
    ['everyday', 'studs', 'silver'],
  ),
  demoProduct(
    'Lumière Bangle',
    'lumiere-bangle',
    '125.00',
    'A slender open bangle with hand-hammered texture, catching light with every movement. Available in gold or rose gold.',
    ['everyday', 'bangle', 'gold'],
  ),
  demoProduct(
    'Cassia Chain',
    'cassia-chain',
    '75.00',
    'A layering-ready paper-clip chain in 14k gold fill. Versatile enough to wear solo or stacked.',
    ['everyday', 'chain', 'gold'],
  ),
]

const festiveProducts: ShopifyProduct[] = [
  demoProduct(
    'Noor Chandeliers',
    'noor-chandeliers',
    '189.00',
    'Cascading chandelier earrings with hand-set cubic zirconia drops. Statement glamour for celebrations.',
    ['festive', 'earrings', 'statement'],
    '225.00',
  ),
  demoProduct(
    'Zara Ring',
    'zara-ring',
    '165.00',
    'A bold cocktail ring featuring an emerald-cut stone surrounded by a pavé halo. Pure opulence.',
    ['festive', 'ring', 'statement'],
  ),
  demoProduct(
    'Rania Collar',
    'rania-collar',
    '245.00',
    'A structured collar necklace with graduating kundan stones and delicate filigree. Regal presence.',
    ['festive', 'necklace', 'statement'],
    '295.00',
  ),
  demoProduct(
    'Farah Drops',
    'farah-drops',
    '135.00',
    'Elongated drop earrings with polki stones and pearl accents. Traditional craft meets modern silhouette.',
    ['festive', 'earrings', 'pearl'],
  ),
]

const bridalProducts: ShopifyProduct[] = [
  demoProduct(
    'Maharani Set',
    'maharani-set',
    '450.00',
    'A complete bridal set: choker, jhumka earrings, and maang tikka in 22k gold plating with uncut stones.',
    ['bridal', 'set', 'gold'],
    '525.00',
  ),
  demoProduct(
    'Celestia Tikka',
    'celestia-tikka',
    '285.00',
    'An ornate maang tikka with cascading pearl strands and a central emerald cabochon. Bridal perfection.',
    ['bridal', 'tikka', 'pearl'],
  ),
  demoProduct(
    'Anaya Jhumkas',
    'anaya-jhumkas',
    '195.00',
    'Oversized bell-shaped jhumkas with meenakari enamel work and tiny ghungroo charms.',
    ['bridal', 'jhumka', 'traditional'],
  ),
  demoProduct(
    'Priya Harness',
    'priya-harness',
    '210.00',
    'A hand-chain (haath phool) connecting ring to bracelet with seed pearl lattice. The finishing bridal touch.',
    ['bridal', 'handchain', 'pearl'],
  ),
]

const allProducts = [...everydayProducts, ...festiveProducts, ...bridalProducts]

// ─── Collections ─────────────────────────────────────────────────────────────

function demoCollection(
  title: string,
  handle: string,
  description: string,
  products: ShopifyProduct[],
): ShopifyCollection {
  return {
    id: gid('Collection'),
    handle,
    title,
    description,
    image: placeholder(1200, 600, title),
    products: {
      edges: products.map((p) => ({ node: p, cursor: btoa(p.id) })),
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  }
}

const collections: ShopifyCollection[] = [
  demoCollection(
    'Everyday',
    'everyday',
    'Subtle luxury for your daily rituals. Pieces designed to be lived in, layered, and loved.',
    everydayProducts,
  ),
  demoCollection(
    'Festive',
    'festive',
    'Bold adornments for celebrations. Make every entrance unforgettable.',
    festiveProducts,
  ),
  demoCollection(
    'Bridal',
    'bridal',
    'Heirloom-worthy pieces for the most important day. Handcrafted with intention and heritage.',
    bridalProducts,
  ),
]

// ─── Public API ──────────────────────────────────────────────────────────────

export function getDemoCollections(): ShopifyCollection[] {
  return collections
}

export function getDemoCollection(handle: string): ShopifyCollection | null {
  return collections.find((c) => c.handle === handle) ?? null
}

export function getDemoProduct(handle: string): ShopifyProduct | null {
  return allProducts.find((p) => p.handle === handle) ?? null
}

export function getDemoProducts(): ShopifyProduct[] {
  return allProducts
}
