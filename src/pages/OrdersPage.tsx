import { useOrders } from '@/lib/customer'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { AccountGate } from './account/AccountGate'
import { formatDate, formatMoney, gidTail, humanStatus } from './account/format'

export function OrdersPage() {
  return (
    <AccountGate signedOutMessage="Please sign in to view your orders.">
      <OrdersList />
    </AccountGate>
  )
}

function OrdersList() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useOrders()
  // The API returns Orders newest first; pages are appended in order.
  const orders = data?.pages.flatMap((p) => p.orders) ?? []

  return (
    <div className="min-h-screen pt-8 pb-16">
      <div className="container mx-auto px-6 lg:px-20">
        <PageBreadcrumb items={[
          { label: 'Account', to: '/account' },
          { label: 'Orders', to: '/account/orders' },
        ]} className="mb-10" />

        <h1 className="text-2xl tracking-widest mb-8">ORDER HISTORY</h1>

        {orders.length === 0 ? (
          <div className="glass-panel p-12 golden-glow text-center">
            <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 tracking-widest">
              <Link to="/shop">START SHOPPING</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={`/account/orders/${gidTail(order.id)}`} className="block">
                <div className="glass-panel p-6 golden-glow hover:scale-[1.01] transition-transform">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg tracking-widest font-medium">{order.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                          order.financialStatus === 'PAID'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground border border-border'
                        }`}>
                          {humanStatus(order.financialStatus)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {formatDate(order.processedAt)}
                      </p>
                    </div>
                    <div className="text-right md:text-left">
                      <p className="text-xl font-medium">{formatMoney(order.totalPrice)}</p>
                      <Button
                        asChild
                        variant="outline"
                        className="mt-2 border-gold/30 hover:bg-accent/10 text-sm tracking-widest"
                      >
                        <span>VIEW DETAILS</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="border-gold/30 hover:bg-accent/10 tracking-widest"
                >
                  {isFetchingNextPage ? 'LOADING...' : 'LOAD MORE'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
