import { memo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ProductSummary } from '@/lib/shopify'
import { formatMoney, formatDisplayPrice } from '@/lib/shopify'
import { useCart } from '@/context/CartContext'
import { trackAddToCart } from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { luxuryEase, viewportOnce } from '@/lib/animations'
import { QuickAddDialog } from '@/components/QuickAddDialog'

interface ProductCardProps {
  product: ProductSummary
  index?: number
}

const sized = (url: string) => `${url}${url.includes('?') ? '&' : '?'}width=600`

const badgeClass =
  'absolute top-3 left-3 z-[2] rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.08em]'

// Comparison function for React.memo to prevent unnecessary re-renders
const areProductCardPropsEqual = (prevProps: ProductCardProps, nextProps: ProductCardProps): boolean => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.title === nextProps.product.title &&
    prevProps.product.productType === nextProps.product.productType &&
    prevProps.product.availableForSale === nextProps.product.availableForSale &&
    prevProps.product.price.min.amount === nextProps.product.price.min.amount &&
    prevProps.product.price.max.amount === nextProps.product.price.max.amount &&
    prevProps.product.price.compareAt?.amount === nextProps.product.price.compareAt?.amount &&
    prevProps.product.featuredImage?.url === nextProps.product.featuredImage?.url &&
    prevProps.product.images[1]?.url === nextProps.product.images[1]?.url &&
    prevProps.product.quickAdd.kind === nextProps.product.quickAdd.kind &&
    prevProps.index === nextProps.index
  )
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart, openCart } = useCart()
  const location = useLocation()
  const [pickerOpen, setPickerOpen] = useState(false)

  const { price, quickAdd } = product
  const first = product.images[0] ?? product.featuredImage
  const second = product.images[1]
  const soldOut = !product.availableForSale || quickAdd.kind === 'sold-out'

  const handleQuickAdd = async () => {
    if (quickAdd.kind === 'choose') {
      setPickerOpen(true)
      return
    }
    if (quickAdd.kind !== 'add') return
    trackAddToCart({
      id: quickAdd.variantId,
      name: product.title,
      price: price.min.amount,
      quantity: 1,
      currency: price.min.currencyCode,
    })
    try {
      await addToCart(quickAdd.variantId)
      openCart()
    } catch {
      logger.error('Failed to add item to cart', { component: 'ProductCard', variantId: quickAdd.variantId, action: 'addToCart' })
      toast.error('Failed to add item. Please try again.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.6, ease: luxuryEase, delay: index * 0.12 }}
    >
      <div
        className="group relative rounded-[18px] bg-card p-1.5 pb-3.5 text-foreground shadow-[0_1px_2px_oklch(0.3_0.04_200/0.06),0_10px_30px_-12px_oklch(0.3_0.04_200/0.18)] transition-[transform,box-shadow] duration-300 hover:-translate-y-[3px] hover:shadow-[0_2px_4px_oklch(0.3_0.04_200/0.08),0_18px_40px_-14px_oklch(0.3_0.04_200/0.26)] focus-within:-translate-y-[3px] min-[761px]:rounded-[22px] min-[761px]:p-2.5 min-[761px]:pb-[18px]"
      >
        <div className="relative">
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[13px] bg-muted min-[761px]:rounded-2xl">
            {first ? (
              <>
                <img
                  src={sized(first.url)}
                  alt=""
                  className="block h-full w-full object-contain p-[6%]"
                  loading="lazy"
                />
                {second && (
                  <img
                    src={sized(second.url)}
                    alt=""
                    className="absolute inset-0 block h-full w-full object-contain p-[6%] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    loading="lazy"
                  />
                )}
              </>
            ) : (
              <div className="text-center text-foreground">
                <span aria-hidden="true" className="block font-heading text-6xl leading-none text-gold">M</span>
                <span className="text-sm">Photo coming soon</span>
              </div>
            )}
          </div>

          {!product.availableForSale ? (
            <span className={`${badgeClass} bg-card text-foreground`}>Sold out</span>
          ) : price.compareAt ? (
            <span className={`${badgeClass} bg-primary text-primary-foreground`}>&minus;{price.percentOff}%</span>
          ) : null}

          <button
            type="button"
            disabled={soldOut}
            onClick={handleQuickAdd}
            aria-label={soldOut ? `${product.title} is sold out` : `Quick add ${product.title}`}
            className="absolute right-2.5 bottom-2.5 z-10 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground disabled:shadow-none"
          >
            <Plus size={22} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="px-1 pt-2.5 min-[761px]:px-2 min-[761px]:pt-3.5">
          <p className="mb-1 text-[13px] uppercase tracking-[0.1em] text-muted-foreground">
            {product.productType || 'Jewellery'}
          </p>
          <h3 className="font-heading text-[18px] leading-tight font-normal line-clamp-2 min-[761px]:text-[21px]">
            <Link
              to={`/products/${product.handle}`}
              state={{ from: location.pathname + location.search }}
              data-testid="product-card"
              className="no-underline after:absolute after:inset-0 after:rounded-[18px] after:content-[''] min-[761px]:after:rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {product.title}
            </Link>
          </h3>
          <p className="mt-2 font-bold">
            <span>{formatDisplayPrice(price)}</span>
            {price.compareAt && (
              <s className="ml-[0.45em] font-normal text-muted-foreground line-through" aria-label={`was ${formatMoney(price.compareAt)}`}>
                {formatMoney(price.compareAt)}
              </s>
            )}
          </p>
        </div>
      </div>

      {quickAdd.kind === 'choose' && (
        <QuickAddDialog product={product} open={pickerOpen} onOpenChange={setPickerOpen} />
      )}
    </motion.div>
  )
}, areProductCardPropsEqual)
