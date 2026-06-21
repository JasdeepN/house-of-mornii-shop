import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function OrdersPage() {
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
            Please sign in to view your orders.
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

  const orders = customer.orders.edges.map((e) => e.node)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <PageBreadcrumb items={[
        { label: 'Account', to: '/account' },
        { label: 'Orders', to: '/account/orders' },
      ]} />
      
      <div className="container mx-auto px-6 lg:px-20">
        <h1 className="text-2xl tracking-widest mb-8">ORDER HISTORY</h1>

        {orders.length === 0 ? (
          <div className="glass-panel p-12 golden-glow text-center">
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Link to="/shop">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest">
                START SHOPPING
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.orderNumber}`}
                className="block"
              >
                <div className="glass-panel p-6 golden-glow hover:scale-[1.01] transition-transform">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg tracking-widest font-medium">{order.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                          order.financialStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {order.financialStatus}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.processedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.lineItems.edges.length} item{order.lineItems.edges.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right md:text-left">
                      <p className="text-xl font-medium">{order.totalPrice.amount} {order.totalPrice.currencyCode}</p>
                      <Button
                        variant="outline"
                        className="mt-2 border-gold/30 hover:bg-accent/10 text-sm tracking-widest"
                      >
                        VIEW DETAILS
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
