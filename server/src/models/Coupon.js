import mongoose from 'mongoose'

const { Schema, model } = mongoose

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'flat', 'shipping'], required: true },
    amount: { type: Number, required: true, min: 0 }, // percent value, flat ₹, or 0 for shipping
    minimumPurchase: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: null }, // cap for percent coupons
    expiryDate: { type: Date, default: null },
    usageLimit: { type: Number, default: null }, // total uses allowed
    perUserLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

/** Returns { ok, reason } for a given subtotal. */
couponSchema.methods.isValidFor = function isValidFor(subtotal) {
  if (!this.active) return { ok: false, reason: 'Coupon is not active' }
  if (this.expiryDate && this.expiryDate < new Date()) return { ok: false, reason: 'Coupon has expired' }
  if (this.usageLimit != null && this.usedCount >= this.usageLimit)
    return { ok: false, reason: 'Coupon usage limit reached' }
  if (subtotal < this.minimumPurchase)
    return { ok: false, reason: `Minimum purchase of ₹${this.minimumPurchase} required` }
  return { ok: true }
}

/** Compute discount amount for a subtotal. */
couponSchema.methods.computeDiscount = function computeDiscount(subtotal) {
  if (this.type === 'percent') {
    let d = Math.round((subtotal * this.amount) / 100)
    if (this.maximumDiscount != null) d = Math.min(d, this.maximumDiscount)
    return d
  }
  if (this.type === 'flat') return Math.min(this.amount, subtotal)
  return 0 // shipping handled separately
}

export const Coupon = model('Coupon', couponSchema)
export default Coupon
