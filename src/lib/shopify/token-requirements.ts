// Token requirements registry for Shopify Storefront API
// Tracks which fields require token authentication

export interface TokenRequirement {
  field: string
  requiredMode: 'token' | 'tokenless'
  description: string
}

export const TOKEN_GATED_FIELDS: TokenRequirement[] = [
  { field: 'tags', requiredMode: 'token', description: 'Product tags require storefront access token' },
  { field: 'metafields', requiredMode: 'token', description: 'Metafields require storefront access token' },
  { field: 'customer', requiredMode: 'token', description: 'Customer APIs require storefront access token' },
  { field: 'customerAccessToken', requiredMode: 'token', description: 'Customer access tokens require authentication' },
]

/**
 * Determine the minimum required mode for a set of fields
 */
export function getRequiredModeForFields(fields: string[]): 'token' | 'tokenless' {
  const hasTokenGated = fields.some(field => 
    TOKEN_GATED_FIELDS.some(req => req.field === field)
  )
  return hasTokenGated ? 'token' : 'tokenless'
}

/**
 * Check if a query string contains token-gated fields
 */
export function hasTokenGatedFields(query: string): boolean {
  const patterns = ['tags', 'metafields', 'customerAccessToken']
  return patterns.some(pattern => query.includes(pattern))
}
