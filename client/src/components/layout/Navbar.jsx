import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { useCartStore } from '../../store/useCartStore'
import { useWishlistStore } from '../../store/useWishlistStore'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const cartCount = useCartStore((s) => s.count())
  const wishCount = useWishlistStore((s) => s.items.length)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-cream">
        <div className="container-lux flex items-center justify-center gap-2 py-2 text-center text-[11px] font-button uppercase tracking-[0.22em]">
          <Icon name="sparkle" size={14} className="text-gold" />
          Free shipping on orders over ₹999 · Handmade with love
        </div>
      </div>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50"
      >
        <div
          className={`transition-all duration-500 ease-lux ${
            scrolled ? 'py-2' : 'py-3'
          }`}
        >
          <div className="container-lux">
            <div
              className={`flex items-center justify-between rounded-full px-4 transition-all duration-500 ease-lux md:px-6 ${
                scrolled
                  ? 'glass h-14 shadow-soft'
                  : 'h-16 bg-transparent'
              }`}
            >
              {/* Logo */}
              <Link to="/" className="group flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-white shadow-soft transition-transform duration-500 group-hover:rotate-12">
                  <span className="font-display text-lg font-semibold">Y</span>
                </span>
                <span className="font-display text-xl font-semibold tracking-tight text-ink">
                  YS <span className="text-gold-deep">Creations</span>
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-1 lg:flex">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                        isActive
                          ? 'text-gold-deep'
                          : 'text-graphite/80 hover:text-ink'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <IconButton label="Search">
                  <Icon name="search" size={19} />
                </IconButton>
                <IconButton label="Account" to="/account" className="hidden sm:grid">
                  <Icon name="user" size={19} />
                </IconButton>
                <IconButton label="Wishlist" to="/wishlist" className="hidden sm:grid" badge={wishCount || undefined}>
                  <Icon name="heart" size={19} />
                </IconButton>
                <IconButton label="Cart" to="/cart" badge={cartCount || undefined}>
                  <Icon name="cart" size={19} />
                </IconButton>
                <button
                  aria-label="Menu"
                  onClick={() => setOpen(true)}
                  className="ml-1 grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:hidden"
                >
                  <Icon name="menu" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute right-0 top-0 flex h-full w-[78%] max-w-sm flex-col bg-cream p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold">Menu</span>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5"
                >
                  <Icon name="close" />
                </button>
              </div>
              <div className="mt-8 flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                  >
                    <NavLink
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-2xl px-4 py-3 font-display text-2xl transition-colors ${
                          isActive ? 'text-gold-deep' : 'text-ink hover:bg-sand/50'
                        }`
                      }
                    >
                      {l.label}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function IconButton({ children, label, to, badge, className = '' }) {
  const cls = `relative grid h-10 w-10 place-items-center rounded-full text-ink transition-all duration-300 hover:bg-ink/5 ${className}`
  const inner = (
    <>
      {children}
      {badge ? (
        <motion.span
          key={badge}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-white"
        >
          {badge}
        </motion.span>
      ) : null}
    </>
  )
  if (to)
    return (
      <Link to={to} aria-label={label} className={cls}>
        {inner}
      </Link>
    )
  return (
    <button aria-label={label} className={cls}>
      {inner}
    </button>
  )
}
