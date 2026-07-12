import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Primitives'
import { LineSkeleton } from '../../components/ui/Skeleton'
import { useOrderStore } from '../../store/useOrderStore'
import { useWishlistStore } from '../../store/useWishlistStore'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { formatINR } from '../../lib/format'

export default function Overview() {
  const orders = useOrderStore((s) => s.orders)
  const loading = useOrderStore((s) => s.loading)
  const fetchOrders = useOrderStore((s) => s.fetch)
  const loaded = useOrderStore((s) => s.loaded)
  const wishCount = useWishlistStore((s) => s.items.length)
  const cartCount = useCartStore((s) => s.count())
  const points = useAuthStore((s) => s.user?.loyaltyPoints || 0)

  useEffect(() => {
    if (!loaded) fetchOrders()
  }, [loaded, fetchOrders])

  const stats = [
    { icon: 'package', label: 'Total orders', value: orders.length, to: '/account/orders' },
    { icon: 'cart', label: 'In your cart', value: cartCount, to: '/cart' },
    { icon: 'heart', label: 'Wishlist items', value: wishCount, to: '/account/wishlist' },
    { icon: 'gift', label: 'Reward points', value: points, to: '/account' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={s.to} className="block rounded-2xl bg-white p-5 shadow-soft transition-shadow hover:shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold-deep">
                <Icon name={s.icon} size={20} />
              </span>
              <p className="mt-4 font-display text-2xl font-semibold text-ink">{s.value}</p>
              <p className="text-sm text-graphite/60">{s.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Recent orders</h2>
          <Link to="/account/orders" className="text-sm font-medium text-gold-deep hover:underline">View all</Link>
        </div>

        {loading && !orders.length ? (
          <LineSkeleton lines={4} />
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-graphite/60">
            No orders yet.{' '}
            <Link to="/shop" className="font-medium text-gold-deep hover:underline">Start shopping</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((o) => (
              <Link key={o._id} to="/account/orders" className="flex items-center justify-between rounded-2xl bg-cream/60 p-4 transition-colors hover:bg-cream">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 2).map((it, idx) => (
                      <img key={idx} src={it.image} alt="" loading="lazy" className="h-11 w-11 rounded-full border-2 border-white object-cover" />
                    ))}
                  </div>
                  <div>
                    <p className="font-button text-sm font-semibold text-ink">{o.id}</p>
                    <p className="text-xs text-graphite/55">{o.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone={o.tone}>{o.status}</Badge>
                  <span className="hidden font-semibold text-ink sm:inline">{formatINR(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
