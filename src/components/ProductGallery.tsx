import { useState } from 'react'
import type { ShopifyImage } from '@/lib/shopify'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: ShopifyImage[]
  title: string
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedImage = images[selectedIndex]

  if (images.length === 0) {
    return (
      <div
        className="aspect-square w-full rounded-sm flex items-center justify-center"
        style={{ background: 'oklch(0.20 0.03 210)' }}
      >
        <span className="text-muted-foreground text-sm tracking-widest uppercase">
          No Image
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-sm">
        <img
          src={`${selectedImage.url}&width=1200`}
          alt={selectedImage.altText || title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.url}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden border-2 transition-all duration-300',
                index === selectedIndex
                  ? 'border-accent opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={`${image.url}&width=128`}
                alt={image.altText || `${title} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
