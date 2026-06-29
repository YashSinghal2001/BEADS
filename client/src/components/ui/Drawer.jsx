import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'

/**
 * Slide-in drawer. side: 'right' | 'left'
 */
export default function Drawer({ open, onClose, title, side = 'right', children, footer, widthClass = 'w-[88%] max-w-md' }) {
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

  const x = side === 'right' ? '100%' : '-100%'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x }}
            animate={{ x: 0 }}
            exit={{ x }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} flex h-full ${widthClass} flex-col bg-cream shadow-card`}
          >
            <header className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
              <button
                aria-label="Close"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
              >
                <Icon name="close" size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="border-t border-ink/8 px-5 py-4">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
