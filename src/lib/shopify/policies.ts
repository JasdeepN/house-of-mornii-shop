// The store's own policies (Shopify admin > Settings > Policies) read through the Storefront API.

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch } from './client'

export type PolicyKind = 'refund' | 'shipping' | 'privacy' | 'terms'

export interface Policy {
  title: string
  /** HTML as written in Shopify. Sanitise before rendering. */
  body: string
  handle: string
  url: string
}

export const POLICIES_QUERY = /* GraphQL */ `
  query ShopPolicies {
    shop {
      refundPolicy { title body handle url }
      shippingPolicy { title body handle url }
      privacyPolicy { title body handle url }
      termsOfService { title body handle url }
    }
  }
`

interface RawPolicy {
  title?: string | null
  body?: string | null
  handle?: string | null
  url?: string | null
}

interface RawPolicies {
  shop?: {
    refundPolicy?: RawPolicy | null
    shippingPolicy?: RawPolicy | null
    privacyPolicy?: RawPolicy | null
    termsOfService?: RawPolicy | null
  } | null
}

const FIELD: Record<PolicyKind, keyof NonNullable<RawPolicies['shop']>> = {
  refund: 'refundPolicy',
  shipping: 'shippingPolicy',
  privacy: 'privacyPolicy',
  terms: 'termsOfService',
}

/** A policy counts as published only when its body has visible text (Shopify returns an empty body for an unwritten one). */
export function toPolicy(raw: RawPolicy | null | undefined): Policy | null {
  if (!raw?.body) return null
  const text = raw.body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  if (!text) return null
  return { title: raw.title ?? '', body: raw.body, handle: raw.handle ?? '', url: raw.url ?? '' }
}

/** One store policy; `data` is null when the owner has not written it. */
export function usePolicy(kind: PolicyKind) {
  return useQuery({
    queryKey: ['shop-policies'],
    queryFn: () => shopifyFetch<RawPolicies>(POLICIES_QUERY),
    staleTime: 60 * 60 * 1000,
    select: (data): Policy | null => toPolicy(data.shop?.[FIELD[kind]]),
  })
}
