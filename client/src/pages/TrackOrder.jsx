import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Container, Reveal } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Seo from '../components/Seo'

const STEPS = [
  { key: 'confirmed', label: 'Order confirmed', icon: 'checkCircle', note: 'We’ve received your order and payment.' },
  { key: 'packed', label: 'Packed', icon: 'package', note: 'Your beads are carefully packed and labelled.' },
  { key: 'shipped', label: 'Shipped', icon: 'truck', note: 'Handed over to the courier partner.' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: 'mapPin', note: 'Your parcel is on its way to you today.' },
  { key: 'delivered', label: 'Delivered', icon: 'home', note: 'Delivered — happy making!' },
]

const COURIERS = ['BlueDart', 'Delhivery', 'DTDC', 'Ekart']

/* Deterministic pseudo-random from a string so a given order number is stable. */
const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function buildTracking(orderNumber) {
  const h = hash(orderNumber.toUpperCase())
  const stepIdx = h % STEPS.length
  const courier = COURIERS[h % COURIERS.length]
  const awb = `${courier.slice(0, 3).toUpperCase()}${(h % 9000000) + 1000000}`
  const today = new Date()
  const placed = new Date(today)
  placed.setDate(today.getDate() - (STEPS.length - stepIdx))
  const eta = new Date(today)
  eta.setDate(today.getDate() + Math.max(0, STEPS.length - 1 - stepIdx))

  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    orderNumber: orderNumber.toUpperCase(),
    currentIndex: stepIdx,
    courier,
    awb,
    placedOn: fmt(placed),
    delivered: stepIdx === STEPS.length - 1,
    eta: fmt(eta),
  }
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (!orderNumber.trim()) er.orderNumber = 'Enter your order number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) er.email = 'Enter the email used at checkout'
    if (Object.keys(er).length) {
      setErrors(er)
      return
    }
    setErrors({})
    setLoading(true)
    setResult(null)
    // Simulated lookup.
    setTimeout(() => {
      setResult(buildTracking(orderNumber.trim()))
      setLoading(false)
    }, 700)
  }

  return (
    <div className="pb-20 pt-10">
      <Seo
        title="Track Your Order"
        description="Enter your order number and email to see the latest status and delivery estimate."
      />
      <Container>
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center">
            <Reveal>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/10 text-gold-deep">
                <Icon name="truck" size={26} />
              </span>
            </Reveal>
            <Reveal delay={1}>
              <p className="eyebrow mt-6">Where’s my order?</p>
            </Reveal>
            <Reveal delay={1}>
              <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
                Track your order
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="mx-auto mt-4 max-w-lg text-graphite/70">
                Enter your order number and email to see the latest status and
                delivery estimate.
              </p>
            </Reveal>
          </div>

          {/* Form */}
          <Reveal delay={2}>
            <form
              onSubmit={submit}
              className="mt-10 rounded-[2rem] bg-white p-6 shadow-card md:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-button text-xs font-medium uppercase tracking-wider text-graphite/70">
                    Order number
                  </span>
                  <input
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value)
                      setErrors((x) => ({ ...x, orderNumber: undefined }))
                    }}
                    placeholder="e.g. YSC-48213"
                    className={`w-full rounded-xl border bg-cream px-4 py-3 text-sm uppercase text-ink outline-none transition-colors focus:border-gold ${
                      errors.orderNumber ? 'border-red-400' : 'border-ink/12'
                    }`}
                  />
                  {errors.orderNumber && (
                    <span className="mt-1 block text-xs text-red-500">{errors.orderNumber}</span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-button text-xs font-medium uppercase tracking-wider text-graphite/70">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setErrors((x) => ({ ...x, email: undefined }))
                    }}
                    placeholder="you@email.com"
                    className={`w-full rounded-xl border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold ${
                      errors.email ? 'border-red-400' : 'border-ink/12'
                    }`}
                  />
                  {errors.email && (
                    <span className="mt-1 block text-xs text-red-500">{errors.email}</span>
                  )}
                </label>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button type="submit" variant="gold" size="lg" disabled={loading}>
                  {loading ? 'Tracking…' : 'Track order'}
                  {!loading && <Icon name="search" size={18} />}
                </Button>
                <Button to="/account/orders" variant="ghost">
                  View all my orders
                </Button>
              </div>
            </form>
          </Reveal>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.orderNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-card"
              >
                {/* Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/8 bg-cream/40 px-6 py-5 md:px-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-graphite/55">Order</p>
                    <p className="font-button text-lg font-semibold text-ink">{result.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-graphite/55">
                      {result.delivered ? 'Delivered on' : 'Estimated delivery'}
                    </p>
                    <p className="flex items-center gap-1.5 font-button text-lg font-semibold text-gold-deep">
                      <Icon name="clock" size={17} />
                      {result.eta}
                    </p>
                  </div>
                </div>

                {/* Shipment details */}
                <div className="grid gap-4 px-6 py-5 sm:grid-cols-3 md:px-8">
                  <Detail label="Courier" value={result.courier} icon="truck" />
                  <Detail label="Tracking ID (AWB)" value={result.awb} icon="tag" />
                  <Detail label="Placed on" value={result.placedOn} icon="checkCircle" />
                </div>

                {/* Timeline */}
                <div className="px-6 py-6 md:px-8">
                  <h3 className="mb-6 font-display text-xl font-semibold text-ink">Shipment progress</h3>
                  <ol className="relative">
                    {STEPS.map((step, i) => {
                      const done = i < result.currentIndex
                      const current = i === result.currentIndex
                      const reached = done || current
                      return (
                        <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                          {/* connector */}
                          {i < STEPS.length - 1 && (
                            <span
                              className={`absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 ${
                                done ? 'bg-gold' : 'bg-sand'
                              }`}
                            />
                          )}
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 320, damping: 20 }}
                            className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                              reached ? 'bg-gold text-white shadow-soft' : 'bg-sand text-graphite/50'
                            } ${current ? 'ring-4 ring-gold/25' : ''}`}
                          >
                            <Icon name={done ? 'check' : step.icon} size={18} />
                          </motion.span>
                          <div className="pt-1.5">
                            <p
                              className={`font-button text-sm font-semibold ${
                                reached ? 'text-ink' : 'text-graphite/50'
                              }`}
                            >
                              {step.label}
                              {current && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold-deep">
                                  Current
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-graphite/60">{step.note}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>

                <div className="flex items-center gap-2 border-t border-ink/8 px-6 py-4 text-xs text-graphite/55 md:px-8">
                  <Icon name="info" size={14} />
                  Tracking updates can take a few hours to appear after a status change.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </div>
  )
}

function Detail({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream/50 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold-deep">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.14em] text-graphite/55">{label}</p>
        <p className="truncate text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}
