import { Link } from 'react-router-dom'
import { useCustomerAuth } from '@/context/CustomerAuthContext'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Package, AddressBook, UserCircle } from '@phosphor-icons/react'

export function AccountPage() {
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
            Please sign in to access your account details.
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

  const firstName = customer.firstName ?? 'Valued'
  const recentOrders = customer.orders.edges.slice(0, 3)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <PageBreadcrumb items={[{ label: 'Account', to: '/account' }]} />
      
      <div className="container mx-auto px-6 lg:px-20">
        <h1 className="text-2xl tracking-widest mb-2">
          HELLO, {firstName.toUpperCase()}
        </h1>
        <p className="text-muted-foreground mb-8">
          Manage your account settings and view your order history.
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/account/orders" className="block">
            <div className="glass-panel p-6 golden-glow hover:scale-[1.02] transition-transform cursor-pointer">
              <Package size={32} className="mb-4 text-accent" weight="bold" />
              <h2 className="text-lg tracking-widest mb-2">MY ORDERS</h2>
              <p className="text-sm text-muted-foreground">
                Track and view your order history
              </p>
            </div>
          </Link>

          <Link to="/account/addresses" className="block">
            <div className="glass-panel p-6 golden-glow hover:scale-[1.02] transition-transform cursor-pointer">
              <AddressBook size={32} className="mb-4 text-accent" weight="bold" />
              <h2 className="text-lg tracking-widest mb-2">ADDRESSES</h2>
              <p className="text-sm text-muted-foreground">
                Manage your shipping addresses
              </p>
            </div>
          </Link>

          <Link to="/account/details" className="block">
            <div className="glass-panel p-6 golden-glow hover:scale-[1.02] transition-transform cursor-pointer">
              <UserCircle size={32} className="mb-4 text-accent" weight="bold" />
              <h2 className="text-lg tracking-widest mb-2">ACCOUNT DETAILS</h2>
              <p className="text-sm text-muted-foreground">
                Update your personal information
              </p>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div className="glass-panel p-6 golden-glow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg tracking-widest">RECENT ORDERS</h2>
              <Link to="/account/orders">
                <Button variant="outline" className="border-gold/30 hover:bg-accent/10 text-sm tracking-widest">
                  VIEW ALL
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map(({ node: order }) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.orderNumber}`}
                  className="flex items-center justify-between p-4 rounded border border-border/30 hover:border-accent/50 transition-colors block"
                >
                  <div>
                    <p className="tracking-widest font-medium">{order.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.processedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.totalPrice.amount} {order.totalPrice.currencyCode}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.financialStatus}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
