import { useParams, Link } from 'react-router-dom'
import { useOrder } from '@/lib/customer'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import { AccountGate, LoadingState } from './account/AccountGate'
import { formatDate, formatMoney, humanStatus } from './account/format'

export function OrderDetailPage() {
  return (
    <AccountGate signedOutMessage="Please sign in to view order details.">
      <OrderDetail />
    </AccountGate>
  )
}

function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isLoading } = useOrder(`gid://shopify/Order/${orderId}`)

  if (isLoading) return <LoadingState />

  if (!order) {
    return (
      <div className="min-h-screen pt-8 pb-16">
        <div className="container mx-auto px-6 lg:px-20">
          <PageBreadcrumb items={[
            { label: 'Account', to: '/account' },
            { label: 'Orders', to: '/account/orders' },
            { label: 'Order' },
          ]} />
          <div className="glass-panel p-12 golden-glow text-center">
            <h1 className="text-2xl tracking-widest mb-4">ORDER NOT FOUND</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find the order you're looking for.
            </p>
            <Button asChild variant="outline" className="border-gold/30 hover:bg-accent/10 tracking-widest">
              <Link to="/account/orders">
                <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO ORDERS
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const shipping = order.shippingAddress

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb items={[
          { label: 'Account', to: '/account' },
          { label: 'Orders', to: '/account/orders' },
          { label: `Order ${order.name}` },
        ]} />

        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="ghost" size="icon">
            <Link to="/account/orders" aria-label="Back to orders">
              <ArrowLeft size={20} weight="bold" />
            </Link>
          </Button>
          <h1 className="text-2xl tracking-widest">ORDER {order.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 golden-glow">
              <h2 className="text-lg tracking-widest mb-4">ITEMS ORDERED</h2>
              <div className="space-y-4">
                {order.lineItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-border/30 last:border-0">
                    {item.image && (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium tracking-wide">{item.title}</p>
                      {item.variantTitle && (
                        <p className="text-sm text-muted-foreground">{item.variantTitle}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    {item.totalPrice && <p className="font-medium">{formatMoney(item.totalPrice)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6 golden-glow">
              <h2 className="text-lg tracking-widest mb-4">ORDER SUMMARY</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(order.processedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{humanStatus(order.financialStatus)}</span>
                </div>
                {order.fulfillmentStatus && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fulfillment</span>
                    <span className="capitalize">{humanStatus(order.fulfillmentStatus)}</span>
                  </div>
                )}
                {order.subtotal && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(order.subtotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatMoney(order.totalShipping)}</span>
                </div>
                {order.totalTax && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatMoney(order.totalTax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border/30">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">{formatMoney(order.totalPrice)}</span>
                </div>
              </div>
            </div>

            {shipping && (
              <div className="glass-panel p-6 golden-glow">
                <h2 className="text-lg tracking-widest mb-4">SHIPPING ADDRESS</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  {shipping.formatted.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
