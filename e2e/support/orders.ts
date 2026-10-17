import { adminGraphql } from './admin'

export interface AdminOrder {
  id: string
  name: string
  email: string | null
  cancelledAt: string | null
  closed: boolean
  customer: { email: string | null } | null
  lineItems: {
    nodes: {
      title: string
      quantity: number
      originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } }
    }[]
  }
}

const ORDER_FIELDS = `
  id name email cancelledAt closed
  customer { email }
  lineItems(first: 10) {
    nodes { title quantity originalUnitPriceSet { shopMoney { amount currencyCode } } }
  }
`

/** Finds an Order by its name (e.g. "#1001"); null when none matches. */
export async function findOrderByName(name: string): Promise<AdminOrder | null> {
  const data = await adminGraphql<{ orders: { nodes: AdminOrder[] } }>(
    `query($q: String!) { orders(first: 5, query: $q) { nodes { ${ORDER_FIELDS} } } }`,
    { q: `name:${name.replace(/^#/, '')}` },
  )
  return data.orders.nodes.find((o) => o.name === name) ?? null
}

/** Like findOrderByName, but retries for a while: Orders can take seconds to reach the search index. */
export async function waitForOrder(name: string, timeoutMs = 60_000): Promise<AdminOrder | null> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const order = await findOrderByName(name)
    if (order || Date.now() > deadline) return order
    await new Promise((r) => setTimeout(r, 3000))
  }
}

export interface ExpectedOrder {
  email: string
  productTitle: string
  unitPrice: string
  quantity?: number
}

/** Returns a list of mismatches between the Order and what was expected; empty means it matches. */
export function orderMismatches(order: AdminOrder, expected: ExpectedOrder): string[] {
  const problems: string[] = []
  const lines = order.lineItems.nodes
  if (lines.length !== 1) problems.push(`expected 1 line item, found ${lines.length}`)
  const line = lines[0]
  if (line) {
    if (line.title !== expected.productTitle) problems.push(`line title was "${line.title}"`)
    if (line.quantity !== (expected.quantity ?? 1)) problems.push(`line quantity was ${line.quantity}`)
    if (Number(line.originalUnitPriceSet.shopMoney.amount) !== Number(expected.unitPrice)) {
      problems.push(`unit price was ${line.originalUnitPriceSet.shopMoney.amount}`)
    }
  }
  const email = (order.customer?.email ?? order.email ?? '').toLowerCase()
  if (email !== expected.email.toLowerCase()) problems.push(`Order belongs to ${email || 'no email'}`)
  return problems
}

type UserErrors = { userErrors: { field?: string[]; message: string }[] }

function assertNoErrors(label: string, result: UserErrors): void {
  if (result.userErrors.length) throw new Error(`${label}: ${JSON.stringify(result.userErrors)}`)
}

async function getOrder(id: string): Promise<{ cancelledAt: string | null; closed: boolean }> {
  const data = await adminGraphql<{ order: { cancelledAt: string | null; closed: boolean } }>(
    `query($id: ID!) { order(id: $id) { cancelledAt closed } }`,
    { id },
  )
  return data.order
}

/** Tags the Order hom-e2e, cancels it (no refund, no customer notice), and archives (closes) it. */
export async function cancelAndArchiveOrder(id: string): Promise<void> {
  const tags = await adminGraphql<{ tagsAdd: UserErrors }>(
    `mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
    { id, tags: ['hom-e2e'] },
  )
  assertNoErrors('tagsAdd', tags.tagsAdd)

  const cancel = async (restock: boolean) =>
    (
      await adminGraphql<{ orderCancel: { orderCancelUserErrors: { message: string }[] } }>(
        `mutation($id: ID!, $restock: Boolean!) {
           orderCancel(orderId: $id, notifyCustomer: false, refundMethod: { originalPaymentMethodsRefund: false },
                       restock: $restock, reason: OTHER, staffNote: "Automated E2E test Order") {
             orderCancelUserErrors { message }
           }
         }`,
        { id, restock },
      )
    ).orderCancel.orderCancelUserErrors

  let errors = (await getOrder(id)).cancelledAt ? [] : await cancel(true)
  // Restocking can be refused (for example for a deactivated location); the test Products are untracked anyway.
  if (errors.length) errors = await cancel(false)
  if (errors.length) throw new Error(`orderCancel: ${JSON.stringify(errors)}`)

  // Cancellation is a background job: wait for it before closing.
  const deadline = Date.now() + 60_000
  while (!(await getOrder(id)).cancelledAt) {
    if (Date.now() > deadline) throw new Error('Order was not cancelled within 60s')
    await new Promise((r) => setTimeout(r, 2000))
  }

  if (!(await getOrder(id)).closed) {
    const close = await adminGraphql<{ orderClose: UserErrors }>(
      `mutation($id: ID!) { orderClose(input: { id: $id }) { userErrors { message } } }`,
      { id },
    )
    assertNoErrors('orderClose', close.orderClose)
  }
}

/** Finds an Order by its confirmation number (the thank-you page shows it when it hides the name). */
export async function findOrderByConfirmation(confirmation: string): Promise<AdminOrder | null> {
  const data = await adminGraphql<{ orders: { nodes: AdminOrder[] } }>(
    `query($q: String!) { orders(first: 1, query: $q) { nodes { ${ORDER_FIELDS} } } }`,
    { q: `confirmation_number:${confirmation}` },
  )
  return data.orders.nodes[0] ?? null
}

/** Admin search lags a fresh Order by a minute or so; polls findOrderByConfirmation until it appears. */
export async function waitForOrderByConfirmation(confirmation: string, timeoutMs = 120_000): Promise<AdminOrder | null> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const order = await findOrderByConfirmation(confirmation)
    if (order || Date.now() > deadline) return order
    await new Promise((r) => setTimeout(r, 3000))
  }
}

/** Open Orders for an email created since a time: the clean-up fallback when the page gave no Order name. */
export async function findRecentOrders(email: string, sinceIso: string): Promise<AdminOrder[]> {
  const data = await adminGraphql<{ orders: { nodes: AdminOrder[] } }>(
    `query($q: String!) { orders(first: 10, query: $q) { nodes { ${ORDER_FIELDS} } } }`,
    { q: `email:"${email}" created_at:>='${sinceIso}'` },
  )
  return data.orders.nodes.filter((o) => !o.cancelledAt)
}
