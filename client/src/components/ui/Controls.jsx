import { useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from './Icon'

/* ------------------------------ Rating ------------------------------- */
export function Rating({ value = 0, size = 16, className = '' }) {
  const full = Math.floor(value)
  const frac = value - full
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = i < full ? 1 : i === full ? frac : 0
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Icon name="star" size={size} className="absolute inset-0 text-sand" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Icon name="star" size={size} className="text-gold [&_path]:fill-gold" />
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function RatingInput({ value, onChange, size = 26 }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star`}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Icon
            name="star"
            size={size}
            className={(hover || value) >= star ? 'text-gold [&_path]:fill-gold' : 'text-sand'}
          />
        </button>
      ))}
    </div>
  )
}

/* -------------------------- QuantityStepper -------------------------- */
export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const dims = size === 'sm' ? 'h-9' : 'h-11'
  const btn = size === 'sm' ? 'w-9' : 'w-11'
  return (
    <div className={`inline-flex items-center rounded-full border border-ink/15 bg-white ${dims}`}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`grid ${btn} h-full place-items-center rounded-l-full text-ink transition-colors hover:bg-sand/50 disabled:opacity-30`}
      >
        <Icon name="minus" size={16} />
      </button>
      <span className="min-w-8 text-center font-button text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`grid ${btn} h-full place-items-center rounded-r-full text-ink transition-colors hover:bg-sand/50 disabled:opacity-30`}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

/* ------------------------------ Checkbox ----------------------------- */
export function Checkbox({ checked, onChange, label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 group">
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all duration-200 ${
          checked ? 'border-gold bg-gold text-white' : 'border-ink/25 bg-white group-hover:border-gold/60'
        }`}
      >
        {checked && <Icon name="check" size={13} strokeWidth={2.5} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex-1 text-sm text-graphite group-hover:text-ink">{label}</span>
      {count != null && <span className="text-xs text-graphite/45">{count}</span>}
    </label>
  )
}

/* ----------------------------- EmptyState ---------------------------- */
export function EmptyState({ icon = 'empty', title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-md py-16 text-center"
    >
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sand/60 text-gold-deep">
        <Icon name={icon} size={30} />
      </span>
      <h3 className="mt-6 font-display text-2xl font-semibold text-ink">{title}</h3>
      {message && <p className="mt-2 text-graphite/70">{message}</p>}
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </motion.div>
  )
}
