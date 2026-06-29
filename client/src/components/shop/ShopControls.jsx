import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { SORTS, COLOR_OPTIONS, PRICE_BOUNDS } from '../../lib/constants'
import { formatINR } from '../../lib/format'
import { useFilterStore } from '../../store/useFilterStore'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useProductStore } from '../../store/useProductStore'

/* ----------------------------- SortMenu ------------------------------ */
export function SortMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const sort = useFilterStore((s) => s.filters.sort)
  const setFilter = useFilterStore((s) => s.set)
  const current = SORTS.find((s) => s.value === sort) || SORTS[0]

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold/50"
      >
        <Icon name="sliders" size={16} className="text-graphite/60" />
        <span className="hidden sm:inline">Sort:</span> {current.label}
        <Icon name="chevronDown" size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-card"
          >
            {SORTS.map((s) => (
              <li key={s.value}>
                <button
                  onClick={() => {
                    setFilter({ sort: s.value })
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    s.value === sort ? 'bg-sand/60 text-ink' : 'text-graphite hover:bg-cream'
                  }`}
                >
                  {s.label}
                  {s.value === sort && <Icon name="check" size={16} className="text-gold-deep" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------- ViewToggle ----------------------------- */
export function ViewToggle() {
  const viewMode = usePreferencesStore((s) => s.viewMode)
  const setViewMode = usePreferencesStore((s) => s.setViewMode)
  return (
    <div className="hidden items-center rounded-full border border-ink/12 bg-white p-1 sm:flex">
      {['grid', 'list'].map((m) => (
        <button
          key={m}
          aria-label={`${m} view`}
          aria-pressed={viewMode === m}
          onClick={() => setViewMode(m)}
          className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
            viewMode === m ? 'bg-ink text-cream' : 'text-graphite/60 hover:text-ink'
          }`}
        >
          <Icon name={m} size={17} />
        </button>
      ))}
    </div>
  )
}

/* ---------------------------- FilterChips ---------------------------- */
export function FilterChips() {
  const filters = useFilterStore((s) => s.filters)
  const setFilter = useFilterStore((s) => s.set)
  const toggleArray = useFilterStore((s) => s.toggleArray)
  const reset = useFilterStore((s) => s.reset)
  const categoryName = useProductStore((s) => s.categoryName)

  const chips = []
  if (filters.category)
    chips.push({ label: categoryName(filters.category), onClear: () => setFilter({ category: '' }) })
  if (filters.minPrice > PRICE_BOUNDS.min || filters.maxPrice < PRICE_BOUNDS.max)
    chips.push({
      label: `${formatINR(filters.minPrice)} – ${formatINR(filters.maxPrice)}`,
      onClear: () => setFilter({ minPrice: PRICE_BOUNDS.min, maxPrice: PRICE_BOUNDS.max }),
    })
  filters.colors.forEach((c) =>
    chips.push({
      label: c,
      swatch: COLOR_OPTIONS.find((o) => o.name === c)?.hex,
      onClear: () => toggleArray('colors', c),
    }),
  )
  filters.materials.forEach((m) =>
    chips.push({ label: m, onClear: () => toggleArray('materials', m) }),
  )
  if (filters.minRating)
    chips.push({ label: `${filters.minRating}★ & up`, onClear: () => setFilter({ minRating: 0 }) })
  if (filters.inStockOnly)
    chips.push({ label: 'In stock', onClear: () => setFilter({ inStockOnly: false }) })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence>
        {chips.map((chip) => (
          <motion.button
            key={chip.label}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={chip.onClear}
            className="group flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-graphite shadow-sm transition-colors hover:text-ink"
          >
            {chip.swatch && (
              <span className="h-3 w-3 rounded-full border border-ink/10" style={{ backgroundColor: chip.swatch }} />
            )}
            {chip.label}
            <Icon name="close" size={13} className="text-graphite/40 group-hover:text-ink" />
          </motion.button>
        ))}
      </AnimatePresence>
      <button onClick={reset} className="text-xs font-medium text-gold-deep hover:underline">
        Clear all
      </button>
    </div>
  )
}
