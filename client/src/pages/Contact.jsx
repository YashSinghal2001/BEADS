import { useState } from 'react'
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
import { BUSINESS_INFO, CONTACT_SUBJECTS, FAQ_GROUPS } from '../lib/siteContent'
import { HERO_IMAGES } from '../lib/media'
import { toast } from '../store/useToastStore'

const CHANNELS = [
  { icon: 'mail', label: 'Email us', value: BUSINESS_INFO.email, href: `mailto:${BUSINESS_INFO.email}` },
  { icon: 'phone', label: 'Call us', value: BUSINESS_INFO.phone, href: `tel:${BUSINESS_INFO.phone.replace(/\s/g, '')}` },
  { icon: 'checkCircle', label: 'WhatsApp', value: BUSINESS_INFO.whatsapp, href: BUSINESS_INFO.whatsappLink },
  { icon: 'instagram', label: 'Instagram', value: BUSINESS_INFO.instagram, href: BUSINESS_INFO.instagramLink },
]

const empty = { name: '', email: '', phone: '', subject: CONTACT_SUBJECTS[0], message: '' }

export default function Contact() {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number'
    if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters'
    return e
  }

  const submit = (e) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }
    // No backend endpoint — acknowledge optimistically.
    setSent(true)
    setForm(empty)
    toast.success("Message sent! We'll get back to you within 24 hours.", { icon: 'checkCircle' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGES.contact}
            alt="Beads and crafting supplies on a workshop table"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/55 to-cream" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-2xl py-24 text-center md:py-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="eyebrow text-gold-soft"
            >
              We’d love to hear from you
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 font-display text-4xl font-semibold leading-tight text-cream md:text-6xl"
            >
              Get in touch
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-cream/80 md:text-lg"
            >
              Questions about an order, wholesale, or just want to say hello? Our
              maker-led team replies within 24 hours.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Form + info */}
      <section className="section pt-12 md:pt-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            {/* Form */}
            <Reveal>
              <form
                onSubmit={submit}
                noValidate
                className="rounded-[2rem] bg-white p-6 shadow-card md:p-9"
              >
                <h2 className="font-display text-2xl font-semibold text-ink">Send us a message</h2>
                <p className="mt-1 text-sm text-graphite/65">
                  Fill in the form and we’ll be in touch shortly.
                </p>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field label="Name" error={errors.name}>
                    <input
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Your name"
                      className={inputCls(errors.name)}
                    />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="you@email.com"
                      className={inputCls(errors.email)}
                    />
                  </Field>
                  <Field label="Phone (optional)" error={errors.phone}>
                    <input
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+91 ..."
                      className={inputCls(errors.phone)}
                    />
                  </Field>
                  <Field label="Subject" error={errors.subject}>
                    <select value={form.subject} onChange={set('subject')} className={inputCls()}>
                      {CONTACT_SUBJECTS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-5">
                  <Field label="Message" error={errors.message}>
                    <textarea
                      value={form.message}
                      onChange={set('message')}
                      rows={5}
                      placeholder="How can we help?"
                      className={`${inputCls(errors.message)} resize-none`}
                    />
                  </Field>
                </div>

                <Button type="submit" variant="gold" size="lg" className="mt-6 w-full sm:w-auto">
                  {sent ? 'Message sent ✓' : 'Send message'}
                  {!sent && <Icon name="arrowRight" size={18} />}
                </Button>
              </form>
            </Reveal>

            {/* Business info */}
            <div className="space-y-6">
              <Reveal>
                <div className="rounded-[2rem] bg-ink p-7 text-cream shadow-card">
                  <h3 className="font-display text-xl font-semibold text-cream">Contact details</h3>
                  <p className="mt-1 text-sm text-cream/60">{BUSINESS_INFO.hours}</p>
                  <div className="mt-6 space-y-2">
                    {CHANNELS.map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-cream/5"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cream/10 text-gold-soft transition-colors group-hover:bg-gold group-hover:text-white">
                          <Icon name={c.icon} size={19} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs uppercase tracking-[0.16em] text-cream/45">
                            {c.label}
                          </span>
                          <span className="block truncate text-sm font-medium text-cream">
                            {c.value}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={1}>
                <div className="flex items-start gap-4 rounded-[2rem] bg-white p-6 shadow-soft">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold-deep">
                    <Icon name="mapPin" size={20} />
                  </span>
                  <div>
                    <h3 className="font-button text-sm font-semibold uppercase tracking-wider text-ink">
                      Visit the studio
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-graphite/70">
                      {BUSINESS_INFO.address}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Map */}
      <section className="section pt-0">
        <Container>
          <Reveal>
            <div className="overflow-hidden rounded-[2rem] shadow-card">
              <iframe
                title="YS Creations studio location"
                src={BUSINESS_INFO.mapEmbed}
                width="100%"
                height="420"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Mini FAQ */}
      <section className="section pt-0">
        <Container>
          <SectionHeading
            eyebrow="Quick answers"
            title="Frequently asked"
            subtitle="A few of the things people ask us most. Find more on our FAQ page."
          />
          <StaggerGroup className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            {FAQ_GROUPS.slice(0, 2).flatMap((g) =>
              g.items.slice(0, 2).map(([q, a]) => (
                <StaggerItem key={q}>
                  <div className="h-full rounded-2xl bg-white p-6 shadow-soft">
                    <h3 className="flex items-start gap-2 font-display text-base font-semibold text-ink">
                      <Icon name="info" size={18} className="mt-0.5 shrink-0 text-gold-deep" />
                      {q}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-graphite/70">{a}</p>
                  </div>
                </StaggerItem>
              )),
            )}
          </StaggerGroup>
          <div className="mt-8 flex justify-center">
            <Button to="/faq" variant="outline">
              View all FAQs
              <Icon name="arrowRight" size={18} />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  )
}

/* ----------------------------- helpers ------------------------------- */
function inputCls(error) {
  return `w-full rounded-xl border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold ${
    error ? 'border-red-400' : 'border-ink/12'
  }`
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-button text-xs font-medium uppercase tracking-wider text-graphite/70">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  )
}
