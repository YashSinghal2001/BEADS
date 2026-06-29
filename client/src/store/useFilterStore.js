import { create } from 'zustand'
import { PRICE_BOUNDS } from '../lib/constants.js'

export const defaultFilters = {
  search: '',
  category: '',
  minPrice: PRICE_BOUNDS.min,
  maxPrice: PRICE_BOUNDS.max,
  colors: [],
  materials: [],
  inStockOnly: false,
  minRating: 0,
  sort: 'featured',
  page: 1,
}

export const useFilterStore = create((set, get) => ({
  filters: { ...defaultFilters },

  set: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch, ...(patch.page ? {} : { page: 1 }) } })),

  setPage: (page) => set((s) => ({ filters: { ...s.filters, page } })),

  toggleArray: (field, value) =>
    set((s) => {
      const arr = s.filters[field]
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
      return { filters: { ...s.filters, [field]: next, page: 1 } }
    }),

  reset: () => set({ filters: { ...defaultFilters } }),

  hydrate: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  /* count of active (non-default) filters for the chip/badge UI */
  activeCount: () => {
    const f = get().filters
    let n = 0
    if (f.category) n++
    if (f.minPrice > PRICE_BOUNDS.min || f.maxPrice < PRICE_BOUNDS.max) n++
    n += f.colors.length
    n += f.materials.length
    if (f.inStockOnly) n++
    if (f.minRating) n++
    return n
  },
}))

/* ---- URL (de)serialization ---- */
export function filtersToParams(f) {
  const p = new URLSearchParams()
  if (f.search) p.set('q', f.search)
  if (f.category) p.set('category', f.category)
  if (f.minPrice > PRICE_BOUNDS.min) p.set('min', f.minPrice)
  if (f.maxPrice < PRICE_BOUNDS.max) p.set('max', f.maxPrice)
  if (f.colors.length) p.set('colors', f.colors.join(','))
  if (f.materials.length) p.set('materials', f.materials.join(','))
  if (f.inStockOnly) p.set('stock', '1')
  if (f.minRating) p.set('rating', f.minRating)
  if (f.sort && f.sort !== 'featured') p.set('sort', f.sort)
  if (f.page > 1) p.set('page', f.page)
  return p
}

export function paramsToFilters(params) {
  const num = (v, d) => (v != null && !Number.isNaN(+v) ? +v : d)
  return {
    search: params.get('q') || '',
    category: params.get('category') || '',
    minPrice: num(params.get('min'), PRICE_BOUNDS.min),
    maxPrice: num(params.get('max'), PRICE_BOUNDS.max),
    colors: params.get('colors') ? params.get('colors').split(',') : [],
    materials: params.get('materials') ? params.get('materials').split(',') : [],
    inStockOnly: params.get('stock') === '1',
    minRating: num(params.get('rating'), 0),
    sort: params.get('sort') || 'featured',
    page: num(params.get('page'), 1),
  }
}
