import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'

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

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`relative w-full ${sizes[size]} rounded-3xl bg-cream p-6 shadow-card`}
          >
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Fullscreen image lightbox with prev/next.
 */
export function Lightbox({ open, images = [], index = 0, onClose, onIndex }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, index, images.length, onClose, onIndex])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-cream hover:bg-white/20"
          >
            <Icon name="close" size={22} />
          </button>

          {images.length > 1 && (
            <>
              <NavBtn side="left" onClick={() => onIndex((index - 1 + images.length) % images.length)} />
              <NavBtn side="right" onClick={() => onIndex((index + 1) % images.length)} />
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.img
              key={index}
              src={images[index]}
              alt=""
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-card"
            />
          </AnimatePresence>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 font-button text-xs text-cream">
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NavBtn({ side, onClick }) {
  return (
    <button
      aria-label={side === 'left' ? 'Previous' : 'Next'}
      onClick={onClick}
      className={`absolute ${side === 'left' ? 'left-5' : 'right-5'} top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-cream hover:bg-white/20`}
    >
      <Icon name={side === 'left' ? 'chevronLeft' : 'chevronRight'} size={24} />
    </button>
  )
}
