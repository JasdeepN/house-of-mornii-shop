// Brand settings (Shopify admin > Settings > Brand) read through the Storefront API.

import { useQuery } from '@tanstack/react-query'
import { shopifyFetch } from './client'
import { BRAND_QUERY, toShopBrand, type RawShopBrand, type ShopBrand } from './brand-query'

export type { BrandImage, ShopBrand } from './brand-query'

const ONE_HOUR = 60 * 60 * 1000
const EMPTY_BRAND: ShopBrand = { logo: null, squareLogo: null, coverImage: null }

/** The shop's logo, square logo and cover image; each is null until set (and while loading or on error). */
export function useShopBrand(): ShopBrand {
  const { data } = useQuery({
    queryKey: ['shop-brand'],
    queryFn: async () => toShopBrand(await shopifyFetch<RawShopBrand>(BRAND_QUERY)),
    staleTime: ONE_HOUR,
  })
  return data ?? EMPTY_BRAND
}
