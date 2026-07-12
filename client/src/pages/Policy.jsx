import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Container, Reveal } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Seo from '../components/Seo'
import { POLICIES, POLICY_LIST } from '../lib/siteContent'

export default function Policy({ policyKey }) {
  const policy = POLICIES[policyKey]
  if (!policy) return null

  return (
    <div className="pb-20 pt-10">
      <Seo title={policy.title} description={policy.intro} />
      <Container>
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">{policy.eyebrow}</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
              {policy.title}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-4 max-w-xl text-graphite/70">{policy.intro}</p>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-graphite/45">
              {policy.updated}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar nav */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 font-button text-xs uppercase tracking-[0.2em] text-graphite/55">
              Policies
            </p>
            <nav className="space-y-1">
              {POLICY_LIST.map(([key, label, to]) => (
                <Link
                  key={key}
                  to={to}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    key === policyKey
                      ? 'bg-ink text-cream'
                      : 'text-graphite/75 hover:bg-white hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 rounded-2xl bg-white/70 p-5 shadow-soft backdrop-blur">
              <p className="text-sm font-medium text-ink">Still need help?</p>
              <p className="mt-1 text-xs leading-relaxed text-graphite/65">
                Our team is happy to answer any questions.
              </p>
              <Button to="/contact" variant="outline" size="sm" className="mt-3 w-full">
                Contact us
              </Button>
            </div>
          </aside>

          {/* Content */}
          <div className="rounded-[2rem] bg-white p-7 shadow-soft md:p-10">
            <div className="space-y-9">
              {policy.sections.map(([heading, body], i) => (
                <motion.section
                  key={heading}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/10 text-xs font-semibold text-gold-deep">
                      {i + 1}
                    </span>
                    {heading}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-graphite/75">{body}</p>
                </motion.section>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-2 border-t border-ink/8 pt-6 text-sm text-graphite/60">
              <Icon name="mail" size={16} className="text-gold-deep" />
              Questions about this policy? Email us at{' '}
              <a href="mailto:hello@yscreations.in" className="font-medium text-ink hover:text-gold-deep">
                hello@yscreations.in
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
