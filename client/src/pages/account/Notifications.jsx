import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../../components/ui/Icon'
import { EmptyState } from '../../components/ui/Controls'
import { LineSkeleton } from '../../components/ui/Skeleton'
import { useProfileStore } from '../../store/useProfileStore'

const timeAgo = (date) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const iconFor = (type) => (type === 'order' ? 'package' : type === 'promo' ? 'tag' : 'sparkle')

export default function Notifications() {
  const notifications = useProfileStore((s) => s.notifications)
  const loading = useProfileStore((s) => s.loadingNotifications)
  const fetchNotifications = useProfileStore((s) => s.fetchNotifications)
  const markAllRead = useProfileStore((s) => s.markAllRead)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Notifications {unread > 0 && <span className="text-graphite/40">({unread} new)</span>}
        </h2>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm font-medium text-gold-deep hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {loading && !notifications.length ? (
        <LineSkeleton lines={4} />
      ) : notifications.length === 0 ? (
        <EmptyState icon="bell" title="You're all caught up" message="New notifications will show up here." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => (
              <motion.div
                key={n._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className={`flex items-start gap-4 rounded-2xl p-4 shadow-soft transition-colors ${
                  n.read ? 'bg-white/55' : 'bg-white'
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    n.type === 'promo' ? 'bg-gold/10 text-gold-deep' : n.type === 'order' ? 'bg-forest/10 text-forest' : 'bg-sand text-graphite'
                  }`}
                >
                  <Icon name={iconFor(n.type)} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-button text-sm font-semibold text-ink">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-gold" />}
                  </div>
                  <p className="mt-0.5 text-sm text-graphite/70">{n.body}</p>
                  <p className="mt-1 text-xs text-graphite/45">{timeAgo(n.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
