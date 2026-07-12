import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container } from '../components/ui/Primitives'
import Seo from '../components/Seo'
import { Icon } from '../components/ui/Icon'
import Drawer from '../components/ui/Drawer'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/Controls'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import ProductCard from '../components/product/ProductCard'
import FilterPanel from '../components/shop/FilterPanel'
import { FilterChips, SortMenu, ViewToggle } from '../components/shop/ShopControls'
import {
  useFilterStore,
  filtersToParams,
  paramsToFilters,
  defaultFilters,
} from '../store/useFilterStore'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { useProductStore } from '../store/useProductStore'
import { PRICE_BOUNDS } from '../lib/constants'
import { productApi } from '../api/product.api'

/** Build the API query object from the UI filter state. */
function toApiParams(f, pageSize) {
  const params = { page: f.page, limit: pageSize, sort: f.sort }
  if (f.search) params.q = f.search
  if (f.category) params.category = f.category
  if (f.materials.length) params.material = f.materials[0]
  if (f.minPrice > PRICE_BOUNDS.min) params.minPrice = f.minPrice
  if (f.maxPrice < PRICE_BOUNDS.max) params.maxPrice = f.maxPrice
  if (f.minRating) params.minRating = f.minRating
  if (f.inStockOnly) params.inStock = 'true'
  return params
}

export default function Shop() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useFilterStore((s) => s.filters)
  const hydrate = useFilterStore((s) => s.hydrate)
  const setFilter = useFilterStore((s) => s.set)
  const setPage = useFilterStore((s) => s.setPage)
  const reset = useFilterStore((s) => s.reset)
  const activeCount = useFilterStore((s) => s.activeCount())
  const viewMode = usePreferencesStore((s) => s.viewMode)
  const pageSize = usePreferencesStore((s) => s.pageSize)
  const fetchCategories = useProductStore((s) => s.fetchCategories)
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  const categoryName = useProductStore((s) => s.categoryName)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 })
  const [searchInput, setSearchInput] = useState(filters.search)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggest, setShowSuggest] = useState(false)

  /* URL → store on mount (and resolve /category/:slug) */
  useEffect(() => {
    const parsed = paramsToFilters(searchParams)
    if (slug) parsed.category = slug
    hydrate(parsed)
    setSearchInput(parsed.search || '')
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  /* store → URL */
  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true })
  }, [filters, setSearchParams])

  /* Fetch products whenever filters change */
  const apiParams = useMemo(() => toApiParams(filters, pageSize), [filters, pageSize])
  useEffect(() => {
    let active = true
    setLoading(true)
    fetchProducts(apiParams)
      .then((res) => {
        if (!active) return
        setProducts(res.products)
        setMeta(res.meta)
      })
      .catch(() => active && setProducts([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [apiParams, fetchProducts])

  /* Debounced search input → filter.search */
  const debounceRef = useRef()
  const onSearchChange = (value) => {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setFilter({ search: value }), 400)
    if (value.trim().length >= 2) {
      productApi.autocomplete(value).then((r) => {
        setSuggestions(r)
        setShowSuggest(true)
      })
    } else {
      setShowSuggest(false)
    }
  }

  const pageCount = meta.pages || 1
  const page = Math.min(filters.page, pageCount)

  const seoTitle = slug ? categoryName(slug) : filters.search ? `Search: “${filters.search}”` : 'Shop All Products'

  return (
    <div className="pb-20 pt-8">
      <Seo
        title={seoTitle}
        description="Shop premium, hand-inspected beads, charms and DIY kits — filter by colour, material, price and more."
      />
      <Container>
        <div className="mb-8">
          <p className="eyebrow mb-2">The Collection</p>
          <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">Shop all beads</h1>
          <p className="mt-2 max-w-xl text-graphite/70">
            Premium, hand-inspected beads & supplies — filter by colour, material, price and more.
          </p>
        </div>

        {/* Search + autocomplete */}
        <div className="relative mb-5 max-w-xl">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/45"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="Search beads, charms, kits…"
            className="w-full rounded-full border border-ink/12 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-gold"
          />
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-white p-1.5 shadow-card"
              >
                {suggestions.map((s) => (
                  <li key={s.slug}>
                    <button
                      onMouseDown={() => {
                        setSearchInput(s.title)
                        setFilter({ search: s.title })
                        setShowSuggest(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream"
                    >
                      {s.image && <img src={s.image} alt="" className="h-9 w-9 rounded-lg object-cover" />}
                      <span className="flex-1 truncate text-ink">{s.title}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-8">
          {/* Sticky sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 rounded-3xl bg-white/70 p-5 shadow-soft backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Filters</h2>
                {activeCount > 0 && (
                  <button onClick={reset} className="text-xs font-medium text-gold-deep hover:underline">
                    Reset
                  </button>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 text-sm font-medium text-ink lg:hidden"
                >
                  <Icon name="filter" size={16} />
                  Filters
                  {activeCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] text-white">
                      {activeCount}
                    </span>
                  )}
                </button>
                <p className="text-sm text-graphite/70">
                  {loading ? 'Loading…' : `${meta.total} ${meta.total === 1 ? 'product' : 'products'}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ViewToggle />
                <SortMenu />
              </div>
            </div>

            <div className="mb-5">
              <FilterChips />
            </div>

            {loading ? (
              <ProductGridSkeleton count={pageSize} />
            ) : products.length === 0 ? (
              <EmptyState
                icon="search"
                title="No products match your filters"
                message="Try removing a filter or adjusting your price range."
                action={
                  <Button variant="gold" onClick={reset}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <motion.div
                  layout
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3'
                      : 'flex flex-col gap-4'
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {products.map((p, i) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ProductCard product={p} view={viewMode} index={i} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                <div className="mt-12">
                  <Pagination
                    page={page}
                    pageCount={pageCount}
                    onChange={(p) => {
                      setPage(p)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </Container>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        side="left"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={reset}>
              Reset
            </Button>
            <Button variant="gold" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Show {meta.total}
            </Button>
          </div>
        }
      >
        <FilterPanel />
      </Drawer>
    </div>
  )
}

export { defaultFilters }
