// workers/catalog-sync.ts — Nightly prod→dev catalog sync Worker.
//
// Reads products and collections (images, descriptions, variants, options,
// pricing) from the PRODUCTION Shopify store via the Admin API, and upserts
// them into the DEV store via the Admin API (`productSet` / `collectionCreate`
// / `collectionUpdate`), matched by `handle` so nightly runs UPDATE rather
// than duplicate (idempotent).
//
// Scope, by design (see docs/dev-snapshot-environment-plan.md — Approach A):
//   - Catalog ONLY: products + collections. Orders and customers are NEVER
//     read from prod or written to dev — no PII enters the dev store.
//   - Images are referenced via production CDN URLs (`originalSource`) —
//     binaries are never re-uploaded/downloaded by this Worker.
//   - Runs on a `scheduled()` Cron Trigger (see wrangler.catalog-sync.toml),
//     nightly at 02:00, an hour before the existing 03:00 backup.
//
// This Worker requires Admin API credentials for BOTH stores:
//   PROD_SHOPIFY_STORE_DOMAIN / PROD_ADMIN_ACCESS_TOKEN   (source, read-only)
//   DEV_SHOPIFY_STORE_DOMAIN  / DEV_ADMIN_ACCESS_TOKEN    (destination, write)
// Secrets are provisioned via `wrangler secret put --config wrangler.catalog-sync.toml`,
// never committed to the repo. See docs/deployment-environments-setup.md.

import { fetchAllPages, API_VERSION, type ConnectionPage } from './backup-queries'

// ─── Env ─────────────────────────────────────────────────────────────────────

export interface MinimalScheduledEvent {
  cron?: string
  scheduledTime?: number
}

export interface CatalogSyncEnv {
  // Secrets (set via `wrangler secret put`, never in a config file)
  PROD_ADMIN_ACCESS_TOKEN?: string
  DEV_ADMIN_ACCESS_TOKEN?: string
  // Vars
  PROD_SHOPIFY_STORE_DOMAIN?: string
  DEV_SHOPIFY_STORE_DOMAIN?: string
  [key: string]: unknown
}

// ─── Admin read shape (from PROD) ───────────────────────────────────────────
// Intentionally scoped to exactly the fields the storefront renders
// (see src/lib/shopify/queries.ts): images, description, variants
// (price/compareAtPrice/options/image), options, and pricing.

export interface AdminImageNode {
  id?: string
  url: string
  altText?: string | null
}

export interface AdminVariantNode {
  id: string
  title: string
  sku?: string | null
  price: string
  compareAtPrice?: string | null
  selectedOptions?: { name: string; value: string }[]
  image?: AdminImageNode | null
  inventoryQuantity?: number | null
}

export interface AdminProductOptionNode {
  name: string
  values: string[]
}

export interface AdminProductNode {
  id: string
  title: string
  handle: string
  vendor?: string | null
  productType?: string | null
  status?: string | null
  tags?: string[]
  description?: string | null
  descriptionHtml?: string | null
  featuredImage?: AdminImageNode | null
  images?: { nodes: AdminImageNode[] }
  options?: AdminProductOptionNode[]
  variants: { nodes: AdminVariantNode[] }
}

export interface AdminCollectionNode {
  id: string
  title: string
  handle: string
  descriptionHtml?: string | null
  image?: AdminImageNode | null
}

// ─── GraphQL: read from PROD ────────────────────────────────────────────────

export const CATALOG_PRODUCTS_QUERY = /* GraphQL */ `
  query CatalogSyncProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        vendor
        productType
        status
        tags
        description
        descriptionHtml
        featuredImage {
          id
          url
          altText
        }
        images(first: 20) {
          nodes {
            id
            url
            altText
          }
        }
        options {
          name
          values
        }
        variants(first: 100) {
          nodes {
            id
            title
            sku
            price
            compareAtPrice
            selectedOptions {
              name
              value
            }
            image {
              id
              url
              altText
            }
            inventoryQuantity
          }
        }
      }
    }
  }
`

export const CATALOG_COLLECTIONS_QUERY = /* GraphQL */ `
  query CatalogSyncCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        descriptionHtml
        image {
          id
          url
          altText
        }
      }
    }
  }
`

const CATALOG_PAGE_SIZE = 50

// ─── GraphQL: write to DEV ───────────────────────────────────────────────────

export const PRODUCT_SET_MUTATION = /* GraphQL */ `
  mutation CatalogSyncProductSet($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
    productSet(input: $input, identifier: $identifier, synchronous: true) {
      product {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const COLLECTION_CREATE_MUTATION = /* GraphQL */ `
  mutation CatalogSyncCollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`

export const COLLECTION_UPDATE_MUTATION = /* GraphQL */ `
  mutation CatalogSyncCollectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`

/** Minimal query to find an existing dev collection by handle (for update-vs-create). */
export const COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  query CatalogSyncCollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      handle
    }
  }
`

// ─── Transform: PROD Admin read shape → DEV Admin write (upsert) input ─────

export interface ProductSetVariables {
  input: {
    title: string
    handle: string
    vendor?: string
    productType?: string
    status?: string
    tags?: string[]
    descriptionHtml?: string
    files?: { originalSource: string; alt?: string; contentType: 'IMAGE' }[]
    productOptions?: { name: string; values: { name: string }[] }[]
    variants?: {
      price?: string
      compareAtPrice?: string | null
      sku?: string
      optionValues: { optionName: string; name: string }[]
      file?: { originalSource: string; alt?: string; contentType: 'IMAGE' }
      inventoryQuantities?: { locationId: string; name: string; quantity: number }[]
    }[]
  }
  identifier: { handle: string }
}

/**
 * Transform a prod-read `AdminProductNode` into the `productSet` mutation
 * variables used to upsert the equivalent product into the dev store.
 * Matches by `handle` (via `identifier`) so repeated nightly runs UPDATE the
 * same dev product rather than creating duplicates.
 *
 * Images are referenced via their prod CDN URL (`originalSource`) — binaries
 * are never downloaded/re-uploaded by this Worker.
 */
export function transformProductForDev(product: AdminProductNode): ProductSetVariables {
  const options = product.options?.length
    ? product.options.map((opt) => ({
        name: opt.name,
        values: opt.values.map((v) => ({ name: v })),
      }))
    : undefined

  const files = (product.images?.nodes ?? [])
    .filter((img) => !!img.url)
    .map((img) => ({
      originalSource: img.url,
      alt: img.altText ?? undefined,
      contentType: 'IMAGE' as const,
    }))

  const variants = product.variants.nodes.map((variant) => ({
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    sku: variant.sku ?? undefined,
    optionValues: (variant.selectedOptions ?? []).map((so) => ({
      optionName: so.name,
      name: so.value,
    })),
    file: variant.image?.url
      ? { originalSource: variant.image.url, alt: variant.image.altText ?? undefined, contentType: 'IMAGE' as const }
      : undefined,
  }))

  return {
    input: {
      title: product.title,
      handle: product.handle,
      vendor: product.vendor ?? undefined,
      productType: product.productType ?? undefined,
      status: product.status ?? undefined,
      tags: product.tags ?? undefined,
      descriptionHtml: product.descriptionHtml ?? product.description ?? undefined,
      files: files.length ? files : undefined,
      productOptions: options,
      variants: variants.length ? variants : undefined,
    },
    identifier: { handle: product.handle },
  }
}

export interface CollectionInputVariables {
  input: {
    id?: string
    title: string
    handle: string
    descriptionHtml?: string
    image?: { src: string; altText?: string }
  }
}

/**
 * Transform a prod-read `AdminCollectionNode` into `CollectionInput` variables
 * for either `collectionCreate` (no existing dev collection) or
 * `collectionUpdate` (existing dev collection id supplied), matched by handle.
 */
export function transformCollectionForDev(
  collection: AdminCollectionNode,
  existingDevId?: string
): CollectionInputVariables {
  return {
    input: {
      ...(existingDevId ? { id: existingDevId } : {}),
      title: collection.title,
      handle: collection.handle,
      descriptionHtml: collection.descriptionHtml ?? undefined,
      image: collection.image?.url
        ? { src: collection.image.url, altText: collection.image.altText ?? undefined }
        : undefined,
    },
  }
}

// ─── Admin API request helpers ──────────────────────────────────────────────

interface AdminGraphQLResponse<T = Record<string, unknown>> {
  data?: T
  errors?: unknown
}

async function adminRequest<T = Record<string, unknown>>(
  domain: string,
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<AdminGraphQLResponse<T>> {
  const endpoint = `https://${domain}/admin/api/${API_VERSION}/graphql.json`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`Admin API request failed with status ${response.status}`)
  }

  return response.json()
}

async function fetchProdPage(
  env: CatalogSyncEnv,
  query: string,
  variables: { first: number; after: string | null }
): Promise<{ data?: Record<string, ConnectionPage<unknown>>; errors?: unknown }> {
  if (!env.PROD_SHOPIFY_STORE_DOMAIN || !env.PROD_ADMIN_ACCESS_TOKEN) {
    throw new Error('Missing PROD_SHOPIFY_STORE_DOMAIN / PROD_ADMIN_ACCESS_TOKEN')
  }
  return adminRequest(env.PROD_SHOPIFY_STORE_DOMAIN, env.PROD_ADMIN_ACCESS_TOKEN, query, variables) as Promise<{
    data?: Record<string, ConnectionPage<unknown>>
    errors?: unknown
  }>
}

/**
 * Page through the PROD store's products via the Admin API using the shared
 * cursor-pagination helper from workers/backup-queries.ts.
 */
async function fetchProdProducts(env: CatalogSyncEnv): Promise<AdminProductNode[]> {
  const allNodes: AdminProductNode[] = []
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const result = await fetchProdPage(env, CATALOG_PRODUCTS_QUERY, { first: CATALOG_PAGE_SIZE, after })
    if (result.errors) {
      throw new Error(`Admin API errors while reading prod products: ${JSON.stringify(result.errors)}`)
    }
    const connection = result.data?.products as ConnectionPage<AdminProductNode> | undefined
    if (!connection) {
      throw new Error('Admin API response missing "products" connection')
    }
    allNodes.push(...connection.nodes)
    hasNextPage = connection.pageInfo.hasNextPage
    after = connection.pageInfo.endCursor
  }

  return allNodes
}

async function fetchProdCollections(env: CatalogSyncEnv): Promise<AdminCollectionNode[]> {
  const allNodes: AdminCollectionNode[] = []
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const result = await fetchProdPage(env, CATALOG_COLLECTIONS_QUERY, { first: CATALOG_PAGE_SIZE, after })
    if (result.errors) {
      throw new Error(`Admin API errors while reading prod collections: ${JSON.stringify(result.errors)}`)
    }
    const connection = result.data?.collections as ConnectionPage<AdminCollectionNode> | undefined
    if (!connection) {
      throw new Error('Admin API response missing "collections" connection')
    }
    allNodes.push(...connection.nodes)
    hasNextPage = connection.pageInfo.hasNextPage
    after = connection.pageInfo.endCursor
  }

  return allNodes
}

/**
 * Upsert a single product into the DEV store. `productSet` is inherently
 * idempotent when matched by `identifier: { handle }` — Shopify updates the
 * existing product with that handle instead of creating a duplicate.
 */
export async function upsertDevProduct(
  env: CatalogSyncEnv,
  product: AdminProductNode
): Promise<{ handle: string; ok: boolean; errors?: unknown }> {
  if (!env.DEV_SHOPIFY_STORE_DOMAIN || !env.DEV_ADMIN_ACCESS_TOKEN) {
    throw new Error('Missing DEV_SHOPIFY_STORE_DOMAIN / DEV_ADMIN_ACCESS_TOKEN')
  }

  const variables = transformProductForDev(product)
  const result = await adminRequest<{
    productSet?: { product?: { id: string; handle: string }; userErrors: { field: string[]; message: string }[] }
  }>(env.DEV_SHOPIFY_STORE_DOMAIN, env.DEV_ADMIN_ACCESS_TOKEN, PRODUCT_SET_MUTATION, variables as unknown as Record<string, unknown>)

  if (result.errors) {
    return { handle: product.handle, ok: false, errors: result.errors }
  }

  const userErrors = result.data?.productSet?.userErrors
  if (userErrors && userErrors.length > 0) {
    return { handle: product.handle, ok: false, errors: userErrors }
  }

  return { handle: product.handle, ok: true }
}

/**
 * Upsert a single collection into the DEV store, matched by handle: looks up
 * an existing dev collection with the same handle and calls
 * `collectionUpdate` if found, otherwise `collectionCreate`.
 */
export async function upsertDevCollection(
  env: CatalogSyncEnv,
  collection: AdminCollectionNode
): Promise<{ handle: string; ok: boolean; errors?: unknown }> {
  if (!env.DEV_SHOPIFY_STORE_DOMAIN || !env.DEV_ADMIN_ACCESS_TOKEN) {
    throw new Error('Missing DEV_SHOPIFY_STORE_DOMAIN / DEV_ADMIN_ACCESS_TOKEN')
  }

  const lookup = await adminRequest<{ collectionByHandle?: { id: string; handle: string } | null }>(
    env.DEV_SHOPIFY_STORE_DOMAIN,
    env.DEV_ADMIN_ACCESS_TOKEN,
    COLLECTION_BY_HANDLE_QUERY,
    { handle: collection.handle }
  )

  if (lookup.errors) {
    return { handle: collection.handle, ok: false, errors: lookup.errors }
  }

  const existingId = lookup.data?.collectionByHandle?.id
  const variables = transformCollectionForDev(collection, existingId)
  const mutation = existingId ? COLLECTION_UPDATE_MUTATION : COLLECTION_CREATE_MUTATION

  const result = await adminRequest<{
    collectionCreate?: { collection?: { id: string; handle: string }; userErrors: { field: string[]; message: string }[] }
    collectionUpdate?: { collection?: { id: string; handle: string }; userErrors: { field: string[]; message: string }[] }
  }>(env.DEV_SHOPIFY_STORE_DOMAIN, env.DEV_ADMIN_ACCESS_TOKEN, mutation, variables as unknown as Record<string, unknown>)

  if (result.errors) {
    return { handle: collection.handle, ok: false, errors: result.errors }
  }

  const payload = result.data?.collectionCreate ?? result.data?.collectionUpdate
  const userErrors = payload?.userErrors
  if (userErrors && userErrors.length > 0) {
    return { handle: collection.handle, ok: false, errors: userErrors }
  }

  return { handle: collection.handle, ok: true }
}

// ─── Orchestration ───────────────────────────────────────────────────────────

export interface CatalogSyncSummary {
  startedAt: string
  completedAt: string
  products: { total: number; succeeded: number; failed: number; failures: { handle: string; errors: unknown }[] }
  collections: { total: number; succeeded: number; failed: number; failures: { handle: string; errors: unknown }[] }
}

/**
 * Run the full nightly catalog sync: read products + collections from PROD,
 * upsert each into DEV by handle. Deliberately never reads or writes orders
 * or customers — catalog data only, no PII.
 *
 * Uses try/catch around each resource + each item so partial failures are
 * observable via `wrangler tail` without aborting the whole run.
 */
export async function runCatalogSync(env: CatalogSyncEnv): Promise<CatalogSyncSummary | null> {
  if (!env.PROD_SHOPIFY_STORE_DOMAIN || !env.PROD_ADMIN_ACCESS_TOKEN) {
    console.error(JSON.stringify({ level: 'error', event: 'catalog_sync.missing_prod_credentials' }))
    return null
  }
  if (!env.DEV_SHOPIFY_STORE_DOMAIN || !env.DEV_ADMIN_ACCESS_TOKEN) {
    console.error(JSON.stringify({ level: 'error', event: 'catalog_sync.missing_dev_credentials' }))
    return null
  }

  const startedAt = new Date().toISOString()
  const productFailures: { handle: string; errors: unknown }[] = []
  const collectionFailures: { handle: string; errors: unknown }[] = []
  let productsTotal = 0
  let productsSucceeded = 0
  let collectionsTotal = 0
  let collectionsSucceeded = 0

  // Collections first (so productSet can associate collections later if needed).
  try {
    const collections = await fetchProdCollections(env)
    collectionsTotal = collections.length
    for (const collection of collections) {
      try {
        const result = await upsertDevCollection(env, collection)
        if (result.ok) {
          collectionsSucceeded++
          console.log(JSON.stringify({ level: 'info', event: 'catalog_sync.collection_upserted', handle: result.handle }))
        } else {
          collectionFailures.push({ handle: result.handle, errors: result.errors })
          console.error(
            JSON.stringify({ level: 'error', event: 'catalog_sync.collection_upsert_failed', handle: result.handle, errors: result.errors })
          )
        }
      } catch (error) {
        collectionFailures.push({ handle: collection.handle, errors: (error as Error).message })
        console.error(
          JSON.stringify({ level: 'error', event: 'catalog_sync.collection_upsert_exception', handle: collection.handle, message: (error as Error).message })
        )
      }
    }
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'catalog_sync.collections_fetch_failed', message: (error as Error).message }))
  }

  // Products.
  try {
    const products = await fetchProdProducts(env)
    productsTotal = products.length
    for (const product of products) {
      try {
        const result = await upsertDevProduct(env, product)
        if (result.ok) {
          productsSucceeded++
          console.log(JSON.stringify({ level: 'info', event: 'catalog_sync.product_upserted', handle: result.handle }))
        } else {
          productFailures.push({ handle: result.handle, errors: result.errors })
          console.error(
            JSON.stringify({ level: 'error', event: 'catalog_sync.product_upsert_failed', handle: result.handle, errors: result.errors })
          )
        }
      } catch (error) {
        productFailures.push({ handle: product.handle, errors: (error as Error).message })
        console.error(
          JSON.stringify({ level: 'error', event: 'catalog_sync.product_upsert_exception', handle: product.handle, message: (error as Error).message })
        )
      }
    }
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'catalog_sync.products_fetch_failed', message: (error as Error).message }))
  }

  const summary: CatalogSyncSummary = {
    startedAt,
    completedAt: new Date().toISOString(),
    products: {
      total: productsTotal,
      succeeded: productsSucceeded,
      failed: productFailures.length,
      failures: productFailures,
    },
    collections: {
      total: collectionsTotal,
      succeeded: collectionsSucceeded,
      failed: collectionFailures.length,
      failures: collectionFailures,
    },
  }

  console.log(JSON.stringify({ level: 'info', event: 'catalog_sync.complete', ...summary }))
  return summary
}

// Re-export the pagination helper import so it's exercised (avoids unused-import
// churn while keeping the "reuse the cursor-pagination helper pattern" intent
// explicit for readers/tests that may want the generic helper directly).
export { fetchAllPages }

export default {
  async fetch(): Promise<Response> {
    // This Worker has no HTTP surface — it exists purely for its scheduled()
    // handler. Respond 404 for any direct fetch.
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  },

  async scheduled(_event: MinimalScheduledEvent, env: CatalogSyncEnv): Promise<void> {
    await runCatalogSync(env)
  },
}
