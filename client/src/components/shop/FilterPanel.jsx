import { useEffect } from 'react'
import { Accordion, RangeSlider } from '../ui/RangeSlider'
import { Checkbox } from '../ui/Controls'
import { Icon } from '../ui/Icon'
import { useFilterStore } from '../../store/useFilterStore'
import { useProductStore } from '../../store/useProductStore'
import { MATERIALS, COLOR_OPTIONS, PRICE_BOUNDS } from '../../lib/constants'

export default function FilterPanel() {
  const filters = useFilterStore((s) => s.filters)
  const setFilter = useFilterStore((s) => s.set)
  const toggleArray = useFilterStore((s) => s.toggleArray)

  const categories = useProductStore((s) => s.categories)
  const fetchCategories = useProductStore((s) => s.fetchCategories)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const totalCount = categories.reduce((n, c) => n + (c.count || 0), 0)

  return (
    <div>
      {/* Category */}
      <Accordion title="Category" count={filters.category ? 1 : 0}>
        <div className="space-y-0.5">
          <Checkbox
            checked={!filters.category}
            onChange={() => setFilter({ category: '' })}
            label="All categories"
            count={totalCount || undefined}
          />
          {categories.map((c) => (
            <Checkbox
              key={c.id || c.slug}
              checked={filters.category === c.slug}
              onChange={() => setFilter({ category: filters.category === c.slug ? '' : c.slug })}
              label={c.name}
              count={c.count || undefined}
            />
          ))}
        </div>
      </Accordion>

      {/* Price */}
      <Accordion
        title="Price"
        count={filters.minPrice > PRICE_BOUNDS.min || filters.maxPrice < PRICE_BOUNDS.max ? 1 : 0}
      >
        <RangeSlider
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={50}
          value={[filters.minPrice, filters.maxPrice]}
          onChange={([lo, hi]) => setFilter({ minPrice: lo, maxPrice: hi })}
        />
      </Accordion>

      {/* Color */}
      <Accordion title="Colour" count={filters.colors.length}>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {COLOR_OPTIONS.map((c) => {
            const active = filters.colors.includes(c.name)
            return (
              <button
                key={c.name}
                onClick={() => toggleArray('colors', c.name)}
                title={c.name}
                aria-label={c.name}
                aria-pressed={active}
                className={`relative grid h-9 w-9 place-items-center rounded-full border-2 transition-all ${
                  active ? 'border-gold scale-105' : 'border-transparent hover:border-ink/15'
                }`}
              >
                <span
                  className="h-7 w-7 rounded-full border border-ink/10 shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
                {active && (
                  <Icon
                    name="check"
                    size={14}
                    strokeWidth={2.6}
                    className={c.name === 'Ink' || c.name === 'Forest' ? 'absolute text-white' : 'absolute text-ink'}
                  />
                )}
              </button>
            )
          })}
        </div>
      </Accordion>

      {/* Material */}
      <Accordion title="Material" count={filters.materials.length}>
        <div className="space-y-0.5">
          {MATERIALS.map((m) => (
            <Checkbox
              key={m}
              checked={filters.materials.includes(m)}
              onChange={() => toggleArray('materials', m)}
              label={m}
            />
          ))}
        </div>
      </Accordion>

      {/* Rating */}
      <Accordion title="Rating" count={filters.minRating ? 1 : 0}>
        <div className="space-y-0.5">
          {[4, 4.5, 4.8].map((r) => (
            <Checkbox
              key={r}
              checked={filters.minRating === r}
              onChange={() => setFilter({ minRating: filters.minRating === r ? 0 : r })}
              label={`${r} & up`}
            />
          ))}
        </div>
      </Accordion>

      {/* Availability */}
      <Accordion title="Availability" count={filters.inStockOnly ? 1 : 0}>
        <Checkbox
          checked={filters.inStockOnly}
          onChange={() => setFilter({ inStockOnly: !filters.inStockOnly })}
          label="In stock only"
        />
      </Accordion>
    </div>
  )
}
