import crypto from 'node:crypto'
import { config } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

/**
 * Razorpay payment service — modular and inert until keys are set.
 * Uses the Razorpay REST API via fetch (no SDK dependency) so the server runs
 * without the package. Works against sandbox or production keys transparently.
 */
const RZP_BASE = 'https://api.razorpay.com/v1'

export const isPaymentEnabled = () => config.features.razorpay

function authHeader() {
  const token = Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_SECRET}`).toString('base64')
  return `Basic ${token}`
}

/** Create a Razorpay order (amount in rupees → paise). */
export async function createPaymentOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  if (!config.features.razorpay) {
    throw ApiError.badRequest('Online payments are not enabled. Please use Cash on Delivery.')
  }
  const res = await fetch(`${RZP_BASE}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency, receipt, notes }),
  })
  if (!res.ok) {
    const body = await res.text()
    logger.error(`Razorpay create order failed: ${res.status} ${body}`)
    throw new ApiError(502, 'Failed to initiate payment with gateway')
  }
  const order = await res.json()
  return {
    provider: 'razorpay',
    keyId: config.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  }
}

/**
 * Verify the checkout signature returned by Razorpay Checkout:
 * HMAC_SHA256(order_id + "|" + payment_id, key_secret) === signature
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!config.features.razorpay || !signature) return false
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return timingSafeEqual(expected, signature)
}

/**
 * Verify a Razorpay webhook signature against the RAW request body.
 * HMAC_SHA256(rawBody, webhook_secret) === X-Razorpay-Signature
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = config.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return timingSafeEqual(expected, signature)
}

/** Issue a refund for a captured payment. */
export async function refundPayment(paymentId, amount) {
  if (!config.features.razorpay) throw ApiError.badRequest('Payments not enabled')
  const res = await fetch(`${RZP_BASE}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(amount ? { amount: Math.round(amount * 100) } : {}),
  })
  if (!res.ok) throw new ApiError(502, 'Refund failed at gateway')
  return res.json()
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}
