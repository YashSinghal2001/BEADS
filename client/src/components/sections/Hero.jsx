import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Button from '../ui/Button'
import { Icon } from '../ui/Icon'

const floaties = [
  { c: '#D4A373', size: 120, x: '8%', y: '18%', d: 0 },
  { c: '#EADBC8', size: 80, x: '82%', y: '12%', d: 1 },
  { c: '#F8D7DD', size: 64, x: '70%', y: '64%', d: 0.5 },
  { c: '#E4C8A8', size: 44, x: '14%', y: '70%', d: 1.4 },
]

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const yText = useTransform(scrollYProgress, [0, 1], [0, 120])
  const yImg = useTransform(scrollYProgress, [0, 1], [0, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative overflow-hidden pt-10 md:pt-16">
      {/* floating beads */}
      {floaties.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full blur-[1px]"
          style={{
            background: `radial-gradient(circle at 30% 30%, #ffffff, ${f.c})`,
            width: f.size,
            height: f.size,
            left: f.x,
            top: f.y,
            opacity: 0.55,
          }}
          animate={{ y: [0, -18, 0] }}
          transition={{
            duration: 6 + f.d * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: f.d,
          }}
        />
      ))}

      <div className="container-lux relative grid items-center gap-12 py-12 md:py-20 lg:grid-cols-2">
        {/* copy */}
        <motion.div style={{ y: yText, opacity }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 backdrop-blur"
          >
            <Icon name="sparkle" size={14} className="text-gold-deep" />
            <span className="font-button text-xs uppercase tracking-[0.2em] text-gold-deep">
              Handmade · Premium · Curated
            </span>
          </motion.div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl lg:text-6xl xl:text-7xl">
            <Reveal>Beads that turn</Reveal>
            <Reveal delay={0.12}>
              <span className="text-gold-gradient">ideas into heirlooms.</span>
            </Reveal>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-md text-base leading-relaxed text-graphite/75 sm:text-lg"
          >
            Acrylic, pearl, glass & flower beads, charms and DIY kits — curated
            for makers who refuse to compromise on quality.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Button to="/shop" variant="gold" size="lg">
              Shop the Collection
              <Icon name="arrowRight" size={18} />
            </Button>
            <Button to="/categories" variant="outline" size="lg">
              Browse Categories
            </Button>
          </motion.div>

          {/* stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-12 flex gap-8"
          >
            {[
              ['12k+', 'Happy makers'],
              ['800+', 'Bead varieties'],
              ['4.9★', 'Average rating'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-semibold text-ink">{n}</div>
                <div className="text-xs uppercase tracking-wider text-graphite/55">{l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* visual */}
        <motion.div style={{ y: yImg }} className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-card"
          >
            <img
              src="https://picsum.photos/seed/ysc-hero/900/1100"
              alt="Assorted premium beads"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
          </motion.div>

          {/* glass info card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl p-3 pr-5 sm:-left-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest/15 text-forest">
              <Icon name="truck" size={20} />
            </span>
            <div>
              <div className="font-button text-sm font-semibold text-ink">Free shipping</div>
              <div className="text-xs text-graphite/60">On orders over ₹999</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="glass absolute -right-2 top-8 flex items-center gap-2 rounded-2xl px-4 py-3 sm:-right-5"
          >
            <Icon name="shield" size={18} className="text-gold-deep" />
            <span className="font-button text-xs font-medium text-ink">
              Quality guaranteed
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function Reveal({ children, delay = 0 }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}
