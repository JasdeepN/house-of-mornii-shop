import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BaroqueCard,
  BaroqueCardHeader,
  BaroqueCardTitle,
  BaroqueCardDescription,
  BaroqueCardContent,
  BaroqueCardFooter,
} from '@/components/BaroqueCard'
import type { ShopifyProduct } from '@/lib/shopify'
import { formatMoney } from '@/lib/shopify'
import { memo } from 'react'

interface ProductCardProps {
  product: ShopifyProduct
  index?: number
}

// Comparison function for React.memo to prevent unnecessary re-renders
const areProductCardPropsEqual = (prevProps: ProductCardProps, nextProps: ProductCardProps): boolean => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.title === nextProps.product.title &&
    prevProps.product.description === nextProps.product.description &&
    prevProps.product.priceRange.minVariantPrice.amount === nextProps.product.priceRange.minVariantPrice.amount &&
    prevProps.product.priceRange.maxVariantPrice?.amount === nextProps.product.priceRange.maxVariantPrice?.amount &&
    prevProps.product.featuredImage?.url === nextProps.product.featuredImage?.url &&
    prevProps.index === nextProps.index
  )
}

export const ProductCard = memo(function ProductCard({ product, index = 0 }: ProductCardProps) {
  const price = product.priceRange.minVariantPrice
  const compareAt = product.priceRange.maxVariantPrice
  const hasDiscount =
    compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount)
  const imageUrl = product.featuredImage?.url

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.12 }}
    >
    <Link to={`/products/${product.handle}`} className="block h-full" data-testid="product-card">
      <BaroqueCard
        className="h-full cursor-pointer"
        animate={false}
        hoverable
        noGlow
      >
        <BaroqueCardHeader withDivider>
          <BaroqueCardTitle className="text-lg md:text-xl line-clamp-1">
            {product.title}
          </BaroqueCardTitle>
          <BaroqueCardDescription>
            {hasDiscount ? (
              <>
                <span className="line-through opacity-60 mr-2">
                  {formatMoney(compareAt)}
                </span>
                <span style={{ color: 'oklch(0.60 0.11 78)' }}>
                  {formatMoney(price)}
                </span>
              </>
            ) : (
              formatMoney(price)
            )}
          </BaroqueCardDescription>
        </BaroqueCardHeader>

        <BaroqueCardContent className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm mx-auto">
            {imageUrl ? (
              <img
                src={`${imageUrl}&width=600`}
                alt={product.featuredImage?.altText || product.title}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'oklch(0.20 0.03 210)' }}
              >
                <span className="text-muted-foreground text-sm tracking-widest uppercase">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </BaroqueCardContent>

        <BaroqueCardFooter>
          <button className="pill-btn">
            VIEW DETAILS
          </button>
        </BaroqueCardFooter>
      </BaroqueCard>
    </Link>
    </motion.div>
  )
}, areProductCardPropsEqual)
