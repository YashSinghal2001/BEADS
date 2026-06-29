import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Container } from '../components/ui/Primitives'
import { Icon } from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { EmptyState } from '../components/ui/Controls'
import { Field } from '../components/auth/AuthLayout'
import { formatINR } from '../lib/format'
import { useCartStore } from '../store/useCartStore'
import { useProfileStore } from '../store/useProfileStore'
import { useAuthStore } from '../store/useAuthStore'
import { useOrderStore } from '../store/useOrderStore'
import { useCheckoutStore, SHIPPING_METHODS } from '../store/useCheckoutStore'
import { paymentApi, openRazorpayCheckout } from '../api/payment.api'
import { toast } from '../store/useToastStore'

const STEPS = ['Information', 'Address', 'Shipping', 'Review', 'Payment', 'Done']

export default function Checkout() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const totals = useCartStore((s) => s.totals)
  const coupon = useCartStore((s) => s.coupon)
  const fetchCart = useCartStore((s) => s.fetch)
  const user = useAuthStore((s) => s.user) || {}
  const addresses = useProfileStore((s) => s.addresses)
  const fetchAddresses = useProfileStore((s) => s.fetchAddresses)
  const createOrder = useOrderStore((s) => s.createOrder)

  const co = useCheckoutStore()
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    fetchCart()
    fetchAddresses()
  }, [fetchCart, fetchAddresses])

  useEffect(() => {
    if (addresses.length) co.ensureAddress(addresses)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses])

  // reset to step 0 if landing mid-flow with empty selections
  useEffect(() => {
    if (co.step === 5 && !co.placedOrder) co.setStep(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedAddress = useMemo(
    () => addresses.find((a) => a._id === co.addressId) || null,
    [addresses, co.addressId],
  )

  if (items.length === 0 && co.step !== 5) {
    return (
      <div className="pt-10">
        <Container>
          <EmptyState
            icon="cart"
            title="Your cart is empty"
            message="Add something beautiful before checking out."
            action={<Button to="/shop" variant="gold" size="lg">Browse shop</Button>}
          />
        </Container>
      </div>
    )
  }

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address')
      co.setStep(1)
      return
    }
    const shippingAddress = {
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      addressLine1: selectedAddress.addressLine1,
      addressLine2: selectedAddress.addressLine2 || '',
      city: selectedAddress.city,
      state: selectedAddress.state,
      country: selectedAddress.country || 'India',
      pincode: selectedAddress.pincode,
      landmark: selectedAddress.landmark || '',
    }

    setPlacing(true)
    try {
      const { order, payment } = await createOrder({
        shippingAddress,
        paymentMethod: co.paymentMethod,
        notes: co.notes,
        giftMessage: co.isGift ? co.giftMessage : '',
      })

      if (co.paymentMethod === 'razorpay') {
        const resp = await openRazorpayCheckout({ payment, user })
        await paymentApi.verify({
          orderId: order._id,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        })
      }

      co.set({ placedOrder: order })
      co.setStep(5)
      fetchCart()
      toast.success('Order placed successfully!')
    } catch (err) {
      toast.error(err.message || 'Could not complete the order')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="pb-20 pt-8">
      <Container>
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink md:text-4xl">Checkout</h1>

        <Progress step={co.step} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={co.step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {co.step === 0 && <InfoStep user={user} co={co} />}
                {co.step === 1 && <AddressStep addresses={addresses} co={co} />}
                {co.step === 2 && <ShippingStep co={co} />}
                {co.step === 3 && <ReviewStep co={co} items={items} address={selectedAddress} />}
                {co.step === 4 && <PaymentStep co={co} placing={placing} onPlace={placeOrder} total={totals.total} />}
                {co.step === 5 && <ConfirmationStep order={co.placedOrder} onDone={() => { co.reset(); navigate('/account/orders') }} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {co.step !== 5 && <Summary items={items} totals={totals} coupon={coupon} />}
        </div>
      </Container>
    </div>
  )
}

/* ----------------------------- Progress ------------------------------ */
function Progress({ step }) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
      {STEPS.slice(0, 5).map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                i < step ? 'bg-forest text-white' : i === step ? 'bg-ink text-cream' : 'bg-sand text-graphite/60'
              }`}
            >
              {i < step ? <Icon name="check" size={15} /> : i + 1}
            </span>
            <span className={`whitespace-nowrap text-sm font-medium ${i === step ? 'text-ink' : 'text-graphite/50'}`}>{label}</span>
          </div>
          {i < 4 && <span className="h-px w-6 bg-ink/10 sm:w-10" />}
        </div>
      ))}
    </div>
  )
}

/* ----------------------------- Steps --------------------------------- */
function StepShell({ title, children, onNext, onBack, nextLabel = 'Continue', nextDisabled }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
      <h2 className="mb-5 font-display text-xl font-semibold text-ink">{title}</h2>
      {children}
      <div className="mt-6 flex justify-between gap-3">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            <Icon name="chevronLeft" size={18} /> Back
          </Button>
        ) : (
          <span />
        )}
        {onNext && (
          <Button variant="gold" onClick={onNext} disabled={nextDisabled}>
            {nextLabel} <Icon name="arrowRight" size={18} />
          </Button>
        )}
      </div>
    </div>
  )
}

function InfoStep({ user, co }) {
  return (
    <StepShell title="Customer information" onNext={co.next} nextLabel="Continue to address">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" icon="user" value={user.name || ''} readOnly />
        <Field label="Email" icon="mail" value={user.email || ''} readOnly />
        <Field label="Phone" icon="phone" value={user.phone || '—'} readOnly />
      </div>
      <p className="mt-4 text-xs text-graphite/55">
        Signed in as {user.email}. Guest checkout is coming soon.
      </p>
    </StepShell>
  )
}

function AddressStep({ addresses, co }) {
  const addAddress = useProfileStore((s) => s.addAddress)
  const [adding, setAdding] = useState(addresses.length === 0)
  const [form, setForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    try {
      await addAddress(form)
      setAdding(false)
    } catch {
      /* toast in store */
    }
  }

  return (
    <StepShell title="Delivery address" onBack={co.back} onNext={co.next} nextDisabled={!co.addressId} nextLabel="Continue to shipping">
      <div className="space-y-3">
        {addresses.map((a) => (
          <button
            key={a._id}
            onClick={() => co.set({ addressId: a._id })}
            className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
              co.addressId === a._id ? 'border-gold bg-gold/5' : 'border-ink/12 hover:border-ink/25'
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${co.addressId === a._id ? 'border-gold' : 'border-ink/25'}`}>
              {co.addressId === a._id && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
            </span>
            <span className="text-sm">
              <span className="font-semibold text-ink">{a.fullName}</span>
              <span className="block text-graphite/70">
                {a.addressLine1}, {a.city}, {a.state} — {a.pincode} · {a.phone}
              </span>
            </span>
          </button>
        ))}
      </div>

      {adding ? (
        <form onSubmit={save} className="mt-4 space-y-3 rounded-2xl bg-cream p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" value={form.fullName} onChange={upd('fullName')} />
            <Field label="Phone" value={form.phone} onChange={upd('phone')} />
          </div>
          <Field label="Address" value={form.addressLine1} onChange={upd('addressLine1')} />
          <Field label="Landmark / Area" value={form.addressLine2} onChange={upd('addressLine2')} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" value={form.city} onChange={upd('city')} />
            <Field label="State" value={form.state} onChange={upd('state')} />
            <Field label="Pincode" value={form.pincode} onChange={upd('pincode')} />
          </div>
          <Button type="submit" variant="primary" size="sm">Save address</Button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-4 flex items-center gap-2 text-sm font-medium text-gold-deep hover:underline">
          <Icon name="plus" size={16} /> Add a new address
        </button>
      )}
    </StepShell>
  )
}

function ShippingStep({ co }) {
  return (
    <StepShell title="Shipping method" onBack={co.back} onNext={co.next} nextLabel="Continue to review">
      <div className="space-y-3">
        {SHIPPING_METHODS.map((m) => {
          const disabled = m.id === 'express'
          return (
            <button
              key={m.id}
              disabled={disabled}
              onClick={() => co.set({ shippingMethod: m.id })}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors disabled:opacity-50 ${
                co.shippingMethod === m.id ? 'border-gold bg-gold/5' : 'border-ink/12 hover:border-ink/25'
              }`}
            >
              <span>
                <span className="font-semibold text-ink">{m.label}</span>
                <span className="block text-sm text-graphite/65">{m.detail}{disabled ? ' · coming soon' : ''}</span>
              </span>
              <span className="font-button text-sm font-semibold text-ink">{m.price ? formatINR(m.price) : 'Free'}</span>
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}

function ReviewStep({ co, items, address }) {
  return (
    <StepShell title="Review your order" onBack={co.back} onNext={co.next} nextLabel="Continue to payment">
      <div className="space-y-5">
        <div className="rounded-2xl border border-ink/10 p-4 text-sm">
          <p className="font-semibold text-ink">Deliver to</p>
          {address ? (
            <p className="mt-1 text-graphite/70">
              {address.fullName} · {address.addressLine1}, {address.city}, {address.state} — {address.pincode}
            </p>
          ) : (
            <p className="mt-1 text-red-500">No address selected</p>
          )}
        </div>

        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.key} className="flex items-center gap-3">
              <img src={it.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                <p className="text-xs text-graphite/55">Qty {it.qty}</p>
              </div>
              <span className="text-sm font-semibold text-ink">{formatINR(it.price * it.qty)}</span>
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block font-button text-sm font-medium text-ink">Order notes (optional)</label>
          <textarea
            value={co.notes}
            onChange={(e) => co.set({ notes: e.target.value })}
            rows={2}
            placeholder="Delivery instructions, etc."
            className="w-full rounded-xl border border-ink/12 bg-white p-3 text-sm outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" className="accent-gold" checked={co.isGift} onChange={(e) => co.set({ isGift: e.target.checked })} />
            This is a gift 🎁
          </label>
          {co.isGift && (
            <textarea
              value={co.giftMessage}
              onChange={(e) => co.set({ giftMessage: e.target.value })}
              rows={2}
              placeholder="Add a gift message…"
              className="mt-2 w-full rounded-xl border border-ink/12 bg-white p-3 text-sm outline-none focus:border-gold"
            />
          )}
        </div>
      </div>
    </StepShell>
  )
}

function PaymentStep({ co, placing, onPlace, total }) {
  const methods = [
    { id: 'cod', label: 'Cash on Delivery', detail: 'Pay when your order arrives', icon: 'truck' },
    { id: 'razorpay', label: 'Pay online', detail: 'UPI · Cards · Netbanking · Wallets', icon: 'creditCard' },
  ]
  return (
    <StepShell title="Payment" onBack={co.back}>
      <div className="space-y-3">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => co.set({ paymentMethod: m.id })}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
              co.paymentMethod === m.id ? 'border-gold bg-gold/5' : 'border-ink/12 hover:border-ink/25'
            }`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold-deep">
              <Icon name={m.icon} size={18} />
            </span>
            <span>
              <span className="font-semibold text-ink">{m.label}</span>
              <span className="block text-sm text-graphite/65">{m.detail}</span>
            </span>
          </button>
        ))}
      </div>

      <Button variant="gold" size="lg" className="mt-6 w-full" onClick={onPlace} disabled={placing}>
        {placing ? 'Placing order…' : `Place order · ${formatINR(total)}`}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-2 text-xs text-graphite/50">
        <Icon name="lock" size={14} /> Secure checkout · Razorpay
      </p>
    </StepShell>
  )
}

function ConfirmationStep({ order, onDone }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-soft md:p-12">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest/15 text-forest"
      >
        <Icon name="checkCircle" size={34} />
      </motion.span>
      <h2 className="mt-6 font-display text-3xl font-semibold text-ink">Thank you!</h2>
      <p className="mt-2 text-graphite/70">
        Your order <span className="font-semibold text-ink">{order?.id}</span> has been placed.
      </p>
      <p className="mt-1 text-sm text-graphite/55">A confirmation has been sent to your email.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button variant="primary" onClick={onDone}>View my orders</Button>
        <Button variant="outline" to="/shop">Continue shopping</Button>
      </div>
    </div>
  )
}

/* ----------------------------- Summary ------------------------------- */
function Summary({ items, totals, coupon }) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
        <div className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
          {items.map((it) => (
            <div key={it.key} className="flex items-center gap-3">
              <div className="relative">
                <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-semibold text-cream">{it.qty}</span>
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-ink">{it.name}</p>
              <span className="text-sm font-medium text-ink">{formatINR(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-ink/8 pt-4 text-sm">
          <Row label="Subtotal" value={formatINR(totals.subtotal)} />
          {totals.discount > 0 && <Row label={`Discount${coupon ? ` (${coupon.code})` : ''}`} value={`– ${formatINR(totals.discount)}`} accent="text-forest" />}
          <Row label="Shipping" value={totals.shipping ? formatINR(totals.shipping) : 'Free'} />
          <Row label="Tax" value={formatINR(totals.tax)} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-4">
          <span className="font-display text-lg font-semibold text-ink">Total</span>
          <span className="font-display text-2xl font-semibold text-ink">{formatINR(totals.total)}</span>
        </div>
        <Link to="/cart" className="mt-4 block text-center text-sm text-graphite/60 hover:text-ink">Edit cart</Link>
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-graphite/70">{label}</span>
      <span className={accent ? `font-medium ${accent}` : 'font-medium text-ink'}>{value}</span>
    </div>
  )
}
