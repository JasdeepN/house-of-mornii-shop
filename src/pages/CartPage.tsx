import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash, Plus, Minus, ShoppingBag } from '@phosphor-icons/react'
import { useCart } from '@/context/CartContext'
import { formatMoney, flattenEdges } from '@/lib/shopify'
import type { ShopifyCartLine } from '@/lib/shopify'
import { TrustBadges, PaymentIcons } from '@/components/TrustBadges'

function CartLineItem({ line }: { line: ShopifyCartLine }) {
  const { updateLineItem, removeLineItem, isLoading } = useCart()
  const variant = line.merchandise
  const image = variant.image

  return (
    <div
      className="flex gap-4 py-6 border-b"
      style={{ borderColor: 'oklch(1 0 0 / 0.08)' }}
    >
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden">
        {image ? (
          <img
            src={`${image.url}&width=160`}
            alt={image.altText || variant.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'oklch(0.20 0.03 210)' }}
          >
            <ShoppingBag size={20} className="text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <Link
            to={`/products/${variant.product.handle}`}
            className="text-sm tracking-widest hover:text-accent transition-colors line-clamp-1"
          >
            {variant.product.title}
          </Link>
          {variant.title !== 'Default Title' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {variant.title}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                line.quantity > 1
                  ? updateLineItem(line.id, line.quantity - 1)
                  : removeLineItem(line.id)
              }
              disabled={isLoading}
              className="w-7 h-7 flex items-center justify-center rounded-sm border border-foreground/20 hover:border-accent transition-colors disabled:opacity-40"
            >
              <Minus size={12} weight="bold" />
            </button>
            <span className="text-sm tracking-widest w-6 text-center">
              {line.quantity}
            </span>
            <button
              onClick={() => updateLineItem(line.id, line.quantity + 1)}
              disabled={isLoading}
              className="w-7 h-7 flex items-center justify-center rounded-sm border border-foreground/20 hover:border-accent transition-colors disabled:opacity-40"
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>

          {/* Price + Remove */}
          <div className="flex items-center gap-3">
            <span
              className="text-sm tracking-wider"
              style={{ color: 'oklch(0.60 0.11 78)' }}
            >
              {formatMoney(line.cost.totalAmount)}
            </span>
            <button
              onClick={() => removeLineItem(line.id)}
              disabled={isLoading}
              className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartPage() {
  const { cart, isLoading, itemCount } = useCart()
  const lines = cart ? flattenEdges(cart.lines) : []

  if (!cart || lines.length === 0) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <ShoppingBag size={48} weight="thin" className="text-muted-foreground" />
            <h1 className="text-4xl lg:text-5xl tracking-[0.15em]">Your Bag</h1>
            <p className="text-muted-foreground text-lg">
              Your bag is empty.
            </p>
            <Link
              to="/collections"
              className="text-accent hover:underline tracking-widest text-sm mt-4"
            >
              BROWSE COLLECTIONS &rarr;
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl lg:text-5xl tracking-[0.15em] mb-8 text-center"
        >
          Your Bag
          <span className="text-base text-muted-foreground ml-3">
            ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
        </motion.h1>

        <div className="max-w-2xl mx-auto">
          {/* Line Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {lines.map((line) => (
              <CartLineItem key={line.id} line={line} />
            ))}
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 space-y-4"
          >
            <div className="flex items-center justify-between text-lg">
              <span className="tracking-widest">SUBTOTAL</span>
              <span style={{ color: 'oklch(0.60 0.11 78)' }}>
                {formatMoney(cart.cost.subtotalAmount)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Taxes and shipping calculated at checkout.
            </p>

            <TrustBadges variant="full" className="my-2" />

            <a
              href={cart.checkoutUrl}
              className={`block w-full text-center py-4 rounded-sm tracking-[0.2em] text-sm font-semibold transition-all duration-300 ${
                isLoading
                  ? 'opacity-50 pointer-events-none'
                  : 'hover:opacity-90'
              }`}
              style={{
                background: 'oklch(0.60 0.11 78)',
                color: 'oklch(0.15 0.02 210)',
              }}
            >
              PROCEED TO CHECKOUT
            </a>

            <PaymentIcons className="mt-3" />

            <Link
              to="/collections"
              className="block text-center text-sm tracking-widest text-muted-foreground hover:text-accent transition-colors mt-4"
            >
              &larr; CONTINUE SHOPPING
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
