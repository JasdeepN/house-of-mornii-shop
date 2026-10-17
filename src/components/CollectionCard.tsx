import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { CollectionSummary } from '@/lib/shopify'

interface CollectionCardProps {
  collection: CollectionSummary
  /** Replaces the photo, for Collections that have an illustration instead of an image. */
  media?: ReactNode
}

/** A Collection as the product card looks, without price, quick add or badges. */
export function CollectionCard({ collection, media }: CollectionCardProps) {
  const image = collection.image
  return (
    <div
      data-testid="collection-card"
      className="group relative rounded-[18px] bg-card p-1.5 pb-3.5 text-foreground shadow-[0_1px_2px_oklch(0.3_0.04_200/0.06),0_10px_30px_-12px_oklch(0.3_0.04_200/0.18)] transition-[transform,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_2px_4px_oklch(0.3_0.04_200/0.08),0_18px_40px_-14px_oklch(0.3_0.04_200/0.26)] focus-within:-translate-y-[3px] min-[761px]:rounded-[22px] min-[761px]:p-2.5 min-[761px]:pb-[18px]"
    >
      <div className="grid aspect-square place-items-center overflow-hidden rounded-[13px] bg-muted min-[761px]:rounded-2xl">
        {media ? (
          media
        ) : image ? (
          <img
            src={`${image.url}${image.url.includes('?') ? '&' : '?'}width=600`}
            alt=""
            className="block h-full w-full object-contain p-[6%]"
            loading="lazy"
          />
        ) : (
          <div className="text-center text-foreground">
            <span aria-hidden="true" className="block font-heading text-6xl leading-none text-gold">M</span>
            <span className="text-sm">Photo coming soon</span>
          </div>
        )}
      </div>
      <div className="px-1 pt-2.5 min-[761px]:px-2 min-[761px]:pt-3.5">
        <p className="mb-1 text-[13px] uppercase tracking-[0.1em] text-muted-foreground">Collection</p>
        <h3 className="font-heading text-[18px] leading-tight font-normal line-clamp-2 min-[761px]:text-[21px]">
          <Link
            to={`/collections/${collection.handle}`}
            className="no-underline after:absolute after:inset-0 after:rounded-[18px] after:content-[''] min-[761px]:after:rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {collection.title}
          </Link>
        </h3>
      </div>
    </div>
  )
}
