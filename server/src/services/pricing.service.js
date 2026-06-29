export const PRICING = {
  FREE_SHIPPING_THRESHOLD: 999,
  SHIPPING_FLAT: 79,
  TAX_RATE: 0.03, // 3% GST (illustrative)
}

/**
 * Compute order/cart totals from line items and an optional coupon document.
 * lineItems: [{ price, quantity }]
 * coupon: Coupon doc with computeDiscount() + type, or null
 */
export function computeTotals(lineItems = [], coupon = null) {
  const subtotal = lineItems.reduce((sum, it) => sum + it.price * it.quantity, 0)

  let discount = 0
  let freeShipping = false
  if (coupon) {
    if (coupon.type === 'shipping') freeShipping = true
    else discount = coupon.computeDiscount(subtotal)
  }

  let shipping = 0
  if (subtotal > 0 && !freeShipping) {
    shipping = subtotal >= PRICING.FREE_SHIPPING_THRESHOLD ? 0 : PRICING.SHIPPING_FLAT
  }

  const tax = Math.round((subtotal - discount) * PRICING.TAX_RATE)
  const total = Math.max(0, subtotal - discount + shipping + tax)

  return { subtotal, discount, shipping, tax, total }
}
