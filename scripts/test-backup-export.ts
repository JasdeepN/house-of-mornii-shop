// scripts/test-backup-export.ts — Local integration test for the Shopify
// backup export logic used by the Worker's scheduled() Cron handler
// (workers/shopify-proxy.ts::runScheduledBackup).
//
// This script does NOT require a deployed Worker. It calls the Shopify
// Admin API directly with the same paginated GraphQL queries defined in
// workers/backup-queries.ts, using an Admin API access token read from
// .env.local (or the process environment). Use it to verify the backup
// queries return the expected data shapes against a test/dev store before
// deploying the Worker to production.
//
// Usage:
//   npm run test:backup-export
//   npx tsx scripts/test-backup-export.ts
//
// Requires (in .env.local or the environment):
//   SHOPIFY_ADMIN_ACCESS_TOKEN — Admin API access token (read_products, read_orders scopes)
//   SHOPIFY_STORE_DOMAIN       — e.g. your-store.myshopify.com

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import {
  API_VERSION,
  BACKUP_RESOURCES,
  BACKUP_PAGE_SIZE,
  fetchAllPages,
  type BackupResource,
} from '../workers/backup-queries'

const OUTPUT_DIR = path.resolve(process.cwd(), '.test-backups')

/**
 * Minimal .env file parser — avoids adding a `dotenv` dependency just for
 * this one-off script. Only handles simple `KEY=value` lines, ignoring
 * blank lines and `#` comments. Does not override variables already set in
 * the environment (so `FOO=bar npm run test:backup-export` still wins).
 */
async function loadDotEnvLocal(): Promise<void> {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return
  }

  const contents = await readFile(envPath, 'utf-8')
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue

    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    // Strip matching surrounding quotes, if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

interface ResourceResult {
  resource: BackupResource
  count: number
  durationMs: number
  error?: string
}

/**
 * Perform a single paginated Admin API GraphQL request. Mirrors
 * `runScheduledBackup`'s internal `fetchPage` in workers/shopify-proxy.ts.
 */
async function fetchPage(
  storeDomain: string,
  adminToken: string,
  query: string,
  variables: { first: number; after: string | null }
): Promise<{ data?: Record<string, unknown>; errors?: unknown }> {
  const endpoint = `https://${storeDomain}/admin/api/${API_VERSION}/graphql.json`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '<unreadable body>')
    throw new Error(`Admin API HTTP ${response.status}: ${bodyText}`)
  }

  return (await response.json()) as { data?: Record<string, unknown>; errors?: unknown }
}

async function main(): Promise<void> {
  await loadDotEnvLocal()

  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN

  if (!adminToken) {
    console.error(
      '[test-backup-export] Missing SHOPIFY_ADMIN_ACCESS_TOKEN — set it in .env.local or the environment.'
    )
    process.exit(1)
  }

  if (!storeDomain) {
    console.error(
      '[test-backup-export] Missing SHOPIFY_STORE_DOMAIN — set it in .env.local or the environment.'
    )
    process.exit(1)
  }

  console.log(`[test-backup-export] Store: ${storeDomain}`)
  console.log(`[test-backup-export] Admin API version: ${API_VERSION}`)
  console.log(`[test-backup-export] Page size: ${BACKUP_PAGE_SIZE}`)
  console.log(`[test-backup-export] Output dir: ${OUTPUT_DIR}`)
  console.log('')

  await mkdir(OUTPUT_DIR, { recursive: true })

  const results: ResourceResult[] = []
  const overallStart = Date.now()

  for (const resource of BACKUP_RESOURCES) {
    const start = Date.now()
    console.log(`[test-backup-export] Fetching ${resource}...`)

    try {
      const nodes = await fetchAllPages(
        resource,
        (query, variables) => fetchPage(storeDomain, adminToken, query, variables)
      )

      const durationMs = Date.now() - start
      const outputPath = path.join(OUTPUT_DIR, `${resource}.json`)
      await writeFile(outputPath, JSON.stringify(nodes, null, 2), 'utf-8')

      results.push({ resource, count: nodes.length, durationMs })
      console.log(
        `[test-backup-export]   ✓ ${resource}: ${nodes.length} record(s) in ${durationMs}ms -> ${outputPath}`
      )
    } catch (error) {
      const durationMs = Date.now() - start
      const message = error instanceof Error ? error.message : String(error)
      results.push({ resource, count: 0, durationMs, error: message })
      console.error(`[test-backup-export]   ✗ ${resource}: FAILED after ${durationMs}ms — ${message}`)
    }
  }

  const overallDurationMs = Date.now() - overallStart

  console.log('')
  console.log('[test-backup-export] Summary:')
  console.table(
    results.map((r) => ({
      resource: r.resource,
      records: r.count,
      durationMs: r.durationMs,
      status: r.error ? 'FAILED' : 'OK',
    }))
  )
  console.log(`[test-backup-export] Total time: ${overallDurationMs}ms`)

  const hasErrors = results.some((r) => r.error)
  if (hasErrors) {
    console.error('')
    console.error('[test-backup-export] One or more resources failed. See errors above.')
    process.exit(1)
  }

  console.log('')
  console.log('[test-backup-export] All resources exported successfully.')
}

main().catch((error) => {
  console.error('[test-backup-export] Unexpected fatal error:', error)
  process.exit(1)
})
