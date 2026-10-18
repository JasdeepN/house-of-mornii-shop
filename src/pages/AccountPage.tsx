import { Link } from 'react-router-dom'
import { useCustomerProfile, useOrders } from '@/lib/customer'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Package, AddressBook, UserCircle } from '@phosphor-icons/react'
import { AccountGate } from './account/AccountGate'
import { formatDate, formatMoney, gidTail, humanStatus } from './account/format'

export function AccountPage() {
  return (
    <AccountGate signedOutMessage="Please sign in to access your account details.">
      <AccountOverview />
    </AccountGate>
  )
}

function AccountOverview() {
  const { data: profile } = useCustomerProfile()
  const { data: ordersData } = useOrders()

  const firstName = profile?.firstName ?? 'Valued'
  const recentOrders = (ordersData?.pages[0]?.orders ?? []).slice(0, 3)

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb items={[{ label: 'Account', to: '/account' }]} className="mb-10" />

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
              <Button asChild variant="outline" className="border-gold/30 hover:bg-accent/10 text-sm tracking-widest">
                <Link to="/account/orders">VIEW ALL</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${gidTail(order.id)}`}
                  className="flex items-center justify-between p-4 rounded border border-border/30 hover:border-accent/50 transition-colors block"
                >
                  <div>
                    <p className="tracking-widest font-medium">{order.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.processedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(order.totalPrice)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{humanStatus(order.financialStatus)}</p>
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
