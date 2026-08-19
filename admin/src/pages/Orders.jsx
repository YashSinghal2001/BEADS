import { useEffect, useState } from 'react'
import { Button, Badge, Modal, Table, PageHeader, Select, Field, Spinner, Icon } from '../components/ui.jsx'
import { api, apiError } from '../api.js'
import { formatINR, formatDate, formatDateTime, toast } from '../lib.js'
import { useAuth } from '../store/auth.js'

const STATUSES = ['', 'pending', 'confirmed', 'paid', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']
const NEXT = ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
const tone = (s) => (['delivered', 'paid'].includes(s) ? 'forest' : ['cancelled', 'refunded', 'returned'].includes(s) ? 'red' : 'gold')

export default function Orders() {
  const can = useAuth((s) => s.can)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)

  const load = () => {
    setLoading(true)
    api.orders({ status: status || undefined, limit: 50 }).then((r) => setRows(r.orders || [])).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }
  useEffect(load, [status])

  const columns = [
    { key: 'orderNumber', label: 'Order', render: (r) => <span className="font-medium text-ink">{r.orderNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => r.user?.name || '—' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'payment', label: 'Payment', render: (r) => <Badge tone={r.paymentStatus === 'paid' ? 'forest' : r.paymentStatus === 'refunded' ? 'red' : 'sand'}>{r.paymentMethod} · {r.paymentStatus}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={tone(r.orderStatus)}>{r.orderStatus.replace(/_/g, ' ')}</Badge> },
    { key: 'total', label: 'Total', align: 'right', render: (r) => formatINR(r.total) },
  ]

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${rows.length} shown`} actions={<Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUSES.map((s) => ({ value: s, label: s || 'All statuses' }))} />} />
      {loading ? <div className="grid h-60 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={columns} rows={rows} rowKey={(r) => r._id} onRowClick={(r) => setDetail(r._id)} empty="No orders" />}
      {detail && <OrderDetail id={detail} canRefund={can('order.refund')} canWrite={can('order.write')} onClose={() => setDetail(null)} onChange={load} />}
    </div>
  )
}

function OrderDetail({ id, canRefund, canWrite, onClose, onChange }) {
  const [order, setOrder] = useState(null)
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.order(id).then(setOrder).catch((e) => toast.error(apiError(e)))
  useEffect(() => { load() }, [id])

  if (!order) {
    return (
      <Modal open onClose={onClose} title="Order" size="lg">
        <div className="grid h-40 place-items-center"><Spinner className="h-7 w-7" /></div>
      </Modal>
    )
  }

  const run = async (fn, ok) => {
    setBusy(true)
    try {
      await fn()
      toast.success(ok)
      await load()
      onChange()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Order ${order.orderNumber}`} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={tone(order.orderStatus)}>{order.orderStatus.replace(/_/g, ' ')}</Badge>
          <Badge tone={order.paymentStatus === 'paid' ? 'forest' : 'sand'}>{order.paymentMethod} · {order.paymentStatus}</Badge>
          <span className="text-sm text-graphite/55">{formatDate(order.createdAt)}</span>
          <span className="ml-auto font-display text-xl font-semibold text-ink">{formatINR(order.total)}</span>
        </div>

        <div className="rounded-xl bg-cream/60 p-3 text-sm">
          <p className="font-medium text-ink">{order.shippingAddress?.fullName}</p>
          <p className="text-graphite/70">{order.shippingAddress?.addressLine1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode} · {order.shippingAddress?.phone}</p>
          {order.customerEmail && <p className="text-graphite/70">{order.customerEmail}</p>}
          {order.giftMessage && <p className="mt-1 text-gold-deep">🎁 {order.giftMessage}</p>}
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-ink/10 p-3 text-sm">
          <p className="mb-1.5 font-button text-xs font-semibold uppercase text-graphite/50">Payment</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-graphite/75">
            <span>Method: <span className="font-medium text-ink">{order.paymentMethod}</span></span>
            <span>Status: <span className="font-medium text-ink">{order.paymentStatus}</span></span>
            {order.payment?.gatewayPaymentId && <span>Payment ID: <span className="font-medium text-ink">{order.payment.gatewayPaymentId}</span></span>}
            {order.payment?.gatewayOrderId && <span>Gateway order: <span className="font-medium text-ink">{order.payment.gatewayOrderId}</span></span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-graphite/60">
            <span>Subtotal {formatINR(order.subtotal)}</span>
            {order.discount > 0 && <span>Discount −{formatINR(order.discount)}</span>}
            <span>Shipping {formatINR(order.shipping)}</span>
            <span>Tax {formatINR(order.tax)}</span>
            <span className="font-semibold text-ink">Total {formatINR(order.total)}</span>
          </div>
        </div>

        {/* Shipping / Shiprocket */}
        {(order.shipmentTracking?.shipmentId || order.shipmentTracking?.awb || order.shipmentTracking?.providerOrderId) && (
          <div className="rounded-xl border border-ink/10 p-3 text-sm">
            <p className="mb-1.5 font-button text-xs font-semibold uppercase text-graphite/50">Shipping · {order.shipmentTracking.provider || 'shiprocket'}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-graphite/75">
              {order.shipmentTracking.providerOrderId && <span>Shiprocket order: <span className="font-medium text-ink">{order.shipmentTracking.providerOrderId}</span></span>}
              {order.shipmentTracking.shipmentId && <span>Shipment: <span className="font-medium text-ink">{order.shipmentTracking.shipmentId}</span></span>}
              {order.shipmentTracking.awb && <span>AWB: <span className="font-medium text-ink">{order.shipmentTracking.awb}</span></span>}
              {order.shipmentTracking.courier && <span>Courier: <span className="font-medium text-ink">{order.shipmentTracking.courier}</span></span>}
              {order.shipmentTracking.status && <span>Status: <span className="font-medium text-ink">{order.shipmentTracking.status}</span></span>}
              {order.shipmentTracking.trackingUrl && <a className="text-gold-deep underline" href={order.shipmentTracking.trackingUrl} target="_blank" rel="noreferrer">Tracking</a>}
              {order.shipmentTracking.label && <a className="text-gold-deep underline" href={order.shipmentTracking.label} target="_blank" rel="noreferrer">Label</a>}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <img src={it.image} alt="" className="h-10 w-10 rounded-lg object-cover bg-sand/40" />
              <span className="min-w-0 flex-1 truncate text-ink">{it.title}</span>
              <span className="text-graphite/55">×{it.quantity}</span>
              <span className="font-medium text-ink">{formatINR(it.price * it.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-ink/10 p-3">
          <p className="mb-2 font-button text-xs font-semibold uppercase text-graphite/50">Timeline</p>
          <div className="space-y-1.5">
            {order.timeline?.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Icon name="checkCircle" size={14} className="text-forest" />
                <span className="font-medium text-ink">{t.status.replace(/_/g, ' ')}</span>
                <span className="text-graphite/45">{t.by}</span>
                <span className="ml-auto text-graphite/45">{formatDateTime(t.at)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/8 pt-4">
          <Button size="sm" variant="outline" onClick={() => api.downloadInvoice(order._id, order.orderNumber)}><Icon name="download" size={15} /> Invoice</Button>
          <Button size="sm" variant="outline" onClick={() => api.downloadLabel(order._id, order.orderNumber, 'packing')}><Icon name="download" size={15} /> Packing slip</Button>
          {canWrite && !order.shipmentTracking?.shipmentId && ['confirmed', 'paid', 'processing', 'packed'].includes(order.orderStatus) && (
            <Button size="sm" variant="primary" disabled={busy} onClick={() => run(() => api.shipOrder(order._id), 'Shiprocket order created')}>Send to Shiprocket</Button>
          )}
          {canWrite && (
            <div className="ml-auto flex items-center gap-2">
              <Select value={next} onChange={(e) => setNext(e.target.value)} options={[{ value: '', label: 'Update status…' }, ...NEXT.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))]} />
              <Button size="sm" variant="primary" disabled={!next || busy} onClick={() => run(() => api.updateOrderStatus(order._id, { orderStatus: next, note: 'Updated by admin' }), 'Status updated').then(() => setNext(''))}>Apply</Button>
            </div>
          )}
        </div>
        {canRefund && order.paymentStatus !== 'refunded' && (
          <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => api.refundOrder(order._id), 'Refund processed')}>Refund order</Button>
        )}
      </div>
    </Modal>
  )
}
