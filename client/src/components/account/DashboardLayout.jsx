import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Container } from '../ui/Primitives'
import { Icon } from '../ui/Icon'
import { useAuthStore } from '../../store/useAuthStore'
import { useWishlistStore } from '../../store/useWishlistStore'
import { toast } from '../../store/useToastStore'

const nav = [
  { to: '/account', label: 'Overview', icon: 'home', end: true },
  { to: '/account/orders', label: 'Orders', icon: 'package' },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'heart' },
  { to: '/account/addresses', label: 'Addresses', icon: 'mapPin' },
  { to: '/account/returns', label: 'Returns', icon: 'refresh' },
  { to: '/account/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/account/profile', label: 'Profile', icon: 'user' },
  { to: '/account/settings', label: 'Settings', icon: 'settings' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
    const location = useLocation()
  const user = useAuthStore((s) => s.user) || {}
  const doLogout = useAuthStore((s) => s.logout)
  const wishCount = useWishlistStore((s) => s.items.length)

  const logout = async () => {
    await doLogout()
    toast.info('You have been signed out')
    navigate('/login')
  }

  return (
    <div className="pb-20 pt-8">
      <Container>
        <div className="mb-8">
          <p className="eyebrow mb-2">My Account</p>
          <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Hello, {(user.name || 'there').split(' ')[0]}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3 border-b border-ink/8 p-2 pb-4">
                {user.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-sand font-display text-lg font-semibold text-gold-deep">
                    {(user.name || 'Y').charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-button text-sm font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-graphite/55">{user.email}</p>
                </div>
              </div>

              <nav className="no-scrollbar mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? 'bg-ink text-cream' : 'text-graphite hover:bg-cream'
                      }`
                    }
                  >
                    <Icon name={item.icon} size={18} />
                    {item.label}
                    {item.to === '/account/wishlist' && wishCount > 0 && (
                      <span className="ml-auto rounded-full bg-gold/20 px-1.5 text-[11px] text-gold-deep">
                        {wishCount}
                      </span>
                    )}
                  </NavLink>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-graphite transition-colors hover:bg-cream hover:text-red-500 lg:mt-2 lg:border-t lg:border-ink/8 lg:pt-3"
                >
                  <Icon name="logout" size={18} />
                  Sign out
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="min-w-0"
          >
            <Outlet />
          </motion.div>
        </div>
      </Container>
    </div>
  )
}
