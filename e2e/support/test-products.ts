import { adminGraphql } from './admin'
import { requireDevTarget, requireEnv } from './env'

export const TEST_PRODUCTS = {
  oneVariant: { handle: 'hom-e2e-one-variant', title: 'Test – One Variant' },
  twoVariants: {
    handle: 'hom-e2e-two-variants',
    title: 'Test – Two Variants',
    available: 'Gold',
    soldOut: 'Silver',
  },
} as const

interface VariantSpec {
  option: string
  price: string
  tracked: boolean
}
interface ProductSpec {
  handle: string
  title: string
  description: string
  optionName: string
  variants: VariantSpec[]
}

const SPECS: ProductSpec[] = [
  {
    handle: TEST_PRODUCTS.oneVariant.handle,
    title: TEST_PRODUCTS.oneVariant.title,
    description: 'Automated test product with a single Variant. Safe to leave in place.',
    optionName: 'Title',
    variants: [{ option: 'Default Title', price: '10.00', tracked: false }],
  },
  {
    handle: TEST_PRODUCTS.twoVariants.handle,
    title: TEST_PRODUCTS.twoVariants.title,
    description: 'Automated test product with two Variants, one of them sold out. Safe to leave in place.',
    optionName: 'Metal',
    variants: [
      { option: TEST_PRODUCTS.twoVariants.available, price: '20.00', tracked: false },
      { option: TEST_PRODUCTS.twoVariants.soldOut, price: '25.00', tracked: true },
    ],
  },
]

interface ExistingProduct {
  id: string
  title: string
  status: string
  tags: string[]
  productType: string
  collections: { nodes: unknown[] }
  options: { name: string }[]
  variants: {
    nodes: {
      title: string
      price: string
      inventoryItem: { tracked: boolean }
      inventoryQuantity: number
    }[]
  }
  resourcePublicationsV2: { nodes: { isPublished: boolean; publication: { id: string } }[] }
}

const PRODUCT_FIELDS = `
  id title status tags productType
  collections(first: 1) { nodes { id } }
  options { name }
  variants(first: 10) { nodes { title price inventoryItem { tracked } inventoryQuantity } }
  resourcePublicationsV2(first: 50) { nodes { isPublished publication { id } } }
`

function matches(p: ExistingProduct, spec: ProductSpec): boolean {
  if (p.title !== spec.title || p.status !== 'ACTIVE' || !p.tags.includes('hom-e2e')) return false
  if (p.productType !== '' || p.collections.nodes.length > 0) return false
  if (p.options.length !== 1 || p.options[0].name !== spec.optionName) return false
  if (p.variants.nodes.length !== spec.variants.length) return false
  return spec.variants.every((v) => {
    const found = p.variants.nodes.find((n) => n.title === v.option)
    return (
      !!found &&
      Number(found.price) === Number(v.price) &&
      found.inventoryItem.tracked === v.tracked &&
      (!v.tracked || found.inventoryQuantity === 0)
    )
  })
}

async function findProduct(handle: string): Promise<ExistingProduct | null> {
  const data = await adminGraphql<{ productByHandle: ExistingProduct | null }>(
    `query($handle: String!) { productByHandle(handle: $handle) { ${PRODUCT_FIELDS} } }`,
    { handle },
  )
  return data.productByHandle
}

async function upsert(spec: ProductSpec, locationId: string): Promise<void> {
  const data = await adminGraphql<{
    productSet: { product: { id: string } | null; userErrors: { field: string[]; message: string }[] }
  }>(
    `mutation($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
       productSet(identifier: $identifier, input: $input, synchronous: true) {
         product { id }
         userErrors { field message }
       }
     }`,
    {
      identifier: { handle: spec.handle },
      input: {
        handle: spec.handle,
        title: spec.title,
        descriptionHtml: `<p>${spec.description}</p>`,
        status: 'ACTIVE',
        tags: ['hom-e2e'],
        productType: '',
        collections: [],
        productOptions: [{ name: spec.optionName, values: spec.variants.map((v) => ({ name: v.option })) }],
        variants: spec.variants.map((v) => ({
          optionValues: [{ optionName: spec.optionName, name: v.option }],
          price: v.price,
          inventoryPolicy: 'DENY',
          inventoryItem: { tracked: v.tracked },
          ...(v.tracked
            ? { inventoryQuantities: [{ locationId, name: 'available', quantity: 0 }] }
            : {}),
        })),
      },
    },
  )
  if (data.productSet.userErrors.length) {
    throw new Error(`productSet ${spec.handle}: ${JSON.stringify(data.productSet.userErrors)}`)
  }
}

async function publish(product: ExistingProduct, publicationIds: string[]): Promise<void> {
  const published = new Set(
    product.resourcePublicationsV2.nodes.filter((n) => n.isPublished).map((n) => n.publication.id),
  )
  const missing = publicationIds.filter((id) => !published.has(id))
  if (!missing.length) return
  const data = await adminGraphql<{
    publishablePublish: { userErrors: { message: string }[] }
  }>(
    `mutation($id: ID!, $input: [PublicationInput!]!) {
       publishablePublish(id: $id, input: $input) { userErrors { message } }
     }`,
    { id: product.id, input: missing.map((publicationId) => ({ publicationId })) },
  )
  if (data.publishablePublish.userErrors.length) {
    throw new Error(`publishablePublish: ${JSON.stringify(data.publishablePublish.userErrors)}`)
  }
}

async function verifyOnStorefront(): Promise<void> {
  const domain = requireEnv('VITE_SHOPIFY_STORE_DOMAIN')
  const token = requireEnv('VITE_SHOPIFY_STOREFRONT_TOKEN')
  for (const spec of SPECS) {
    let seen = false
    for (let attempt = 0; attempt < 10 && !seen; attempt++) {
      const res = await fetch(`https://${domain}/api/2026-01/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
        body: JSON.stringify({
          query: 'query($h: String!) { productByHandle(handle: $h) { handle } }',
          variables: { h: spec.handle },
        }),
      })
      const json = (await res.json()) as { data?: { productByHandle: { handle: string } | null } }
      seen = json.data?.productByHandle?.handle === spec.handle
      if (!seen) await new Promise((r) => setTimeout(r, 1500))
    }
    if (!seen) throw new Error(`Test Product ${spec.handle} is not visible through the Storefront API`)
  }
}

/** Idempotent: creates or updates the hom-e2e Products to match TEST_PRODUCTS and publishes them to every sales channel. */
export async function ensureTestProducts(): Promise<void> {
  requireDevTarget()
  const meta = await adminGraphql<{
    locations: { nodes: { id: string }[] }
    publications: { nodes: { id: string }[] }
  }>(`{ locations(first: 1) { nodes { id } } publications(first: 50) { nodes { id } } }`)
  const locationId = meta.locations.nodes[0]?.id
  if (!locationId) throw new Error('The dev store has no inventory location')
  const publicationIds = meta.publications.nodes.map((p) => p.id)

  for (const spec of SPECS) {
    let product = await findProduct(spec.handle)
    if (!product || !matches(product, spec)) {
      await upsert(spec, locationId)
      product = await findProduct(spec.handle)
    }
    if (!product || !matches(product, spec)) throw new Error(`Test Product ${spec.handle} did not match after upsert`)
    await publish(product, publicationIds)
  }
  await verifyOnStorefront()
}
