import { useState } from 'react'
import { motion } from 'framer-motion'
import { Container, Reveal, SectionHeading, StaggerGroup, StaggerItem } from '../ui/Primitives'
import Button from '../ui/Button'
import { Icon } from '../ui/Icon'
import { testimonials } from '../../lib/constants'

/* ---------------------------- Brand Story ---------------------------- */
export function BrandStory() {
  return (
    <section id="story" className="section">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-card">
                <img
                  src="https://picsum.photos/seed/ysc-story/900/700"
                  alt="The YS Creations workshop"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="glass absolute -bottom-6 right-4 max-w-[200px] rounded-2xl p-4 sm:right-8">
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
              eyebrow="Our Story"
              title="Crafted by makers, for makers"
              className="lg:mx-0"
            />
            <Reveal delay={2}>
              <p className="mt-5 text-base leading-relaxed text-graphite/75">
                YS Creations began at a small craft table with a simple belief:
                beautiful jewelry starts with beautiful materials. Today we curate
                premium beads from trusted artisans worldwide — so every bracelet,
                necklace and earring you make feels effortlessly luxurious.
              </p>
            </Reveal>
            <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ['leaf', 'Ethically sourced', 'Responsible, traceable supply chains.'],
                ['sparkle', 'Premium quality', 'Hand-inspected for consistency.'],
                ['shield', 'Maker guarantee', 'Not happy? We make it right.'],
                ['truck', 'Fast dispatch', 'Most orders ship within 24 hours.'],
              ].map(([icon, t, d]) => (
                <StaggerItem key={t}>
                  <div className="flex gap-3 rounded-2xl bg-white/60 p-4 backdrop-blur">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold-deep">
                      <Icon name={icon} size={18} />
                    </span>
                    <div>
                      <h4 className="font-button text-sm font-semibold text-ink">{t}</h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-graphite/65">{d}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
            <div className="mt-8">
              <Button to="/about" variant="primary">
                Read our full story
                <Icon name="arrowRight" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ---------------------------- Testimonials --------------------------- */
export function Testimonials() {
  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="Loved by makers"
          title="Trusted by 12,000+ creators"
          subtitle="From Instagram sellers to weekend hobbyists — here's what the community says."
        />
        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.id}>
              <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-soft lift">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Icon key={i} name="star" size={16} className="fill-gold" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-graphite/80">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/5 pt-5">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-sand font-display text-base font-semibold text-gold-deep">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <div className="font-button text-sm font-semibold text-ink">{t.name}</div>
                    <div className="text-xs text-graphite/55">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  )
}

/* -------------------------- Instagram Feed --------------------------- */
export function InstagramFeed() {
  const seeds = ['ig1', 'ig2', 'ig3', 'ig4', 'ig5', 'ig6']
  return (
    <section className="section">
      <Container>
        <SectionHeading
          eyebrow="@yscreations"
          title="Tag us in your creations"
          subtitle="We love reposting our community. Use #MadeWithYS for a chance to be featured."
        />
        <StaggerGroup className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {seeds.map((s) => (
            <StaggerItem key={s}>
              <a
                href="#"
                className="group relative block aspect-square overflow-hidden rounded-2xl"
              >
                <img
                  src={`https://picsum.photos/seed/ysc-${s}/400/400`}
                  alt="Community creation"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 grid place-items-center bg-ink/0 text-cream opacity-0 transition-all duration-300 group-hover:bg-ink/40 group-hover:opacity-100">
                  <Icon name="instagram" size={24} />
                </div>
              </a>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  )
}

/* ---------------------------- Newsletter ----------------------------- */
export function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!email) return
    setDone(true)
    setEmail('')
    setTimeout(() => setDone(false), 4000)
  }

  return (
    <section className="section">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-center shadow-card md:px-16">
            {/* glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

            <div className="relative mx-auto max-w-xl">
              <p className="eyebrow text-gold-soft">Join the studio</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-cream md:text-4xl">
                Get 10% off your first order
              </h2>
              <p className="mt-4 text-cream/70">
                Early access to new drops, maker tutorials, and members-only
                offers. No spam — just sparkle.
              </p>

              <form
                onSubmit={submit}
                className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Icon
                    name="mail"
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream/50"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-full border border-cream/15 bg-cream/10 py-3.5 pl-11 pr-4 text-sm text-cream placeholder:text-cream/40 outline-none transition-colors focus:border-gold"
                  />
                </div>
                <Button type="submit" variant="gold" size="lg" className="shrink-0">
                  {done ? 'Subscribed ✓' : 'Subscribe'}
                </Button>
              </form>
              {done && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-gold-soft"
                >
                  Welcome to the studio! Check your inbox for your code.
                </motion.p>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
