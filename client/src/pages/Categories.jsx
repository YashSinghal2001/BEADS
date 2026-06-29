import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Container,
  Reveal,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  Badge,
} from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { EmptyState } from '../components/ui/Controls'
import ProductCarousel from '../components/product/ProductCarousel'
import { useProductStore } from '../store/useProductStore'
import { STORE_CATEGORIES, categoryCardImage, categoryHeroImage } from '../lib/siteContent'
import { HERO_IMAGES } from '../lib/media'

const FILTERS = [
  { key: 'all', label: 'All categories' },
  { key: 'featured', label: 'Featured' },
  { key: 'beads', label: 'Beads' },
  { key: 'finishing', label: 'Charms & finishing' },
  { key: 'kits', label: 'Kits' },
]

const groupOf = (slug) => {
  if (slug === 'diy-kits') return 'kits'
  if (slug === 'charms' || slug === 'spacer-beads') return 'finishing'
  return 'beads'
}

export default function Categories() {
  const fetchCategories = useProductStore((s) => s.fetchCategories)
  const fetchProducts = useProductStore((s) => s.fetchProducts)
  const storeCategories = useProductStore((s) => s.categories)
  const [filter, setFilter] = useState('all')
  const [trending, setTrending] = useState([])

  useEffect(() => {
    fetchCategories().catch(() => {})
    fetchProducts({ limit: 10, sort: 'popular' })
      .then((res) => setTrending(res.products))
      .catch(() => {})
  }, [fetchCategories, fetchProducts])

  /* Overlay live product counts onto the static taxonomy when available. */
  const categories = useMemo(() => {
    const counts = new Map(storeCategories.map((c) => [c.slug, c.count]))
    return STORE_CATEGORIES.map((c) => ({
      ...c,
      count: counts.get(c.slug) || c.count,
    }))
  }, [storeCategories])

  const filtered = useMemo(() => {
    if (filter === 'all') return categories
    if (filter === 'featured') return categories.filter((c) => c.featured)
    return categories.filter((c) => groupOf(c.slug) === filter)
  }, [categories, filter])

  const featuredCollections = categories.filter((c) => c.featured).slice(0, 3)

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES.categories}
            alt="A vibrant assortment of premium beads"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-cream" />
        </div>
        <Container className="relative">
          <div className="max-w-2xl py-24 md:py-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="eyebrow text-gold-soft"
            >
              Shop by category
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 font-display text-4xl font-semibold leading-tight text-cream md:text-6xl"
            >
              Explore our collections
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 max-w-xl text-base leading-relaxed text-cream/80 md:text-lg"
            >
              Eight hand-curated categories of premium beads, charms and kits —
              everything you need to design jewelry you’ll be proud to wear and sell.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button to="/shop" variant="gold" size="lg">
                Shop all products
                <Icon name="arrowRight" size={18} />
              </Button>
              <Button to="/about" variant="light" size="lg">
                Our story
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Filter + category grid */}
      <section className="section pt-12 md:pt-16">
        <Container>
          <SectionHeading
            eyebrow="Find your perfect bead"
            title="Browse every category"
            subtitle="Filter the collection and tap any category to start shopping."
          />

          {/* Filter chips */}
          <div className="no-scrollbar mt-8 flex flex-wrap justify-center gap-2 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  filter === f.key ? 'text-cream' : 'text-graphite/70 hover:text-ink'
                }`}
              >
                {filter === f.key && (
                  <motion.span
                    layoutId="cat-filter"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="No categories here yet"
              message="Try a different filter to explore more of the collection."
              action={
                <Button variant="gold" onClick={() => setFilter('all')}>
                  Show all categories
                </Button>
              }
            />
          ) : (
            <StaggerGroup
              key={filter}
              className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((cat) => (
                <StaggerItem key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="group relative block overflow-hidden rounded-[2rem] shadow-soft lift"
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <motion.img
                        src={categoryCardImage(cat)}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
                    {cat.featured && (
                      <div className="absolute left-4 top-4">
                        <Badge tone="gold">Featured</Badge>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="font-button text-[11px] uppercase tracking-[0.2em] text-gold-soft">
                        {cat.tagline}
                      </p>
                      <h3 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold text-cream">
                        {cat.name}
                        <Icon
                          name="arrowRight"
                          size={20}
                          className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                        />
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream/75">
                        {cat.description}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cream/60">
                        <Icon name="package" size={14} />
                        {cat.count} products
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </Container>
      </section>

      {/* Featured collections banner */}
      {featuredCollections.length > 0 && (
        <section className="section pt-0">
          <Container>
            <SectionHeading
              align="left"
              eyebrow="Featured collections"
              title="Maker favourites"
              subtitle="The categories our community reaches for again and again."
              className="lg:mx-0"
            />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {featuredCollections.map((cat, i) => (
                <Reveal key={cat.slug} delay={i}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[2rem] p-7 shadow-soft lift"
                  >
                    <img
                      src={categoryHeroImage(cat)}
                      alt={cat.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
                    <div className="relative">
                      <h3 className="font-display text-2xl font-semibold text-cream">{cat.name}</h3>
                      <p className="mt-2 text-sm text-cream/75">{cat.tagline}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 font-button text-sm font-medium text-gold-soft">
                        Shop now
                        <Icon name="arrowRight" size={16} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Trending products */}
      {trending.length > 0 && (
        <section className="section pt-0">
          <Container>
            <ProductCarousel
              eyebrow="Trending now"
              title="Most-loved this season"
              products={trending}
              idBase="cat-trending"
            />
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="section pt-0">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-center shadow-card md:px-16">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
              <div className="relative mx-auto max-w-xl">
                <p className="eyebrow text-gold-soft">Not sure where to start?</p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-cream md:text-4xl">
                  Begin with a DIY kit
                </h2>
                <p className="mt-4 text-cream/70">
                  Everything you need in one beautiful box — beads, findings, tools and
                  a step-by-step guide.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button to="/category/diy-kits" variant="gold" size="lg">
                    Explore DIY kits
                    <Icon name="arrowRight" size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  )
}
