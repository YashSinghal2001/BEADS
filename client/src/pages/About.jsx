import { motion } from 'framer-motion'
import {
  Container,
  Reveal,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
} from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Testimonials } from '../components/sections/Story'
import {
  ABOUT_VALUES,
  ABOUT_TIMELINE,
  ABOUT_STATS,
} from '../lib/siteContent'
import { HERO_IMAGES, ABOUT_GALLERY } from '../lib/media'

export default function About() {
  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES.about}
            alt="Hands crafting handmade beaded jewelry"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/55 to-cream" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-3xl py-24 text-center md:py-36">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="eyebrow text-gold-soft"
            >
              Our story
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 font-display text-4xl font-semibold leading-tight text-cream md:text-6xl"
            >
              Crafted by makers, for makers
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/80 md:text-lg"
            >
              From a single craft table to a community of 12,000+ creators —
              YS Creations exists to make beautiful, premium materials accessible
              to every maker.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Brand story */}
      <section id="story" className="section">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] shadow-card">
                  <img
                    src={HERO_IMAGES.story}
                    alt="The YS Creations workshop"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="glass absolute -bottom-6 right-4 max-w-[210px] rounded-2xl p-4 sm:right-8">
                  <p className="font-display text-3xl font-semibold text-gold-deep">100%</p>
                  <p className="text-xs text-graphite/70">
                    Hand-inspected before it reaches you
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="order-1 lg:order-2">
              <SectionHeading
                align="left"
                eyebrow="How it started"
                title="A craft table, a big dream"
                className="lg:mx-0"
              />
              <div className="mt-5 space-y-4 text-base leading-relaxed text-graphite/75">
                <p>
                  YS Creations began as a small handmade craft business — a single
                  table, a tray of beads, and a belief that beautiful jewelry starts
                  with beautiful materials. What started as bracelets for friends
                  quickly grew into something bigger.
                </p>
                <p>
                  As demand grew, so did our obsession with{' '}
                  <span className="font-medium text-ink">quality</span>. We began
                  sourcing premium beads from trusted artisans around the world,
                  hand-inspecting every batch for colour, size and finish.
                </p>
                <p>
                  Today, we curate{' '}
                  <span className="font-medium text-ink">premium materials</span> and
                  celebrate{' '}
                  <span className="font-medium text-ink">handmade craftsmanship</span> —
                  so every bracelet, necklace and earring you create feels
                  effortlessly luxurious.
                </p>
              </div>
              <div className="mt-8">
                <Button to="/shop" variant="primary">
                  Shop the collection
                  <Icon name="arrowRight" size={18} />
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="section pt-0">
        <Container>
          <SectionHeading
            eyebrow="What we stand for"
            title="Our values"
            subtitle="The principles that guide every bead we source and every order we ship."
          />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_VALUES.map(([icon, title, desc]) => (
              <StaggerItem key={title}>
                <div className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-soft lift">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold-deep">
                    <Icon name={icon} size={22} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-graphite/70">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* Timeline */}
      <section className="section pt-0">
        <Container>
          <SectionHeading
            eyebrow="Our journey"
            title="Five years in the making"
            subtitle="From the first bracelet to a thriving community of makers."
          />
          <div className="relative mx-auto mt-14 max-w-3xl">
            {/* vertical line */}
            <div className="absolute left-[19px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-gold via-gold/40 to-transparent md:left-1/2" />
            <div className="space-y-10">
              {ABOUT_TIMELINE.map(([year, title, desc], i) => (
                <Reveal key={year} delay={i % 2}>
                  <div
                    className={`relative flex items-start gap-6 md:gap-0 ${
                      i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* dot */}
                    <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-white shadow-soft md:absolute md:left-1/2 md:-translate-x-1/2">
                      <Icon name="sparkle" size={18} />
                    </span>
                    <div
                      className={`flex-1 rounded-3xl bg-white p-6 shadow-soft md:max-w-[44%] ${
                        i % 2 === 0 ? 'md:mr-auto md:text-right' : 'md:ml-auto'
                      }`}
                    >
                      <p className="font-button text-xs uppercase tracking-[0.2em] text-gold-deep">
                        {year}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-semibold text-ink">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-graphite/70">{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Statistics */}
      <section className="section pt-0">
        <Container>
          <Reveal>
            <div className="grid grid-cols-2 gap-4 rounded-[2.5rem] bg-ink px-6 py-12 md:grid-cols-4 md:gap-8 md:px-12">
              {ABOUT_STATS.map(([value, label], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                >
                  <p className="font-display text-4xl font-semibold text-gold-soft md:text-5xl">
                    {value}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cream/60 md:text-sm">
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Testimonials (reuse home section) */}
      <Testimonials />

      {/* Gallery */}
      <section className="section pt-0">
        <Container>
          <SectionHeading
            eyebrow="From the studio"
            title="Made with YS"
            subtitle="A glimpse into our workshop and the creations of our community."
          />
          <StaggerGroup className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
            {ABOUT_GALLERY.map((src, i) => (
              <StaggerItem key={i}>
                <div
                  className={`group relative overflow-hidden rounded-2xl ${
                    i === 0 ? 'col-span-2 row-span-2 sm:col-span-1 sm:row-span-1' : ''
                  }`}
                >
                  <img
                    src={src}
                    alt="YS Creations gallery"
                    loading="lazy"
                    className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/15" />
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* CTA */}
      <section className="section pt-0">
        <Container>
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-white/70 px-6 py-14 text-center shadow-soft backdrop-blur md:px-16">
              <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
                Ready to create something beautiful?
              </h2>
              <p className="max-w-lg text-graphite/70">
                Join thousands of makers crafting with premium, hand-inspected beads
                from YS Creations.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button to="/shop" variant="gold" size="lg">
                  Start shopping
                  <Icon name="arrowRight" size={18} />
                </Button>
                <Button to="/contact" variant="outline" size="lg">
                  Get in touch
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  )
}
