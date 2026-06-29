import { useEffect, useState } from 'react'
import { Button, Badge, Modal, Table, PageHeader, Field, Select, Spinner, Icon } from '../components/ui.jsx'
import { api, apiError } from '../api.js'
import { formatDate, toast } from '../lib.js'
import { useAuth } from '../store/auth.js'

const blank = { code: '', type: 'percent', amount: 10, minimumPurchase: 0, usageLimit: '', expiryDate: '', active: true, description: '' }

export default function Coupons() {
  const can = useAuth((s) => s.can)
  const writable = can('coupon.write')
  const [rows, setRows] = useState([])
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([api.coupons(), api.couponAnalytics()])
      .then(([c, a]) => { setRows(c.coupons || []); setAnalytics(a.coupons || []) })
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const usageOf = (code) => analytics.find((a) => a.code === code)

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-button font-semibold text-ink">{r.code}</span> },
    { key: 'type', label: 'Discount', render: (r) => (r.type === 'percent' ? `${r.amount}%` : r.type === 'flat' ? `₹${r.amount}` : 'Free shipping') },
    { key: 'min', label: 'Min spend', render: (r) => `₹${r.minimumPurchase || 0}` },
    { key: 'used', label: 'Used', render: (r) => { const u = usageOf(r.code); return u?.limit ? `${u.used}/${u.limit} (${u.utilisation}%)` : (u?.used ?? r.usedCount) } },
    { key: 'expiry', label: 'Expires', render: (r) => (r.expiryDate ? formatDate(r.expiryDate) : '—') },
    { key: 'active', label: 'Status', render: (r) => <Badge tone={r.active ? 'forest' : 'sand'}>{r.active ? 'Active' : 'Off'}</Badge> },
    ...(writable ? [{ key: 'a', label: '', align: 'right', render: (r) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setEditor(r)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5"><Icon name="edit" size={15} /></button>
        <button onClick={async () => { try { await api.deleteCoupon(r._id); toast.success('Deleted'); load() } catch (e) { toast.error(apiError(e)) } }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5"><Icon name="trash" size={15} /></button>
      </div>
    ) }] : []),
  ]

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Campaigns & discounts" actions={writable && <Button variant="gold" size="sm" onClick={() => setEditor(blank)}><Icon name="plus" size={16} /> New coupon</Button>} />
      {loading ? <div className="grid h-60 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={columns} rows={rows} rowKey={(r) => r._id} empty="No coupons yet" />}
      {editor && <CouponEditor coupon={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load() }} />}
    </div>
  )
}

function CouponEditor({ coupon, onClose, onSaved }) {
  const isNew = !coupon._id
  const [form, setForm] = useState({ ...blank, ...coupon, expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : '' })
  const [saving, setSaving] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    if (!form.code) return toast.error('Code is required')
    const payload = {
      code: form.code, type: form.type, amount: Number(form.amount),
      minimumPurchase: Number(form.minimumPurchase) || 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      expiryDate: form.expiryDate || null, active: form.active, description: form.description,
    }
    setSaving(true)
    try {
      if (isNew) await api.createCoupon(payload)
      else await api.updateCoupon(coupon._id, payload)
      toast.success(isNew ? 'Coupon created' : 'Coupon updated')
      onSaved()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'New coupon' : 'Edit coupon'}>
      <div className="space-y-3">
        <Field label="Code" value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={form.type} onChange={(e) => set({ type: e.target.value })} options={[{ value: 'percent', label: 'Percentage' }, { value: 'flat', label: 'Flat ₹' }, { value: 'shipping', label: 'Free shipping' }]} />
          <Field label="Amount" type="number" value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min purchase ₹" type="number" value={form.minimumPurchase} onChange={(e) => set({ minimumPurchase: e.target.value })} />
          <Field label="Usage limit" type="number" value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} />
        </div>
        <Field label="Expiry date" type="date" value={form.expiryDate} onChange={(e) => set({ expiryDate: e.target.value })} />
        <Field label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-gold" checked={form.active} onChange={(e) => set({ active: e.target.checked })} /> Active</label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gold" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
