import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Reveal, SectionHeading, StaggerGroup, StaggerItem } from '../ui/Primitives'
import Button from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import ProductCarousel from '../product/ProductCarousel'
import { formatINR } from '../../lib/format'
import { useProductStore } from '../../store/useProductStore'
import {
  TRUST_STATS,
  TRENDING_COLLECTIONS,
  DIY_BUNDLE,
  VIDEO_CARDS,
  bestSellerTabs,
  productsByGroup,
} from '../../lib/homeContent'

/* ------------------------------ Trust stats -------------------------- */
export function TrustStats() {
  return (
    <section className="py-14 md:py-16">
      <Container>
        <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {TRUST_STATS.map((s) => (
            <StaggerItem key={s.label}>
              <div className="flex flex-col items-center gap-2 rounded-3xl bg-white/60 p-6 text-center shadow-soft backdrop-blur lift">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold-deep">
                  <Icon name={s.icon} size={22} />
                </span>
                <div className="font-display text-2xl font-semibold text-ink md:text-3xl">
                  {s.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-graphite/55">{s.label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  )
}

/* -------------------------- Trending collections --------------------- */
export function TrendingCollections() {
  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="Collections"
          title="Shop our collections"
          subtitle="Curated edits for every occasion — from wedding-day pearls to maker-favourite best sellers."
        />
        <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRENDING_COLLECTIONS.map((c) => (
            <StaggerItem key={c.slug}>
              <div className="group relative flex h-72 flex-col justify-end overflow-hidden rounded-3xl shadow-soft lift md:h-80">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
                <div className="relative p-5">
                  <span
                    className="mb-2 inline-block h-1.5 w-10 rounded-full"
                    style={{ backgroundColor: c.accent }}
                  />
                  <h3 className="font-display text-xl font-semibold text-cream">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cream/70">{c.blurb}</p>
                  <div className="mt-4">
                    <Button to={c.to} variant="light" size="sm">
                      Explore
                      <Icon name="arrowRight" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  )
}

/* ------------------------------ Best sellers ------------------------- */
export function BestSellers() {
  const tabs = bestSellerTabs()
  const [active, setActive] = useState(tabs[0].key)
  const [products, setProducts] = useState([])
  const fetchAllProducts = useProductStore((s) => s.fetchAllProducts)

  useEffect(() => {
    let on = true
    fetchAllProducts()
      .then((list) => on && setProducts(list))
      .catch(() => {})
    return () => {
      on = false
    }
  }, [fetchAllProducts])

  const filtered = productsByGroup(active, products)

  return (
    <section className="section bg-gradient-to-b from-transparent via-sand/20 to-transparent">
      <Container>
        <SectionHeading
          eyebrow="Shop the Edit"
          title="Best sellers & fresh drops"
          subtitle="The pieces flying off our studio shelves — updated weekly."
        />

        <div className="mt-8 flex flex-wrap justify-center gap-2 rounded-full bg-white/60 p-1.5 backdrop-blur sm:mx-auto sm:w-fit">
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
                  layoutId="bestseller-tab-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCarousel products={filtered} idBase={`best-${active}`} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------ DIY bundle --------------------------- */
export function DIYBundle() {
  const b = DIY_BUNDLE
  const discount = b.compareAt ? Math.round(((b.compareAt - b.price) / b.compareAt) * 100) : 0
  return (
    <section className="section">
      <Container>
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-ink shadow-card lg:grid-cols-2">
            <div className="relative h-64 lg:h-full">
              <img
                src={b.image}
                alt="Create your own bracelet kit"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent lg:bg-gradient-to-r" />
            </div>

            <div className="p-8 md:p-12">
              <p className="eyebrow text-gold-soft">{b.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-cream md:text-4xl">
                {b.title}
              </h2>
              <p className="mt-4 max-w-md text-cream/70">{b.description}</p>

              <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2">
                {b.includes.map(([icon, label]) => (
                  <StaggerItem key={label}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-soft">
                        <Icon name={icon} size={17} />
                      </span>
                      <span className="text-sm text-cream/85">{label}</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold text-cream">
                    {formatINR(b.price)}
                  </span>
                  {b.compareAt && (
                    <span className="text-cream/40 line-through">{formatINR(b.compareAt)}</span>
                  )}
                  {discount > 0 && (
                    <span className="rounded-full bg-gold/20 px-2.5 py-1 font-button text-[11px] font-medium uppercase tracking-wider text-gold-soft">
                      Save {discount}%
                    </span>
                  )}
                </div>
                <Button to="/shop" variant="gold" size="lg">
                  {b.cta}
                  <Icon name="arrowRight" size={18} />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* ------------------------------ Video showcase ----------------------- */
export function VideoShowcase() {
  const [playing, setPlaying] = useState(null)

  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="In Motion"
          title="Watch our creators bring ideas to life"
          subtitle="Slow-motion pours, close-up craft and premium unboxings — a peek inside the YS Creations studio."
        />

        <StaggerGroup className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {VIDEO_CARDS.map((v) => (
            <StaggerItem key={v.title}>
              <button
                onClick={() => setPlaying(v)}
                className="group relative block aspect-[3/4] w-full overflow-hidden rounded-3xl text-left shadow-soft lift"
              >
                <img
                  src={v.poster}
                  alt={v.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-lux group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

                {/* play animation */}
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-cream/30"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <span className="relative grid h-14 w-14 place-items-center rounded-full bg-cream/90 text-ink transition-transform duration-300 group-hover:scale-110">
                    <Icon name="play" size={22} className="translate-x-0.5 [&_path]:fill-ink" />
                  </span>
                </span>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-base font-semibold text-cream">{v.title}</h3>
                  <p className="text-xs text-cream/70">{v.caption}</p>
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>

      <Modal open={!!playing} onClose={() => setPlaying(null)} title={playing?.title} size="lg">
        {playing && (
          <div className="overflow-hidden rounded-2xl bg-ink">
            <video
              src={playing.src}
              poster={playing.poster}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          </div>
        )}
      </Modal>
    </section>
  )
}
