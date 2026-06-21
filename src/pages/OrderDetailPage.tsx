import { useParams, Link } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'

export function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const { customer, isAuthenticated, isLoading } = useCustomerAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'oklch(0.60 0.11 78)', borderTopColor: 'transparent' }}
          />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Loading...
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !customer) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl tracking-widest mb-4">ACCOUNT REQUIRED</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view order details.
          </p>
          <Link to="/shop">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest">
              CONTINUE SHOPPING
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const order = customer.orders.edges.find(
    (e) => e.node.orderNumber.toString() === orderNumber,
  )?.node

  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-6 lg:px-20">
          <PageBreadcrumb items={[
            { label: 'Account', to: '/account' },
            { label: 'Orders', to: '/account/orders' },
            { label: `Order #${orderNumber}` },
          ]} />
          <div className="glass-panel p-12 golden-glow text-center">
            <h1 className="text-2xl tracking-widest mb-4">ORDER NOT FOUND</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find the order you're looking for.
            </p>
            <Link to="/account/orders">
              <Button variant="outline" className="border-gold/30 hover:bg-accent/10 tracking-widest">
                <ArrowLeft className="mr-2 h-4 w-4" /> BACK TO ORDERS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb items={[
          { label: 'Account', to: '/account' },
          { label: 'Orders', to: '/account/orders' },
          { label: `Order ${order.name}` },
        ]} />

        <div className="flex items-center gap-4 mb-8">
          <Link to="/account/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} weight="bold" />
            </Button>
          </Link>
          <h1 className="text-2xl tracking-widest">ORDER {order.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 golden-glow">
              <h2 className="text-lg tracking-widest mb-4">ITEMS ORDERED</h2>
              <div className="space-y-4">
                {order.lineItems.edges.map(({ node: item }, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-border/30 last:border-0">
                    {item.image && (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium tracking-wide">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {item.originalPrice.amount} {item.originalPrice.currencyCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="space-y-6">
            <div className="glass-panel p-6 golden-glow">
              <h2 className="text-lg tracking-widest mb-4">ORDER SUMMARY</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>
                    {new Date(order.processedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{order.financialStatus}</span>
                </div>
                {order.fulfillmentStatus && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fulfillment</span>
                    <span className="capitalize">{order.fulfillmentStatus}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border/30">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">
                    {order.totalPrice.amount} {order.totalPrice.currencyCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
