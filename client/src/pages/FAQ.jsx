import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Reveal, StaggerGroup, StaggerItem } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Seo from '../components/Seo'
import JsonLd from '../components/JsonLd'
import { FAQ_GROUPS } from '../lib/siteContent'

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GROUPS.flatMap((g) =>
    g.items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  ),
}

export default function FAQ() {
  const [active, setActive] = useState(FAQ_GROUPS[0].category)
  const [open, setOpen] = useState(null)

  const group = FAQ_GROUPS.find((g) => g.category === active)

  return (
    <div className="pb-20 pt-10">
      <Seo
        title="Frequently Asked Questions"
        description="Answers about shipping, returns, products, payment and wholesale orders at YS Creations."
      />
      <JsonLd data={FAQ_JSON_LD} />
      <Container>
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold-deep">
              <Icon name="info" size={26} />
            </span>
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow mt-6">We’re here to help</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
              Frequently asked questions
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-4 max-w-lg text-graphite/70">
              Everything about shipping, returns, products, payment and wholesale — in one
              place.
            </p>
          </Reveal>
        </div>

        {/* Category tabs */}
        <Reveal delay={2}>
          <div className="no-scrollbar mt-10 flex flex-wrap justify-center gap-2 overflow-x-auto">
            {FAQ_GROUPS.map((g) => (
              <button
                key={g.category}
                onClick={() => {
                  setActive(g.category)
                  setOpen(null)
                }}
                className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  active === g.category ? 'text-cream' : 'text-graphite/70 hover:text-ink'
                }`}
              >
                {active === g.category && (
                  <motion.span
                    layoutId="faq-tab"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon name={g.icon} size={15} />
                  {g.category}
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Accordion */}
        <div className="mx-auto mt-10 max-w-3xl">
          <AnimatePresence mode="wait">
            <StaggerGroup key={active} className="space-y-3">
              {group.items.map(([q, a], i) => {
                const isOpen = open === i
                return (
                  <StaggerItem key={q}>
                    <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
                      <button
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      >
                        <span className="font-display text-base font-semibold text-ink md:text-lg">
                          {q}
                        </span>
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/10 text-gold-deep transition-transform duration-300 ${
                            isOpen ? 'rotate-45' : ''
                          }`}
                        >
                          <Icon name="plus" size={16} />
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <p className="px-6 pb-5 text-sm leading-relaxed text-graphite/70">{a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </StaggerItem>
                )
              })}
            </StaggerGroup>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <Reveal>
          <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-4 rounded-[2rem] bg-ink px-6 py-10 text-center shadow-card md:px-12">
            <h2 className="font-display text-2xl font-semibold text-cream md:text-3xl">
              Still have a question?
            </h2>
            <p className="max-w-md text-sm text-cream/70">
              Our maker-led team replies within 24 hours — reach out and we’ll sort it out.
            </p>
            <Button to="/contact" variant="gold" size="lg" className="mt-2">
              Contact us
              <Icon name="arrowRight" size={18} />
            </Button>
          </div>
        </Reveal>
      </Container>
    </div>
  )
}
