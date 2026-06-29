import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { Accordion } from '../ui/RangeSlider'
import { Rating, RatingInput } from '../ui/Controls'
import { LineSkeleton } from '../ui/Skeleton'
import Button from '../ui/Button'
import { formatINR } from '../../lib/format'
import { reviewApi } from '../../api/review.api'
import { breakdownFromReviews } from '../../api/mappers'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from '../../store/useToastStore'

const TABS = [
  { key: 'description', label: 'Description' },
  { key: 'specs', label: 'Specifications' },
  { key: 'shipping', label: 'Shipping & Returns' },
  { key: 'faqs', label: 'FAQs' },
]

export function ProductTabs({ product }) {
  const [tab, setTab] = useState('description')

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
      <div className="no-scrollbar -mx-2 mb-6 flex gap-1 overflow-x-auto px-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative whitespace-nowrap rounded-full px-4 py-2 font-button text-sm font-medium transition-colors ${
              tab === t.key ? 'text-cream' : 'text-graphite/70 hover:text-ink'
            }`}
          >
            {tab === t.key && (
              <motion.span layoutId="info-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'description' && (
            <div>
              <p className="leading-relaxed text-graphite/80">{product.description}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {product.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm text-graphite">
                    <Icon name="checkCircle" size={18} className="mt-0.5 shrink-0 text-forest" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'specs' && (
            <dl className="divide-y divide-ink/8">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-4 py-3 text-sm">
                  <dt className="font-medium text-graphite/60">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === 'shipping' && (
            <div className="space-y-4">
              {[
                ['truck', 'Dispatch', product.shipping.dispatch],
                ['package', 'Delivery', product.shipping.delivery],
                ['tag', 'Free shipping', `On orders over ${formatINR(product.shipping.freeOver)}`],
                ['refresh', 'Returns', product.shipping.returns],
              ].map(([icon, t, d]) => (
                <div key={t} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold-deep">
                    <Icon name={icon} size={18} />
                  </span>
                  <div>
                    <h4 className="font-button text-sm font-semibold text-ink">{t}</h4>
                    <p className="text-sm text-graphite/70">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'faqs' && (
            <div className="-my-2">
              {product.faqs.map((f) => (
                <Accordion key={f.q} title={f.q} defaultOpen={false}>
                  <p className="text-sm leading-relaxed text-graphite/75">{f.a}</p>
                </Accordion>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function Reviews({ product }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [writing, setWriting] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let on = true
    setLoading(true)
    reviewApi
      .forProduct(product._id || product.id)
      .then(({ reviews: list }) => on && setReviews(list))
      .catch(() => {})
      .finally(() => on && setLoading(false))
    return () => {
      on = false
    }
  }, [product._id, product.id])

  const breakdown = breakdownFromReviews(reviews)
  const avg = product.rating || 0
  const totalReviews = product.reviews ?? reviews.length

  const submit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return toast.info('Please sign in to write a review')
    if (!body.trim()) return toast.error('Please write a short review')
    setSubmitting(true)
    try {
      const created = await reviewApi.create({
        product: product._id || product.id,
        rating,
        title,
        comment: body.trim(),
      })
      setReviews((r) => [created, ...r])
      setBody('')
      setTitle('')
      setWriting(false)
      toast.success('Thanks! Your review was posted')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not post review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        {/* Summary */}
        <div className="md:border-r md:border-ink/8 md:pr-8">
          <div className="flex items-end gap-2">
            <span className="font-display text-5xl font-semibold text-ink">{avg}</span>
            <span className="pb-1 text-graphite/50">/ 5</span>
          </div>
          <Rating value={avg} size={18} className="mt-2" />
          <p className="mt-1 text-sm text-graphite/60">{totalReviews} reviews</p>

          <div className="mt-5 space-y-1.5">
            {breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-graphite/60">{b.star}</span>
                <Icon name="star" size={12} className="text-gold [&_path]:fill-gold" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gold"
                  />
                </div>
                <span className="w-8 text-right text-graphite/50">{b.pct}%</span>
              </div>
            ))}
          </div>

          <Button variant="outline" className="mt-6 w-full" onClick={() => setWriting((w) => !w)}>
            {writing ? 'Cancel' : 'Write a review'}
          </Button>
        </div>

        {/* List + form */}
        <div>
          <AnimatePresence>
            {writing && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={submit}
                className="mb-6 overflow-hidden rounded-2xl bg-cream p-5"
              >
                <p className="mb-2 font-button text-sm font-semibold text-ink">Your rating</p>
                <RatingInput value={rating} onChange={setRating} />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Review title (optional)"
                  className="mt-3 w-full rounded-xl border border-ink/12 bg-white p-3 text-sm outline-none focus:border-gold"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  placeholder="Share your experience with this product…"
                  className="mt-3 w-full rounded-xl border border-ink/12 bg-white p-3 text-sm outline-none focus:border-gold"
                />
                <div className="mt-3 flex justify-end">
                  <Button type="submit" variant="gold" size="sm" disabled={submitting}>
                    {submitting ? 'Posting…' : 'Post review'}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {loading ? (
            <LineSkeleton lines={6} />
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-graphite/60">
              No reviews yet — be the first to share your thoughts.
            </p>
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-ink/8 pb-5 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-sand font-display text-sm font-semibold text-gold-deep">
                        {r.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{r.name}</p>
                        <p className="text-xs text-graphite/50">{r.date}</p>
                      </div>
                    </div>
                    {r.verified && (
                      <span className="flex items-center gap-1 text-xs text-forest">
                        <Icon name="checkCircle" size={14} /> Verified
                      </span>
                    )}
                  </div>
                  <Rating value={r.rating} size={14} className="mt-3" />
                  {r.title && <h4 className="mt-2 text-sm font-semibold text-ink">{r.title}</h4>}
                  <p className="mt-1 text-sm leading-relaxed text-graphite/75">{r.body}</p>
                  {r.adminReply && (
                    <div className="mt-3 rounded-xl bg-cream p-3 text-sm text-graphite/75">
                      <span className="font-semibold text-ink">YS Creations:</span> {r.adminReply}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
