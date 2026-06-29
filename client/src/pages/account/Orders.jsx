import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Primitives'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/Controls'
import { ProductCardSkeleton } from '../../components/ui/Skeleton'
import { useOrderStore } from '../../store/useOrderStore'
import { formatINR } from '../../lib/format'

const tabs = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function Orders() {
  const orders = useOrderStore((s) => s.orders)
  const loading = useOrderStore((s) => s.loading)
  const loaded = useOrderStore((s) => s.loaded)
  const fetchOrders = useOrderStore((s) => s.fetch)
  const cancel = useOrderStore((s) => s.cancel)
  const requestReturn = useOrderStore((s) => s.requestReturn)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    if (!loaded) fetchOrders()
  }, [loaded, fetchOrders])

  const filtered =
    tab === 'All' ? orders : orders.filter((o) => o.status.toLowerCase() === tab.toLowerCase())

  return (
    <div>
      <h2 className="mb-5 font-display text-2xl font-semibold text-ink">Your orders</h2>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-cream' : 'text-graphite/70 hover:text-ink'
            }`}
          >
            {tab === t && (
              <motion.span layoutId="order-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {loading && !orders.length ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="package"
          title={`No ${tab.toLowerCase()} orders`}
          message="When you place an order, it will appear here."
          action={<Button to="/shop" variant="gold">Start shopping</Button>}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((o) => (
              <motion.div
                key={o._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden rounded-3xl bg-white shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 bg-cream/40 px-5 py-4">
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-xs text-graphite/55">Order</p>
                      <p className="font-button text-sm font-semibold text-ink">{o.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-graphite/55">Placed</p>
                      <p className="text-sm text-ink">{o.date}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-graphite/55">Total</p>
                      <p className="text-sm font-semibold text-ink">{formatINR(o.total)}</p>
                    </div>
                  </div>
                  <Badge tone={o.tone}>{o.status}</Badge>
                </div>

                <div className="p-5">
                  <p className="mb-3 flex items-center gap-2 text-sm text-graphite/70">
                    <Icon name="truck" size={16} className="text-gold-deep" />
                    {o.tracking}
                  </p>
                  <div className="space-y-3">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand/40">
                          <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                          <p className="text-xs text-graphite/55">Qty {it.qty} · {formatINR(it.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button size="sm" variant="outline" to={`/account/orders/${o._id}`}>
                      View details
                    </Button>
                    {['pending', 'confirmed', 'processing'].includes(o.statusKey) && (
                      <Button size="sm" variant="ghost" onClick={() => cancel(o._id, 'Cancelled by customer')}>
                        Cancel order
                      </Button>
                    )}
                    {o.statusKey === 'delivered' && (
                      <Button size="sm" variant="ghost" onClick={() => requestReturn(o._id, 'Return requested by customer')}>
                        Return / Exchange
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
