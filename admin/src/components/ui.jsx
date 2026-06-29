import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useToast } from '../lib.js'

/* ------------------------------ Icons -------------------------------- */
const P = {
  dashboard: <path d="M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10" />,
  box: (
    <>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2 12.5a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.2L20 6H5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3 21a6 6 0 0 1 12 0M16 5.5a3.4 3.4 0 0 1 0 6.5M21 21a6 6 0 0 0-4-5.6" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  content: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 14h8" />
    </>
  ),
  activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3M14 6l3 3" />,
  trash: <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7M10 11v6M14 11v6" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  check: <path d="m5 12 5 5 9-11" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />,
  upload: <path d="M12 21V9m0 0 4 4m-4-4-4 4M5 3h14" />,
  refresh: <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  truck: (
    <>
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </>
  ),
  rupee: <path d="M6 4h12M6 8h12M9 4c4 0 6 2 6 5s-2 5-6 5l6 6M6 14h3" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13a7 7 0 0 0 .1-2l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5L4.9 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5z" />
    </>
  ),
}

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {P[name] || null}
    </svg>
  )
}

/* ------------------------------ Button ------------------------------- */
const variants = {
  primary: 'bg-ink text-cream hover:bg-graphite',
  gold: 'bg-gold text-white hover:bg-gold-deep',
  outline: 'border border-ink/15 text-ink bg-white hover:border-gold/50',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'border border-red-200 text-red-500 hover:bg-red-500 hover:text-white',
}
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-sm px-6 py-3' }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-button font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------ Card --------------------------------- */
export function Card({ className = '', children }) {
  return <div className={`rounded-2xl bg-panel p-5 shadow-soft ${className}`}>{children}</div>
}

export function StatCard({ icon, label, value, sub, tone = 'gold' }) {
  const tones = { gold: 'bg-gold/10 text-gold-deep', forest: 'bg-forest/10 text-forest', ink: 'bg-ink/5 text-ink' }
  return (
    <Card>
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} size={20} />
      </span>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-graphite/60">{label}</p>
      {sub && <p className="mt-1 text-xs text-graphite/45">{sub}</p>}
    </Card>
  )
}

/* ------------------------------ Badge -------------------------------- */
const tones = {
  gold: 'bg-gold/15 text-gold-deep',
  forest: 'bg-forest/15 text-forest',
  sand: 'bg-sand text-graphite',
  ink: 'bg-ink text-cream',
  red: 'bg-red-100 text-red-600',
}
export function Badge({ tone = 'sand', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${tones[tone] || tones.sand}`}>{children}</span>
}

/* ----------------------------- Inputs -------------------------------- */
export function Field({ label, error, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block font-button text-xs font-medium text-ink">{label}</span>}
      <input
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-colors ${error ? 'border-red-300' : 'border-ink/12 focus:border-gold'}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  )
}
export function Textarea({ label, rows = 3, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block font-button text-xs font-medium text-ink">{label}</span>}
      <textarea rows={rows} className="w-full rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold" {...props} />
    </label>
  )
}
export function Select({ label, options = [], className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block font-button text-xs font-medium text-ink">{label}</span>}
      <select className="w-full rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold" {...props}>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </label>
  )
}

/* ----------------------------- Misc ---------------------------------- */
export function Spinner({ className = '' }) {
  return <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-sand border-t-gold ${className}`} />
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-graphite/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, message, icon = 'box' }) {
  return (
    <div className="grid place-items-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sand/60 text-gold-deep">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 text-sm text-graphite/60">{message}</p>}
    </div>
  )
}

export function Table({ columns, rows, rowKey = (r) => r._id, onRowClick, empty = 'No records' }) {
  if (!rows?.length) return <EmptyState title={empty} icon="box" />
  return (
    <div className="overflow-x-auto rounded-2xl bg-panel shadow-soft">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-ink/8 text-xs uppercase tracking-wide text-graphite/50">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-ink/5 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-cream/60' : ''}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 16, opacity: 0 }}
            className={`relative max-h-[88vh] w-full ${sizes[size]} overflow-y-auto rounded-2xl bg-canvas p-6 shadow-card`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5">
                <Icon name="close" size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ToastHost() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)
  const icon = { success: 'checkCircle', error: 'alert', info: 'info' }
  const tone = { success: 'text-forest', error: 'text-red-500', info: 'text-gold-deep' }
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="flex items-center gap-3 rounded-xl bg-panel px-4 py-3 shadow-card"
          >
            <span className={tone[t.type]}><Icon name={icon[t.type]} size={18} /></span>
            <span className="text-sm font-medium text-ink">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-graphite/40 hover:text-ink"><Icon name="close" size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
