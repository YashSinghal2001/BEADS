import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Primitives'
import Button from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/Controls'
import { useOrderStore } from '../../store/useOrderStore'
import { formatINR } from '../../lib/format'

const reasons = ['Changed my mind', 'Item damaged', 'Wrong item received', 'Quality not as expected', 'Other']

export default function Returns() {
  const orders = useOrderStore((s) => s.orders)
  const loaded = useOrderStore((s) => s.loaded)
  const fetchOrders = useOrderStore((s) => s.fetch)
  const requestReturn = useOrderStore((s) => s.requestReturn)
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [reason, setReason] = useState(reasons[0])

  useEffect(() => {
    if (!loaded) fetchOrders()
  }, [loaded, fetchOrders])

  const returned = orders.filter((o) => ['returned', 'refunded'].includes(o.statusKey))
  const delivered = orders.filter((o) => o.statusKey === 'delivered')

  const submit = async (e) => {
    e.preventDefault()
    if (!orderId) return
    await requestReturn(orderId, reason)
    setOpen(false)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-ink">Returns & exchanges</h2>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)} disabled={!delivered.length}>
          <Icon name="refresh" size={16} /> Request return
        </Button>
      </div>

      <div className="mb-6 rounded-2xl bg-gold/5 p-4 text-sm text-graphite/75">
        <p className="flex items-center gap-2 font-medium text-ink">
          <Icon name="info" size={16} className="text-gold-deep" /> Our return policy
        </p>
        <p className="mt-1.5">
          Unopened packs can be returned within 7 days of delivery for a full refund. Opened items are eligible for exchange if faulty.
        </p>
      </div>

      {returned.length === 0 ? (
        <EmptyState icon="refresh" title="No returns yet" message="Your return and exchange requests will appear here." />
      ) : (
        <div className="space-y-4">
          {returned.map((o) => (
            <div key={o._id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand/40">
                <img src={o.items[0]?.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{o.items[0]?.name}</p>
                <p className="text-xs text-graphite/55">Order {o.id} · {o.date} · {formatINR(o.total)}</p>
              </div>
              <Badge tone={o.tone}>{o.status}</Badge>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Request a return">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-button text-sm font-medium text-ink">Select order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-xl border border-ink/12 bg-white px-3 py-3 text-sm outline-none focus:border-gold"
            >
              <option value="">Choose a delivered order…</option>
              {delivered.map((o) => (
                <option key={o._id} value={o._id}>{o.id} — {o.date}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-button text-sm font-medium text-ink">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-ink/12 bg-white px-3 py-3 text-sm outline-none focus:border-gold"
            >
              {reasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="gold" disabled={!orderId}>Submit request</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
