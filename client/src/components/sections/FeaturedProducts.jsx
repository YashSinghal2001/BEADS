import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, SectionHeading } from '../ui/Primitives'
import Button from '../ui/Button'
import { Icon } from '../ui/Icon'
import { ProductCardSkeleton } from '../ui/Skeleton'
import ProductCard from '../product/ProductCard'
import { useProductStore } from '../../store/useProductStore'

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'Best Seller', label: 'Best Sellers' },
  { key: 'New', label: 'New Arrivals' },
  { key: 'Limited', label: 'Limited' },
]

export default function FeaturedProducts() {
  const [active, setActive] = useState('all')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchFeatured = useProductStore((s) => s.fetchFeatured)

  useEffect(() => {
    let on = true
    fetchFeatured()
      .then((list) => on && setProducts(list))
      .catch(() => {})
      .finally(() => on && setLoading(false))
    return () => {
      on = false
    }
  }, [fetchFeatured])

  const filtered = active === 'all' ? products : products.filter((p) => p.badge === active)

  return (
    <section className="section bg-gradient-to-b from-transparent via-sand/20 to-transparent">
      <Container>
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Curated Selection"
            title="Featured this season"
            subtitle="The pieces our makers can't stop reordering."
            className="lg:mx-0"
          />

          <div className="flex flex-wrap gap-2 rounded-full bg-white/60 p-1.5 backdrop-blur">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`relative rounded-full px-4 py-2 font-button text-xs font-medium transition-colors duration-300 ${
                  active === t.key ? 'text-cream' : 'text-graphite/70 hover:text-ink'
                }`}
              >
                {active === t.key && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div layout className="mt-12 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.slice(0, 8).map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-12 text-center">
          <Button to="/shop" variant="outline" size="lg">
            View all products
            <Icon name="arrowRight" size={18} />
          </Button>
        </div>
      </Container>
    </section>
  )
}
