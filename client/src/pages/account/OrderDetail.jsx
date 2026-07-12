import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Primitives'
import Button from '../../components/ui/Button'
import { LineSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/Controls'
import { orderApi } from '../../api/order.api'
import { useOrderStore } from '../../store/useOrderStore'
import { useCartStore } from '../../store/useCartStore'
import { formatINR } from '../../lib/format'
import { toast } from '../../store/useToastStore'

const STEP_ORDER = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered']
const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cancel = useOrderStore((s) => s.cancel)
  const requestReturn = useOrderStore((s) => s.requestReturn)
  const fetchCart = useCartStore((s) => s.fetch)

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    orderApi
      .get(id)
      .then((o) => setOrder(o))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id])

  if (loading) return <LineSkeleton lines={8} />
  if (!order) {
    return (
      <EmptyState
        icon="package"
        title="Order not found"
        message="We couldn't find this order."
        action={<Button to="/account/orders" variant="gold">Back to orders</Button>}
      />
    )
  }

  const raw = order.raw || {}
  const timeline = raw.timeline || []
  const ship = raw.shipmentTracking || {}
  const canCancel = ['pending', 'confirmed', 'processing', 'paid'].includes(order.statusKey)
  const canReturn = order.statusKey === 'delivered'

  const doInvoice = () => orderApi.downloadInvoice(order._id, order.id).catch(() => toast.error('Could not download invoice'))
  const doReorder = async () => {
    setBusy(true)
    try {
      const res = await orderApi.reorder(order._id)
      await fetchCart()
      toast.success(`${res.added} item(s) added to cart`)
      navigate('/cart')
    } catch {
      toast.error('Could not reorder')
    } finally {
      setBusy(false)
    }
  }
  const doCancel = async () => {
    await cancel(order._id, 'Cancelled by customer')
    load()
  }
  const doReturn = async () => {
    await requestReturn(order._id, 'Return requested by customer')
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/account/orders" className="mb-1 inline-flex items-center gap-1 text-sm text-graphite/60 hover:text-ink">
            <Icon name="chevronLeft" size={16} /> Orders
          </Link>
          <h2 className="font-display text-2xl font-semibold text-ink">{order.id}</h2>
          <p className="text-sm text-graphite/55">Placed {order.date}</p>
        </div>
        <Badge tone={order.tone}>{order.status}</Badge>
      </div>

      {/* Timeline */}
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-button text-sm font-semibold uppercase tracking-wider text-graphite/60">Order timeline</h3>
        {['cancelled', 'returned', 'refunded'].includes(order.statusKey) ? (
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <TimelineRow key={i} active label={cap(t.status)} note={t.note} at={t.at} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {STEP_ORDER.map((step) => {
              const done = STEP_ORDER.indexOf(step) <= STEP_ORDER.indexOf(order.statusKey)
              const entry = timeline.find((t) => t.status === step)
              return <TimelineRow key={step} active={done} label={cap(step)} note={entry?.note} at={entry?.at} />
            })}
          </div>
        )}
      </div>

      {/* Shipment tracking */}
      {(ship.awb || ship.trackingUrl) && (
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h3 className="mb-3 font-button text-sm font-semibold uppercase tracking-wider text-graphite/60">Shipment</h3>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <Info label="Courier" value={ship.courier || '—'} />
            <Info label="AWB" value={ship.awb || '—'} />
            <Info label="Status" value={ship.status || order.status} />
          </div>
          {ship.trackingUrl && (
            <a href={ship.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-deep hover:underline">
              Track shipment <Icon name="arrowUpRight" size={15} />
            </a>
          )}
        </div>
      )}

      {/* Items */}
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-button text-sm font-semibold uppercase tracking-wider text-graphite/60">Items</h3>
        <div className="space-y-3">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand/40">
                <img src={it.image} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                <p className="text-xs text-graphite/55">Qty {it.qty} · {formatINR(it.price)}</p>
              </div>
              <span className="text-sm font-semibold text-ink">{formatINR(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2 border-t border-ink/8 pt-4 text-sm">
          <Row label="Subtotal" value={formatINR(raw.subtotal)} />
          {raw.discount > 0 && <Row label="Discount" value={`– ${formatINR(raw.discount)}`} accent="text-forest" />}
          <Row label="Shipping" value={raw.shipping ? formatINR(raw.shipping) : 'Free'} />
          <Row label="Tax" value={formatINR(raw.tax)} />
          <div className="flex items-center justify-between border-t border-ink/8 pt-2 font-semibold text-ink">
            <span>Total · {raw.paymentMethod?.toUpperCase()} ({raw.paymentStatus})</span>
            <span className="font-display text-lg">{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={doInvoice}>
          <Icon name="package" size={16} /> Download invoice
        </Button>
        <Button variant="outline" onClick={doReorder} disabled={busy}>
          <Icon name="refresh" size={16} /> Reorder
        </Button>
        {canCancel && <Button variant="ghost" onClick={doCancel}>Cancel order</Button>}
        {canReturn && <Button variant="ghost" onClick={doReturn}>Return / Exchange</Button>}
      </div>
    </div>
  )
}

function TimelineRow({ active, label, note, at }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`grid h-6 w-6 place-items-center rounded-full ${active ? 'bg-forest text-white' : 'bg-sand text-graphite/50'}`}>
          {active ? <Icon name="check" size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </span>
      </div>
      <div className="pb-2">
        <p className={`text-sm font-medium ${active ? 'text-ink' : 'text-graphite/50'}`}>{label}</p>
        {note && <p className="text-xs text-graphite/55">{note}</p>}
        {at && active && <p className="text-xs text-graphite/40">{new Date(at).toLocaleString('en-IN')}</p>}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-graphite/50">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-graphite/70">{label}</span>
      <span className={accent ? `font-medium ${accent}` : 'font-medium text-ink'}>{value}</span>
    </div>
  )
}
