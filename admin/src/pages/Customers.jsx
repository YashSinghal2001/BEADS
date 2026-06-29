import { useEffect, useState } from 'react'
import { Button, Card, Badge, Modal, Table, PageHeader, Field, Select, Spinner, Icon } from '../components/ui.jsx'
import { api, apiError } from '../api.js'
import { formatINR, formatDate, toast } from '../lib.js'
import { useAuth } from '../store/auth.js'

export default function Customers() {
  const can = useAuth((s) => s.can)
  const [rows, setRows] = useState([])
  const [seg, setSeg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)

  const load = () => {
    setLoading(true)
    api.customers({ q, limit: 50 }).then((r) => setRows(r.customers || [])).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  useEffect(() => {
    api.segments().then(setSeg).catch(() => {})
  }, [])

  const columns = [
    { key: 'name', label: 'Customer', render: (r) => (<div><p className="font-medium text-ink">{r.name}</p><p className="text-xs text-graphite/50">{r.email}</p></div>) },
    { key: 'role', label: 'Role', render: (r) => <Badge tone={r.role === 'user' ? 'sand' : 'ink'}>{r.role.replace('_', ' ')}</Badge> },
    { key: 'wholesale', label: 'Type', render: (r) => (r.isWholesale ? <Badge tone="gold">B2B {r.wholesaleTier}</Badge> : <span className="text-graphite/40">Retail</span>) },
    { key: 'orders', label: 'Orders', render: (r) => r.orderCount },
    { key: 'spend', label: 'Spend', align: 'right', render: (r) => formatINR(r.totalSpend) },
  ]

  return (
    <div>
      <PageHeader title="Customers" subtitle="CRM & segmentation" />

      {seg && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[['Total', seg.total], ['New (30d)', seg.newThisMonth], ['Repeat', seg.repeatCustomers], ['Wholesale', seg.wholesale], ['Blocked', seg.blocked]].map(([l, v]) => (
            <Card key={l} className="!p-4 text-center">
              <p className="font-display text-xl font-semibold text-ink">{v}</p>
              <p className="text-xs text-graphite/55">{l}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 relative max-w-xs">
        <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className="w-full rounded-full border border-ink/12 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gold" />
      </div>

      {loading ? <div className="grid h-60 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={columns} rows={rows} rowKey={(r) => r._id} onRowClick={(r) => setDetail(r._id)} empty="No customers" />}

      {detail && <CustomerDetail id={detail} canWrite={can('customer.write')} onClose={() => setDetail(null)} onChange={load} />}
    </div>
  )
}

function CustomerDetail({ id, canWrite, onClose, onChange }) {
  const [data, setData] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.customer(id).then(setData).catch((e) => toast.error(apiError(e)))
  useEffect(() => { load() }, [id])

  if (!data) {
    return <Modal open onClose={onClose} title="Customer" size="lg"><div className="grid h-40 place-items-center"><Spinner className="h-7 w-7" /></div></Modal>
  }
  const { customer: c, orders, stats } = data

  const update = async (patch, ok) => {
    setBusy(true)
    try {
      await api.updateCustomer(id, patch)
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
    <Modal open onClose={onClose} title={c.name} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[['Lifetime value', formatINR(stats.lifetimeValue)], ['Orders', stats.orderCount], ['Avg order', formatINR(stats.averageOrderValue)]].map(([l, v]) => (
            <Card key={l} className="!p-4 text-center">
              <p className="font-display text-lg font-semibold text-ink">{v}</p>
              <p className="text-xs text-graphite/55">{l}</p>
            </Card>
          ))}
        </div>

        <div className="text-sm text-graphite/70">
          {c.email} · {c.phone || 'no phone'} · joined {formatDate(c.createdAt)} · {c.loyaltyPoints} points
        </div>

        {canWrite && (
          <div className="grid gap-3 rounded-xl border border-ink/10 p-4 sm:grid-cols-3">
            <Select label="Role" value={c.role} onChange={(e) => update({ role: e.target.value }, 'Role updated')} options={['user', 'support', 'warehouse', 'manager', 'admin', 'super_admin'].map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
            <Select label="Wholesale tier" value={c.wholesaleTier} onChange={(e) => update({ isWholesale: e.target.value !== 'none', wholesaleTier: e.target.value }, 'Wholesale updated')} options={['none', 'silver', 'gold', 'platinum'].map((t) => ({ value: t, label: t }))} />
            <div className="flex items-end">
              <Button variant={c.isBlocked ? 'outline' : 'danger'} className="w-full" disabled={busy} onClick={() => update({ isBlocked: !c.isBlocked }, c.isBlocked ? 'Unblocked' : 'Blocked')}>
                {c.isBlocked ? 'Unblock' : 'Block'} customer
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="mb-2 font-button text-sm font-semibold text-ink">Internal notes</p>
          <div className="space-y-1.5">
            {(c.adminNotes || []).map((n) => (
              <div key={n._id} className="rounded-lg bg-cream/60 px-3 py-2 text-xs text-graphite/75">
                {n.note} <span className="text-graphite/40">— {n.by}, {formatDate(n.at)}</span>
              </div>
            ))}
          </div>
          {canWrite && (
            <div className="mt-2 flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="flex-1 rounded-lg border border-ink/12 px-3 py-2 text-sm outline-none focus:border-gold" />
              <Button size="sm" variant="primary" disabled={!note || busy} onClick={() => update({ addNote: note }, 'Note added').then(() => setNote(''))}>Add</Button>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div>
          <p className="mb-2 font-button text-sm font-semibold text-ink">Recent orders</p>
          {orders.length === 0 ? <p className="text-sm text-graphite/50">No orders</p> : (
            <div className="space-y-1.5">
              {orders.slice(0, 6).map((o) => (
                <div key={o._id} className="flex items-center justify-between rounded-lg bg-cream/60 px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{o.orderNumber}</span>
                  <Badge tone="gold">{o.orderStatus}</Badge>
                  <span className="font-medium text-ink">{formatINR(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
