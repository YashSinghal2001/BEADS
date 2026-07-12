import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Container, Reveal, SectionHeading, StaggerGroup, StaggerItem } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Seo from '../components/Seo'
import { useProductStore } from '../store/useProductStore'
import { COLLECTIONS } from '../lib/homeContent'
import { STORE_CATEGORIES } from '../lib/siteContent'
import { HERO_IMAGES } from '../lib/media'

const staticCount = (slug) => STORE_CATEGORIES.find((c) => c.slug === slug)?.count

export default function Collections() {
  const fetchAllProducts = useProductStore((s) => s.fetchAllProducts)
  const [products, setProducts] = useState([])

  useEffect(() => {
    let on = true
    fetchAllProducts()
      .then((list) => on && setProducts(list))
      .catch(() => {})
    return () => {
      on = false
    }
  }, [fetchAllProducts])

  const collectionsWithProducts = COLLECTIONS.map((c) => {
    const items =
      c.type === 'category'
        ? products.filter((p) => p.categorySlug === c.filter || p.category === c.filter)
        : products.filter((p) => p.badge === c.filter)
    const count = c.type === 'category' ? staticCount(c.filter) : items.length
    return { ...c, items: items.slice(0, 4), count }
  })

  return (
    <div className="pb-8">
      <Seo
        title="Collections"
        description="Six curated collections — Wedding, Pastel, DIY Kits, Best Sellers, New Arrivals and Limited Edition — from YS Creations."
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES.collections}
            alt="A curated edit of premium beads and jewelry-making supplies"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/50 to-cream" />
        </div>
        <Container className="relative">
          <div className="max-w-2xl py-24 md:py-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="eyebrow text-gold-soft"
            >
              Curated edits
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 font-display text-4xl font-semibold leading-tight text-cream md:text-6xl"
            >
              Our Collections
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 max-w-xl text-base leading-relaxed text-cream/80 md:text-lg"
            >
              Six themed edits — from bridal pearls to limited small-batch drops — each
              hand-picked to make choosing effortless.
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
              <Button to="/categories" variant="light" size="lg">
                Browse categories
              </Button>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Collection grid — quick overview */}
      <section className="section pt-12 md:pt-16">
        <Container>
          <SectionHeading
            eyebrow="Shop by story"
            title="Six ways to shop"
            subtitle="Every collection is refreshed as new products drop — tap any card to explore the full edit."
          />
          <StaggerGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collectionsWithProducts.map((c) => (
              <StaggerItem key={c.slug}>
                <Link
                  to={c.to}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[2rem] shadow-soft lift"
                >
                  <motion.img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="font-button text-[11px] uppercase tracking-[0.2em] text-gold-soft">
                      {c.tagline}
                    </p>
                    <h3 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold text-cream">
                      {c.title}
                      <Icon
                        name="arrowRight"
                        size={20}
                        className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </h3>
                    {c.count > 0 && (
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cream/60">
                        <Icon name="package" size={14} />
                        {c.count} products
                      </p>
                    )}
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* Detailed alternating sections per collection */}
      {collectionsWithProducts.map((c, i) => (
        <section key={c.slug} className="section pt-0">
          <Container>
            <Reveal>
              <div
                className={`grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-ink shadow-card lg:grid-cols-2 ${
                  i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="group relative h-64 overflow-hidden lg:h-full">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent lg:bg-gradient-to-r" />
                </div>

                <div className="p-8 md:p-12">
                  <p className="eyebrow text-gold-soft">{c.tagline}</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold text-cream md:text-4xl">
                    {c.title}
                  </h2>
                  <p className="mt-4 max-w-md text-cream/70">{c.description}</p>
                  {c.count > 0 && (
                    <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-cream/50">
                      <Icon name="package" size={14} />
                      {c.count} {c.type === 'category' ? 'products' : 'featured picks'}
                    </p>
                  )}

                  {c.items.length > 0 && (
                    <div className="mt-6 flex -space-x-3">
                      {c.items.map((p) => (
                        <Link
                          key={p.id}
                          to={`/product/${p.slug}`}
                          className="group/thumb relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-ink shadow-soft transition-transform duration-300 hover:z-10 hover:scale-110"
                          title={p.name}
                        >
                          <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-8">
                    <Button to={c.to} variant="gold" size="lg">
                      Shop the collection
                      <Icon name="arrowRight" size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      ))}

      {/* CTA */}
      <section className="section pt-0">
        <Container>
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-white/70 px-6 py-14 text-center shadow-soft backdrop-blur md:px-16">
              <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                Can’t decide on a collection?
              </h2>
              <p className="max-w-lg text-graphite/70">
                Browse the full catalogue and filter by colour, material and price to build
                your own edit.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button to="/shop" variant="gold" size="lg">
                  Shop all products
                  <Icon name="arrowRight" size={18} />
                </Button>
                <Button to="/contact" variant="outline" size="lg">
                  Ask us for a recommendation
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  )
}
