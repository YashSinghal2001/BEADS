import { useEffect, useState } from 'react'
import { Card, StatCard, Badge, Spinner, PageHeader } from '../components/ui.jsx'
import { BarChart, Donut } from '../components/Charts.jsx'
import { api, apiError } from '../api.js'
import { formatINR, formatDate, toast } from '../lib.js'

const STATUS_COLORS = {
  pending: '#EADBC8', confirmed: '#D4A373', paid: '#B07F4F', processing: '#9b8b6b',
  shipped: '#2D6A4F', delivered: '#2C2C2C', cancelled: '#c98b8b', refunded: '#a0a0a0',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="grid h-72 place-items-center"><Spinner className="h-8 w-8" /></div>
  if (!data) return null

  const o = data.overview
  const donut = Object.entries(data.ordersByStatus || {}).map(([k, v]) => ({ label: k, value: v, color: STATUS_COLORS[k] || '#ccc' }))

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Business overview" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="rupee" label="Total revenue" value={formatINR(o.totalRevenue)} sub={`AOV ${formatINR(o.avgOrderValue)}`} />
        <StatCard icon="cart" label="Orders" value={o.totalOrders} sub={`${o.pendingOrders} pending`} tone="ink" />
        <StatCard icon="users" label="Customers" value={o.totalUsers} sub={`CLV ${formatINR(o.customerLifetimeValue)}`} tone="forest" />
        <StatCard icon="box" label="Products" value={o.totalProducts} sub={`${data.lowStock.length} low stock`} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="activity" label="Conversion" value={`${o.conversionRate}%`} tone="forest" />
        <StatCard icon="checkCircle" label="Payment success" value={`${o.paymentSuccessRate}%`} />
        <StatCard icon="cart" label="Cart abandonment" value={`${o.checkoutAbandonmentRate}%`} tone="ink" />
        <StatCard icon="truck" label="Avg delivery" value={o.avgDeliveryDays != null ? `${o.avgDeliveryDays}d` : '—'} tone="forest" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Revenue (last 12 months)</h3>
          <BarChart data={data.monthlyRevenue} valueKey="revenue" labelKey="month" format={formatINR} />
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Orders by status</h3>
          {donut.length ? <Donut segments={donut} /> : <p className="text-sm text-graphite/50">No orders yet</p>}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Recent orders</h3>
          <div className="space-y-2">
            {data.recentOrders.length === 0 && <p className="text-sm text-graphite/50">No orders yet</p>}
            {data.recentOrders.map((ord) => (
              <div key={ord._id} className="flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink">{ord.orderNumber}</p>
                  <p className="text-xs text-graphite/55">{ord.user?.name || '—'} · {formatDate(ord.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="gold">{ord.orderStatus}</Badge>
                  <span className="font-semibold text-ink">{formatINR(ord.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Low stock alerts</h3>
          <div className="space-y-2">
            {data.lowStock.length === 0 && <p className="text-sm text-graphite/50">All products well stocked 🎉</p>}
            {data.lowStock.map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2.5 text-sm">
                <p className="truncate font-medium text-ink">{p.title}</p>
                <Badge tone={p.stockStatus === 'out_of_stock' ? 'red' : 'gold'}>{p.stock} left</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
