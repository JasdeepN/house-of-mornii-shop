export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatMoney(m: { amount: string; currencyCode: string }): string {
  return `${m.amount} ${m.currencyCode}`
}

/** Numeric tail of a GID: gid://shopify/Order/123 -> 123. */
export function gidTail(gid: string): string {
  return gid.slice(gid.lastIndexOf('/') + 1)
}

/** "PAID" / "PARTIALLY_PAID" -> "paid" / "partially paid". */
export function humanStatus(s: string | null): string {
  return (s ?? '').toLowerCase().replace(/_/g, ' ')
}
