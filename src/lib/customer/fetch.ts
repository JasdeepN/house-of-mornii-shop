import { SignedOutError } from './errors'

export const CUSTOMER_GRAPHQL_PATH = '/api/customer/graphql'

/**
 * POST a Customer Account API document through the same-origin Worker passthrough.
 * 401 -> SignedOutError; other non-OK -> Error; GraphQL errors -> Error(first message).
 */
export async function customerFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(CUSTOMER_GRAPHQL_PATH, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (response.status === 401) throw new SignedOutError()
  if (!response.ok) throw new Error(`Customer request failed with status ${response.status}`)

  const json = (await response.json()) as { data?: T; errors?: { message: string }[] }
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message)
  }
  return json.data as T
}
