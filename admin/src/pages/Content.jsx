import { useEffect, useState } from 'react'
import { Button, Badge, Modal, Table, PageHeader, Field, Textarea, Select, Spinner, Icon } from '../components/ui.jsx'
import { api, apiError } from '../api.js'
import { formatDate, toast } from '../lib.js'

const TABS = [
  { key: 'banners', label: 'Banners' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'blog', label: 'Blog' },
]

/* field configs per content resource */
const CONFIG = {
  banners: {
    blank: { title: '', subtitle: '', image: { url: '' }, link: '', cta: 'Shop now', placement: 'promo', order: 0, active: true },
    fields: (f, set) => (
      <>
        <Field label="Title" value={f.title} onChange={(e) => set({ title: e.target.value })} />
        <Field label="Subtitle" value={f.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        <Field label="Image URL" value={f.image?.url} onChange={(e) => set({ image: { url: e.target.value } })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Link" value={f.link} onChange={(e) => set({ link: e.target.value })} />
          <Field label="CTA" value={f.cta} onChange={(e) => set({ cta: e.target.value })} />
        </div>
        <Select label="Placement" value={f.placement} onChange={(e) => set({ placement: e.target.value })} options={['hero', 'promo', 'collection']} />
      </>
    ),
    cols: (open, del) => [
      { key: 'title', label: 'Title', render: (r) => r.title },
      { key: 'placement', label: 'Placement', render: (r) => <Badge tone="gold">{r.placement}</Badge> },
      { key: 'active', label: 'Active', render: (r) => <Badge tone={r.active ? 'forest' : 'sand'}>{r.active ? 'Yes' : 'No'}</Badge> },
      actionsCol(open, del),
    ],
  },
  testimonials: {
    blank: { name: '', role: '', quote: '', rating: 5, order: 0, active: true },
    fields: (f, set) => (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
          <Field label="Role" value={f.role} onChange={(e) => set({ role: e.target.value })} />
        </div>
        <Textarea label="Quote" value={f.quote} onChange={(e) => set({ quote: e.target.value })} />
        <Field label="Rating (1-5)" type="number" value={f.rating} onChange={(e) => set({ rating: Number(e.target.value) })} />
      </>
    ),
    cols: (open, del) => [
      { key: 'name', label: 'Name', render: (r) => r.name },
      { key: 'rating', label: 'Rating', render: (r) => `${r.rating}★` },
      { key: 'quote', label: 'Quote', render: (r) => <span className="line-clamp-1 text-graphite/60">{r.quote}</span> },
      actionsCol(open, del),
    ],
  },
  faqs: {
    blank: { question: '', answer: '', category: 'General', order: 0, active: true },
    fields: (f, set) => (
      <>
        <Field label="Question" value={f.question} onChange={(e) => set({ question: e.target.value })} />
        <Textarea label="Answer" value={f.answer} onChange={(e) => set({ answer: e.target.value })} />
        <Field label="Category" value={f.category} onChange={(e) => set({ category: e.target.value })} />
      </>
    ),
    cols: (open, del) => [
      { key: 'question', label: 'Question', render: (r) => r.question },
      { key: 'category', label: 'Category', render: (r) => <Badge tone="sand">{r.category}</Badge> },
      actionsCol(open, del),
    ],
  },
}

function actionsCol(open, del) {
  return {
    key: 'actions',
    label: '',
    align: 'right',
    render: (r) => (
      <div className="flex justify-end gap-1">
        <button onClick={() => open(r)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5"><Icon name="edit" size={15} /></button>
        <button onClick={() => del(r)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5"><Icon name="trash" size={15} /></button>
      </div>
    ),
  }
}

export default function Content() {
  const [tab, setTab] = useState('banners')
  return (
    <div>
      <PageHeader title="Content" subtitle="Banners, testimonials, FAQs & blog" />
      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'bg-ink text-cream' : 'bg-panel text-graphite hover:bg-cream'}`}>{t.label}</button>
        ))}
      </div>
      {tab === 'blog' ? <BlogSection /> : <CrudSection resource={tab} />}
    </div>
  )
}

function CrudSection({ resource }) {
  const cfg = CONFIG[resource]
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)

  const load = () => {
    setLoading(true)
    api.content(resource).then((d) => setRows(d[resource] || [])).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }
  useEffect(load, [resource])

  const del = async (r) => {
    try {
      await api.deleteContent(resource, r._id)
      toast.success('Deleted')
      load()
    } catch (e) {
      toast.error(apiError(e))
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="gold" size="sm" onClick={() => setEditor(cfg.blank)}><Icon name="plus" size={16} /> Add</Button>
      </div>
      {loading ? <div className="grid h-40 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={cfg.cols(setEditor, del)} rows={rows} rowKey={(r) => r._id} empty={`No ${resource} yet`} />}
      {editor && (
        <ContentEditor resource={resource} cfg={cfg} item={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); load() }} />
      )}
    </div>
  )
}

function ContentEditor({ resource, cfg, item, onClose, onSaved }) {
  const isNew = !item._id
  const [form, setForm] = useState({ ...cfg.blank, ...item })
  const [saving, setSaving] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const save = async () => {
    setSaving(true)
    try {
      if (isNew) await api.createContent(resource, form)
      else await api.updateContent(resource, item._id, form)
      toast.success('Saved')
      onSaved()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={`${isNew ? 'Add' : 'Edit'} ${resource.slice(0, -1)}`}>
      <div className="space-y-3">
        {cfg.fields(form, set)}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order" type="number" value={form.order} onChange={(e) => set({ order: Number(e.target.value) })} />
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" className="accent-gold" checked={form.active} onChange={(e) => set({ active: e.target.checked })} /> Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gold" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function BlogSection() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)
  const blank = { title: '', excerpt: '', content: '', category: 'General', published: true }

  const load = () => {
    setLoading(true)
    api.blogs().then((d) => setRows(d.blogs || [])).catch((e) => toast.error(apiError(e))).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const columns = [
    { key: 'title', label: 'Title', render: (r) => r.title },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="sand">{r.category}</Badge> },
    { key: 'published', label: 'Status', render: (r) => <Badge tone={r.published ? 'forest' : 'sand'}>{r.published ? 'Published' : 'Draft'}</Badge> },
    { key: 'date', label: 'Created', render: (r) => formatDate(r.createdAt) },
  ]

  const save = async (form, setSaving) => {
    setSaving(true)
    try {
      await api.createBlog(form)
      toast.success('Blog created')
      setEditor(null)
      load()
    } catch (e) {
      toast.error(apiError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button variant="gold" size="sm" onClick={() => setEditor(blank)}><Icon name="plus" size={16} /> New post</Button>
      </div>
      {loading ? <div className="grid h-40 place-items-center"><Spinner className="h-7 w-7" /></div> : <Table columns={columns} rows={rows} rowKey={(r) => r._id} empty="No blog posts yet" />}
      {editor && <BlogEditor item={editor} onClose={() => setEditor(null)} onSave={save} />}
    </div>
  )
}

function BlogEditor({ item, onClose, onSave }) {
  const [form, setForm] = useState(item)
  const [saving, setSaving] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  return (
    <Modal open onClose={onClose} title="New blog post" size="lg">
      <div className="space-y-3">
        <Field label="Title" value={form.title} onChange={(e) => set({ title: e.target.value })} />
        <Field label="Excerpt" value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
        <Textarea label="Content" rows={6} value={form.content} onChange={(e) => set({ content: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" value={form.category} onChange={(e) => set({ category: e.target.value })} />
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" className="accent-gold" checked={form.published} onChange={(e) => set({ published: e.target.checked })} /> Published</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gold" onClick={() => onSave(form, setSaving)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
