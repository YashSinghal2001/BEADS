import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { formatINR } from '../../lib/format'

/* ---------------------------- RangeSlider ---------------------------- */
/**
 * Dual-thumb price range using two overlaid native range inputs.
 */
export function RangeSlider({ min, max, step = 50, value, onChange }) {
  const [lo, hi] = value
  const pct = (v) => ((v - min) / (max - min)) * 100

  const handleLo = (e) => {
    const v = Math.min(+e.target.value, hi - step)
    onChange([v, hi])
  }
  const handleHi = (e) => {
    const v = Math.max(+e.target.value, lo + step)
    onChange([lo, v])
  }

  return (
    <div className="px-1">
      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-sand" />
        <div
          className="absolute h-1.5 rounded-full bg-gold"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={handleLo}
          aria-label="Minimum price"
          className="range-thumb pointer-events-none absolute -top-2 h-5 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={handleHi}
          aria-label="Maximum price"
          className="range-thumb pointer-events-none absolute -top-2 h-5 w-full appearance-none bg-transparent"
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-medium text-graphite">
        <span className="rounded-lg bg-white px-2.5 py-1 shadow-sm">{formatINR(lo)}</span>
        <span className="text-graphite/40">—</span>
        <span className="rounded-lg bg-white px-2.5 py-1 shadow-sm">{formatINR(hi)}</span>
      </div>
    </div>
  )
}

/* ----------------------------- Accordion ----------------------------- */
export function Accordion({ title, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-ink/8 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="font-button text-sm font-semibold text-ink">
          {title}
          {count != null && count > 0 && (
            <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold-deep">
              {count}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <Icon name="chevronDown" size={18} className="text-graphite/60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
