// The Storefront query for the shop's Brand settings. Dependency-free so the Vite build plugin
// (vite.config.ts) can import it without pulling in the browser client.

export const BRAND_QUERY = /* GraphQL */ `
  query ShopBrand {
    shop {
      brand {
        logo { image { url altText width height } }
        squareLogo { image { url altText width height } }
        coverImage { image { url altText width height } }
      }
    }
  }
`

export interface RawBrandImage {
  image?: { url?: string | null; altText?: string | null; width?: number | null; height?: number | null } | null
}

export interface RawShopBrand {
  shop?: {
    brand?: {
      logo?: RawBrandImage | null
      squareLogo?: RawBrandImage | null
      coverImage?: RawBrandImage | null
    } | null
  } | null
}

export interface BrandImage {
  url: string
  alt: string
  width: number | null
  height: number | null
}

export interface ShopBrand {
  logo: BrandImage | null
  squareLogo: BrandImage | null
  coverImage: BrandImage | null
}

function toBrandImage(raw: RawBrandImage | null | undefined): BrandImage | null {
  const image = raw?.image
  if (!image?.url) return null
  return { url: image.url, alt: image.altText || '', width: image.width ?? null, height: image.height ?? null }
}

export function toShopBrand(data: RawShopBrand | null | undefined): ShopBrand {
  const brand = data?.shop?.brand
  return {
    logo: toBrandImage(brand?.logo),
    squareLogo: toBrandImage(brand?.squareLogo),
    coverImage: toBrandImage(brand?.coverImage),
  }
}
