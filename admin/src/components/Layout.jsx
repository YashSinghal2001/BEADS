import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './ui.jsx'
import { useAuth } from '../store/auth.js'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', perm: 'dashboard.view', end: true },
  { to: '/products', label: 'Products', icon: 'box', perm: 'product.read' },
  { to: '/orders', label: 'Orders', icon: 'cart', perm: 'order.read' },
  { to: '/customers', label: 'Customers', icon: 'users', perm: 'customer.read' },
  { to: '/coupons', label: 'Coupons', icon: 'tag', perm: 'coupon.read' },
  { to: '/content', label: 'Content', icon: 'content', perm: 'content.read' },
  { to: '/activity', label: 'Activity', icon: 'activity', perm: 'activity.view' },
]

export default function Layout() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const can = useAuth((s) => s.can)
  const logout = useAuth((s) => s.logout)
  const [open, setOpen] = useState(false)

  const items = NAV.filter((n) => can(n.perm))

  const doLogout = async () => {
    await logout()
    navigate('/login')
  }

  const Side = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-white font-display font-semibold">Y</span>
        <div>
          <p className="font-display text-lg font-semibold text-ink leading-none">YS Admin</p>
          <p className="text-[11px] text-graphite/50">Operations console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-ink text-cream' : 'text-graphite hover:bg-cream'
              }`
            }
          >
            <Icon name={n.icon} size={18} /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink/8 p-3">
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-graphite transition-colors hover:bg-cream hover:text-red-500">
          <Icon name="logout" size={18} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-ink/8 bg-panel lg:block">{Side}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="absolute left-0 top-0 h-full w-64 bg-panel shadow-card">
              {Side}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/8 bg-canvas/80 px-5 py-3 backdrop-blur">
          <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 lg:hidden">
            <Icon name="menu" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">{user?.name}</p>
              <p className="text-[11px] uppercase tracking-wide text-gold-deep">{user?.role?.replace('_', ' ')}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sand font-display font-semibold text-gold-deep">
              {(user?.name || 'A').charAt(0)}
            </span>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
