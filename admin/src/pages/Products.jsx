import { useEffect, useState } from 'react'
import { Button, Card, Badge, Field, Select, Textarea, Modal, Table, PageHeader, Icon, Spinner } from '../components/ui.jsx'
import { api, apiError } from '../api.js'
import { formatINR, toast } from '../lib.js'
import { useAuth } from '../store/auth.js'

const blankProduct = {
  title: '', category: '', shortDescription: '', description: '',
  mrp: '', salePrice: '', stock: 0, lowStockThreshold: 5,
  featured: false, bestSeller: false, newArrival: false, trending: false, isActive: true,
  images: [], variants: [],
  customization: { enabled: false, beadColors: [], packaging: [], engraving: { enabled: false, maxChars: 20 } },
  seo: { metaTitle: '', metaDescription: '', metaKeywords: [] },
}

export default function Products() {
  const can = useAuth((s) => s.can)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState([])
  const [editor, setEditor] = useState(null) // product object or null
  const [importOpen, setImportOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null) // product pending delete confirmation
  const [deleting, setDeleting] = useState(false)
  const writable = can('product.write')

  const load = () => {
    setLoading(true)
    api.products({ q, limit: 50, sort: 'new' }).then((r) => setRows(r.products || [])).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const toggleSel = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const act = async (fn, ok) => {
    try {
      await fn()
      toast.success(ok)
      load()
    } catch (e) {
      toast.error(apiError(e))
    }
  }

  const bulk = (update) => act(() => api.bulkProducts(selected, update), 'Bulk update applied').then(() => setSelected([]))

  const confirmDelete = async () => {
    if (!confirmDel || deleting) return
    setDeleting(true)
    try {
      const res = await api.deleteProduct(confirmDel._id)
      toast.success(res?.message || 'Product deleted')
      setConfirmDel(null)
      load()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    ...(writable
      ? [{
          key: 'sel',
          label: '',
          render: (r) => (
            <input type="checkbox" className="accent-gold" checked={selected.includes(r._id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSel(r._id)} />
          ),
        }]
      : []),
    {
      key: 'title',
      label: 'Product',
      render: (r) => (
        <div className="flex items-center gap-3">
          <img src={r.images?.[0]?.url} alt="" className="h-10 w-10 rounded-lg object-cover bg-sand/40" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{r.title}</p>
            <p className="text-xs text-graphite/50">{r.category?.name || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'price', label: 'Price', render: (r) => formatINR(r.salePrice) },
    { key: 'stock', label: 'Stock', render: (r) => <Badge tone={r.stockStatus === 'out_of_stock' ? 'red' : r.stockStatus === 'low_stock' ? 'gold' : 'forest'}>{r.stock}</Badge> },
    { key: 'active', label: 'Status', render: (r) => <Badge tone={r.isActive ? 'forest' : 'sand'}>{r.isActive ? 'Active' : 'Draft'}</Badge> },
    ...(writable
      ? [{
          key: 'actions',
          label: '',
          align: 'right',
          render: (r) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <IconBtn name="edit" onClick={() => setEditor(r)} />
              <IconBtn name="copy" onClick={() => act(() => api.duplicateProduct(r._id), 'Duplicated')} />
              <IconBtn name="trash" onClick={() => setConfirmDel(r)} />
            </div>
          ),
        }]
      : []),
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${rows.length} shown`}
        actions={
          writable && (
            <>
              <Button variant="outline" size="sm" onClick={() => api.exportProducts().catch((e) => toast.error(apiError(e)))}>
                <Icon name="download" size={16} /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Icon name="upload" size={16} /> Import
              </Button>
              <Button variant="gold" size="sm" onClick={() => setEditor(blankProduct)}>
                <Icon name="plus" size={16} /> New product
              </Button>
            </>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-full border border-ink/12 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gold" />
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-graphite/60">{selected.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulk({ isActive: true })}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => bulk({ isActive: false })}>Deactivate</Button>
            <Button size="sm" variant="outline" onClick={() => bulk({ featured: true })}>Feature</Button>
          </div>
        )}
      </div>

      {loading ? <div className="grid h-60 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={columns} rows={rows} onRowClick={writable ? setEditor : undefined} empty="No products" />}

      {editor && <ProductEditor product={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load() }} />}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onDone={load} />

      {confirmDel && (
        <Modal open onClose={() => !deleting && setConfirmDel(null)} title="Delete product">
          <div className="space-y-4">
            <p className="text-sm text-graphite/75">
              Permanently delete <span className="font-semibold text-ink">{confirmDel.title}</span>?
              This also removes it from customer carts and wishlists. Products referenced by
              existing orders are archived instead of deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={deleting} onClick={() => setConfirmDel(null)}>Cancel</Button>
              <Button variant="danger" size="sm" disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting…' : 'Delete product'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function IconBtn({ name, onClick }) {
  return (
    <button onClick={onClick} className="grid h-8 w-8 place-items-center rounded-full text-graphite/60 hover:bg-ink/5 hover:text-ink">
      <Icon name={name} size={16} />
    </button>
  )
}

function ProductEditor({ product, onClose, onSaved }) {
  const isNew = !product._id
  const [cats, setCats] = useState(null) // null = not loaded yet
  const [catsError, setCatsError] = useState(false)
  const [form, setForm] = useState(() => ({
    ...blankProduct,
    ...product,
    category: product.category?._id || product.category || '',
    seo: { ...blankProduct.seo, ...(product.seo || {}) },
    customization: { ...blankProduct.customization, ...(product.customization || {}) },
  }))
  const [saving, setSaving] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const loadCats = () => {
    setCatsError(false)
    api
      .categories()
      .then((d) => setCats(d.categories || []))
      .catch((e) => {
        // surface the failure — a silent catch here makes the dropdown look
        // "empty" with no way to tell a fetch error from an empty collection
        setCatsError(true)
        toast.error(`Couldn't load categories: ${apiError(e)}`)
      })
  }
  useEffect(loadCats, [])

  const addImage = () => set({ images: [...form.images, { url: '' }] })
  const addVariant = () => set({ variants: [...form.variants, { color: '', size: '', sku: '', stock: 0 }] })

  const save = async () => {
    if (!form.title || !form.category || form.mrp === '' || form.salePrice === '') {
      return toast.error('Title, category, MRP and sale price are required')
    }
    const payload = {
      title: form.title,
      category: form.category,
      shortDescription: form.shortDescription,
      description: form.description,
      mrp: Number(form.mrp),
      salePrice: Number(form.salePrice),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      featured: form.featured, bestSeller: form.bestSeller, newArrival: form.newArrival, trending: form.trending,
      isActive: form.isActive,
      images: form.images.filter((i) => i.url),
      variants: form.variants,
      customization: form.customization,
      seo: form.seo,
    }
    setSaving(true)
    try {
      if (isNew) await api.createProduct(payload)
      else await api.updateProduct(product._id, payload)
      toast.success(isNew ? 'Product created' : 'Product updated')
      onSaved()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'New product' : 'Edit product'} size="xl">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <div>
            <Select label="Category" value={form.category} onChange={(e) => set({ category: e.target.value })} options={[{ value: '', label: 'Select…' }, ...(cats || []).map((c) => ({ value: c.id || c._id, label: c.name }))]} />
            {catsError ? (
              <button onClick={loadCats} className="mt-1 text-xs font-medium text-red-500 hover:underline">
                Categories failed to load — retry
              </button>
            ) : cats && cats.length === 0 ? (
              <p className="mt-1 text-xs text-graphite/55">No categories exist yet — create a category first.</p>
            ) : null}
          </div>
        </div>
        <Field label="Short description" value={form.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })} />

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="MRP" type="number" value={form.mrp} onChange={(e) => set({ mrp: e.target.value })} />
          <Field label="Sale price" type="number" value={form.salePrice} onChange={(e) => set({ salePrice: e.target.value })} />
          <Field label="Stock" type="number" value={form.stock} onChange={(e) => set({ stock: e.target.value })} />
          <Field label="Low stock at" type="number" value={form.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: e.target.value })} />
        </div>

        <div className="flex flex-wrap gap-4">
          {['featured', 'bestSeller', 'newArrival', 'trending', 'isActive'].map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" className="accent-gold" checked={form[k]} onChange={(e) => set({ [k]: e.target.checked })} />
              {k}
            </label>
          ))}
        </div>

        {/* Images */}
        <Section title="Images" onAdd={addImage}>
          {form.images.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input value={img.url} onChange={(e) => { const next = [...form.images]; next[i] = { url: e.target.value }; set({ images: next }) }} placeholder="https://image-url" className="flex-1 rounded-lg border border-ink/12 px-3 py-2 text-sm outline-none focus:border-gold" />
              <IconBtn name="trash" onClick={() => set({ images: form.images.filter((_, x) => x !== i) })} />
            </div>
          ))}
        </Section>

        {/* Variants */}
        <Section title="Variant builder" onAdd={addVariant}>
          {form.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px_36px] gap-2">
              {['color', 'size', 'sku'].map((k) => (
                <input key={k} value={v[k] || ''} placeholder={k} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, [k]: e.target.value }; set({ variants: next }) }} className="rounded-lg border border-ink/12 px-2 py-2 text-sm outline-none focus:border-gold" />
              ))}
              <input type="number" value={v.stock || 0} placeholder="stock" onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, stock: Number(e.target.value) }; set({ variants: next }) }} className="rounded-lg border border-ink/12 px-2 py-2 text-sm outline-none focus:border-gold" />
              <IconBtn name="trash" onClick={() => set({ variants: form.variants.filter((_, x) => x !== i) })} />
            </div>
          ))}
        </Section>

        {/* Personalization */}
        <div className="rounded-xl border border-ink/10 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" className="accent-gold" checked={form.customization.enabled} onChange={(e) => set({ customization: { ...form.customization, enabled: e.target.checked } })} />
            Enable personalization
          </label>
          {form.customization.enabled && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Bead colours (comma-separated)" value={(form.customization.beadColors || []).join(', ')} onChange={(e) => set({ customization: { ...form.customization, beadColors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })} />
              <Field label="Packaging options (comma-separated)" value={(form.customization.packaging || []).join(', ')} onChange={(e) => set({ customization: { ...form.customization, packaging: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })} />
              <label className="flex items-center gap-2 text-sm text-graphite">
                <input type="checkbox" className="accent-gold" checked={form.customization.engraving.enabled} onChange={(e) => set({ customization: { ...form.customization, engraving: { ...form.customization.engraving, enabled: e.target.checked } } })} />
                Engraving · max
                <input type="number" value={form.customization.engraving.maxChars} onChange={(e) => set({ customization: { ...form.customization, engraving: { ...form.customization.engraving, maxChars: Number(e.target.value) } } })} className="w-16 rounded-lg border border-ink/12 px-2 py-1 text-sm" /> chars
              </label>
            </div>
          )}
        </div>

        {/* SEO */}
        <Section title="SEO">
          <Field label="Meta title" value={form.seo.metaTitle} onChange={(e) => set({ seo: { ...form.seo, metaTitle: e.target.value } })} />
          <Field label="Meta description" value={form.seo.metaDescription} onChange={(e) => set({ seo: { ...form.seo, metaDescription: e.target.value } })} />
        </Section>

        <div className="flex justify-end gap-2 border-t border-ink/8 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gold" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function Section({ title, onAdd, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-button text-sm font-semibold text-ink">{title}</p>
        {onAdd && <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-gold-deep hover:underline"><Icon name="plus" size={14} /> Add</button>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ImportModal({ open, onClose, onDone }) {
  const [csv, setCsv] = useState('Title,Category,MRP,SalePrice,Stock,Active\n')
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      const res = await api.importProducts(csv)
      toast.success(`Imported: ${res.created} created, ${res.updated} updated`)
      onDone()
      onClose()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Import products (CSV)" size="lg">
      <p className="mb-2 text-sm text-graphite/60">Columns: Title, Category, MRP, SalePrice, Stock, Active. Existing SKUs are updated.</p>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} className="w-full rounded-xl border border-ink/12 bg-white p-3 font-mono text-xs outline-none focus:border-gold" />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="gold" onClick={run} disabled={busy}>{busy ? 'Importing…' : 'Import'}</Button>
      </div>
    </Modal>
  )
}
