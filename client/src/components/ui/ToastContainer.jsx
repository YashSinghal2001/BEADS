import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../store/useToastStore'
import { Icon } from './Icon'

const styles = {
  success: { icon: 'checkCircle', accent: 'text-forest', ring: 'border-forest/20' },
  error: { icon: 'alert', accent: 'text-red-500', ring: 'border-red-200' },
  info: { icon: 'info', accent: 'text-gold-deep', ring: 'border-gold/20' },
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:right-5 sm:top-24 sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = styles[t.type] || styles.info
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`glass pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border ${s.ring} px-4 py-3 shadow-card`}
            >
              <span className={`shrink-0 ${s.accent}`}>
                <Icon name={t.icon || s.icon} size={20} />
              </span>
              <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick?.()
                    dismiss(t.id)
                  }}
                  className="font-button text-xs font-semibold text-gold-deep hover:underline"
                >
                  {t.action.label}
                </button>
              )}
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="grid h-6 w-6 place-items-center rounded-full text-graphite/50 hover:bg-ink/5 hover:text-ink"
              >
                <Icon name="close" size={15} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
