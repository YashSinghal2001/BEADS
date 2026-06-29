import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Container, SectionHeading, StaggerGroup, StaggerItem } from '../ui/Primitives'
import { Icon } from '../ui/Icon'
import { Skeleton } from '../ui/Skeleton'
import { useProductStore } from '../../store/useProductStore'

const promises = [
  { icon: 'truck', label: 'Free shipping over ₹999' },
  { icon: 'shield', label: 'Secure payments' },
  { icon: 'leaf', label: 'Ethically sourced' },
  { icon: 'sparkle', label: 'Handmade quality' },
]

export function PromiseStrip() {
  return (
    <div className="border-y border-ink/5 bg-white/50 py-5 backdrop-blur">
      <Container>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {promises.map((p) => (
            <div key={p.label} className="flex items-center justify-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/10 text-gold-deep">
                <Icon name={p.icon} size={18} />
              </span>
              <span className="text-sm font-medium text-graphite">{p.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}

export function Categories() {
  const categories = useProductStore((s) => s.categories)
  const fetchCategories = useProductStore((s) => s.fetchCategories)
  const [loading, setLoading] = useState(!categories.length)

  useEffect(() => {
    let active = true
    fetchCategories()
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [fetchCategories])

  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="Shop by Category"
          title="Find your perfect bead"
          subtitle="From luminous glass to soft pastel acrylics — every category is hand-curated for quality and consistency."
        />

        {loading && !categories.length ? (
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-3xl" />
            ))}
          </div>
        ) : (
          <StaggerGroup className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {categories.map((cat) => (
              <StaggerItem key={cat.id || cat.slug}>
                <Link
                  to={`/category/${cat.slug}`}
                  className="group relative block aspect-square overflow-hidden rounded-3xl shadow-soft lift"
                >
                  <motion.img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                    {cat.tagline && (
                      <p className="font-button text-[10px] uppercase tracking-[0.2em] text-gold-soft">
                        {cat.tagline}
                      </p>
                    )}
                    <h3 className="mt-0.5 flex items-center gap-1.5 font-display text-lg font-semibold text-cream">
                      {cat.name}
                      <Icon
                        name="arrowRight"
                        size={16}
                        className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </h3>
                    {cat.count > 0 && <p className="text-xs text-cream/60">{cat.count} products</p>}
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </Container>
    </section>
  )
}
