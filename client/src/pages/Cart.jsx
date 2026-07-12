import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { QuantityStepper, EmptyState } from '../components/ui/Controls'
import ProductCarousel from '../components/product/ProductCarousel'
import Seo from '../components/Seo'
import { useCartStore } from '../store/useCartStore'
import { useProductStore } from '../store/useProductStore'
import { formatINR } from '../lib/format'
import { FREE_SHIPPING_THRESHOLD } from '../lib/constants'
import { toast } from '../store/useToastStore'

export default function Cart() {
  const items = useCartStore((s) => s.items)
  const saved = useCartStore((s) => s.savedForLater)
  const fetchCart = useCartStore((s) => s.fetch)
  const fetchFeatured = useProductStore((s) => s.fetchFeatured)
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    fetchCart()
    fetchFeatured()
      .then((list) => setRecommendations(list.filter((p) => p.badge === 'Best Seller').slice(0, 8)))
      .catch(() => {})
  }, [fetchCart, fetchFeatured])

  if (items.length === 0 && saved.length === 0) {
    return (
      <div className="pt-10">
        <Seo title="Cart" noindex />
        <Container>
          <EmptyState
            icon="cart"
            title="Your cart is empty"
            message="Looks like you haven't added anything yet. Let's find something beautiful."
            action={<Button to="/shop" variant="gold" size="lg">Start shopping</Button>}
          />
          {recommendations.length > 0 && (
            <div className="mt-12">
              <ProductCarousel eyebrow="Popular right now" title="Best sellers" products={recommendations} idBase="cartrec" />
            </div>
          )}
        </Container>
      </div>
    )
  }

  return (
    <div className="pb-20 pt-8">
      <Seo title="Cart" noindex />
      <Container>
        <h1 className="mb-8 font-display text-3xl font-semibold text-ink md:text-4xl">
          Your cart <span className="text-graphite/40">({items.reduce((n, i) => n + i.qty, 0)})</span>
        </h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <FreeShippingBar />
            <div className="mt-5 space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <CartLine key={item.key} item={item} />
                ))}
              </AnimatePresence>
            </div>
            {items.length === 0 && (
              <p className="rounded-2xl bg-white/60 p-6 text-center text-sm text-graphite/60">
                Your cart is empty — move an item back from saved below.
              </p>
            )}
            <SavedForLater />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummary />
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-16">
            <ProductCarousel eyebrow="Complete your set" title="You may also like" products={recommendations} idBase="cartrec" />
          </div>
        )}
      </Container>
    </div>
  )
}

function FreeShippingBar() {
  const subtotal = useCartStore((s) => s.subtotal())
  const remaining = useCartStore((s) => s.freeShippingRemaining())
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-soft backdrop-blur">
      <p className="text-sm text-graphite">
        {remaining > 0 ? (
          <>
            Add <span className="font-semibold text-ink">{formatINR(remaining)}</span> more for{' '}
            <span className="font-semibold text-gold-deep">free shipping</span> 🎉
          </>
        ) : (
          <span className="flex items-center gap-1.5 font-medium text-forest">
            <Icon name="checkCircle" size={16} /> You've unlocked free shipping!
          </span>
        )}
      </p>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-sand">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep"
        />
      </div>
    </div>
  )
}

function CartLine({ item }) {
  const setQty = useCartStore((s) => s.setQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const saveForLater = useCartStore((s) => s.saveForLater)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
      className="flex gap-4 rounded-2xl bg-white p-3 shadow-soft sm:p-4"
    >
      <Link to={`/product/${item.slug}`} className="block aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-sand/40 sm:w-28">
        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/product/${item.slug}`}>
              <h3 className="truncate font-body text-[15px] font-medium text-ink hover:text-gold-deep">{item.name}</h3>
            </Link>
            <p className="mt-0.5 text-xs text-graphite/55">
              {[item.variant?.color, item.variant?.size].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            aria-label="Remove"
            onClick={() => removeItem(item.key)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-graphite/50 hover:bg-ink/5 hover:text-red-500"
          >
            <Icon name="trash" size={17} />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <QuantityStepper value={item.qty} onChange={(q) => setQty(item.key, q)} size="sm" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => saveForLater(item.key)}
              className="text-xs font-medium text-graphite/60 hover:text-gold-deep"
            >
              Save for later
            </button>
            <span className="font-display text-lg font-semibold text-ink">{formatINR(item.price * item.qty)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SavedForLater() {
  const saved = useCartStore((s) => s.savedForLater)
  const moveToCart = useCartStore((s) => s.moveToCart)
  const removeSaved = useCartStore((s) => s.removeSaved)
  if (!saved.length) return null

  return (
    <div className="mt-10">
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">Saved for later ({saved.length})</h2>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {saved.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex items-center gap-4 rounded-2xl bg-white/60 p-3"
            >
              <Link to={`/product/${item.slug}`} className="block aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-sand/40">
                <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-ink">{item.name}</h3>
                <p className="text-sm font-semibold text-gold-deep">{formatINR(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => moveToCart(item.id)}>
                  Move to cart
                </Button>
                <button
                  aria-label="Remove"
                  onClick={() => removeSaved(item.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-graphite/50 hover:text-red-500"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function OrderSummary() {
  const subtotal = useCartStore((s) => s.subtotal())
  const savings = useCartStore((s) => s.savings())
  const discount = useCartStore((s) => s.discount())
  const shipping = useCartStore((s) => s.shipping())
  const tax = useCartStore((s) => s.tax())
  const total = useCartStore((s) => s.total())
  const coupon = useCartStore((s) => s.coupon)
  const applyCoupon = useCartStore((s) => s.applyCoupon)
  const removeCoupon = useCartStore((s) => s.removeCoupon)
  const itemCount = useCartStore((s) => s.count())

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)

  const apply = async (e) => {
    e.preventDefault()
    setApplying(true)
    const res = await applyCoupon(code)
    setApplying(false)
    if (res.ok) {
      toast.success(`Coupon applied: ${res.message}`, { icon: 'tag' })
      setCode('')
      setError('')
    } else {
      setError(res.message)
    }
  }

  const Row = ({ label, value, accent }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-graphite/70">{label}</span>
      <span className={accent || 'font-medium text-ink'}>{value}</span>
    </div>
  )

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <h2 className="font-display text-xl font-semibold text-ink">Order summary</h2>

      <div className="mt-5">
        {coupon ? (
          <div className="flex items-center justify-between rounded-xl border border-forest/20 bg-forest/5 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm font-medium text-forest">
              <Icon name="tag" size={16} /> {coupon.code}
            </span>
            <button onClick={removeCoupon} className="text-xs text-graphite/60 hover:text-red-500">Remove</button>
          </div>
        ) : (
          <form onSubmit={apply}>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setError('')
                }}
                placeholder="Coupon code"
                className="min-w-0 flex-1 rounded-xl border border-ink/12 bg-cream px-3 py-2.5 text-sm uppercase outline-none focus:border-gold"
              />
              <Button type="submit" variant="primary" size="sm" disabled={applying || !code}>
                {applying ? '…' : 'Apply'}
              </Button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            <p className="mt-1.5 text-xs text-graphite/45">Try WELCOME10 or FREESHIP</p>
          </form>
        )}
      </div>

      <div className="mt-5 space-y-2.5 border-t border-ink/8 pt-5">
        <Row label={`Subtotal (${itemCount} items)`} value={formatINR(subtotal)} />
        {savings > 0 && <Row label="Product savings" value={`– ${formatINR(savings)}`} accent="font-medium text-forest" />}
        {discount > 0 && <Row label="Coupon discount" value={`– ${formatINR(discount)}`} accent="font-medium text-forest" />}
        <Row label="Shipping" value={shipping === 0 ? 'Free' : formatINR(shipping)} accent={shipping === 0 ? 'font-medium text-forest' : undefined} />
        <Row label="Tax (GST 3%)" value={formatINR(tax)} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink/8 pt-5">
        <span className="font-display text-lg font-semibold text-ink">Total</span>
        <span className="font-display text-2xl font-semibold text-ink">{formatINR(total)}</span>
      </div>

      <Button to="/checkout" variant="gold" size="lg" className="mt-5 w-full" disabled={itemCount === 0}>
        Proceed to checkout
        <Icon name="arrowRight" size={18} />
      </Button>

      <Link to="/shop" className="mt-3 block text-center text-sm text-graphite/60 hover:text-ink">Continue shopping</Link>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-graphite/50">
        <Icon name="lock" size={14} /> Secure checkout · Razorpay (Phase 4)
      </div>
    </div>
  )
}
