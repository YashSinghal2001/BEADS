import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Order } from '../models/Order.js'
import { Payment } from '../models/Payment.js'
import { User } from '../models/User.js'
import { verifyPaymentSignature, createPaymentOrder } from '../services/payment.service.js'
import * as inventory from '../services/inventory.service.js'
import { transitionOrder } from '../services/order.service.js'
import { eventBus, ORDER_EVENTS } from '../services/events.js'

/**
 * Idempotently mark an order as paid: capture the payment, commit reserved
 * inventory, award loyalty and advance the order to confirmed. Safe to call
 * concurrently from the verify endpoint and the captured webhook — a single
 * conditional update claims the capture, so exactly one caller runs the side
 * effects; the loser (or a replay) returns without touching anything.
 */
export async function markOrderPaid(order, payment, { paymentId = null, signature = null, method = null } = {}) {
  const set = { status: 'captured', verificationStatus: 'verified' }
  if (paymentId) set.gatewayPaymentId = paymentId
  if (signature) set.gatewaySignature = signature
  if (method) set.paymentMethod = method

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $nin: ['captured', 'refunded'] } },
    { $set: set, $inc: { attempts: 1 } },
    { new: true },
  )
  if (!claimed) return order // already captured by the other path (or refunded)

  order.paymentStatus = 'paid'
  if (!order.inventoryCommitted) {
    await inventory.commitMany(order.items)
    order.inventoryCommitted = true
    order.inventoryReserved = false
  }
  await User.findByIdAndUpdate(order.user, { $inc: { loyaltyPoints: Math.floor(order.total / 100) } })

  if (order.orderStatus === 'pending') {
    await transitionOrder(order, 'paid', { note: 'Payment captured', by: 'system' })
    await transitionOrder(order, 'confirmed', { note: 'Order confirmed', by: 'system' })
  } else {
    await order.save() // persist paymentStatus/inventory flags when no transition runs
  }
  return order
}

/**
 * Mark a payment failed and release any held inventory. Both the failure claim
 * and the reservation release are conditional updates, so a concurrent capture
 * wins cleanly and the release can never run twice.
 */
export async function handlePaymentFailed(order, payment, reason = 'Payment failed') {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $nin: ['captured', 'refunded'] } },
    { $set: { status: 'failed', verificationStatus: 'failed', lastError: reason }, $inc: { attempts: 1 } },
    { new: true },
  )
  if (!claimed) return
  const released = await Order.updateOne(
    { _id: order._id, inventoryReserved: true, inventoryCommitted: false },
    { $set: { inventoryReserved: false } },
  )
  if (released.modifiedCount === 1) await inventory.releaseMany(order.items)
  eventBus.safeEmit(ORDER_EVENTS.PAYMENT_FAILED, order)
}

/* POST /payments/verify — verify Razorpay checkout signature */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')
  if (!order.user.equals(req.user._id)) throw ApiError.forbidden('Not allowed')

  const payment = await Payment.findOne({ order: order._id })
  if (!payment) throw ApiError.notFound('Payment record not found')
  if (payment.status === 'captured') {
    return sendSuccess(res, { message: 'Payment already verified', data: { order } })
  }

  // The posted gateway order must be the one this order's payment was created
  // for — a valid signature belonging to a different (cheaper) order must not
  // be able to mark this order as paid.
  if (!payment.gatewayOrderId || payment.gatewayOrderId !== razorpay_order_id) {
    throw ApiError.badRequest('Payment does not match this order')
  }

  const ok = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  })
  if (!ok) {
    await handlePaymentFailed(order, payment, 'Signature verification failed')
    throw ApiError.badRequest('Payment verification failed')
  }

  await markOrderPaid(order, payment, { paymentId: razorpay_payment_id, signature: razorpay_signature })
  return sendSuccess(res, { message: 'Payment verified', data: { order } })
})

/* POST /payments/:orderId/retry — re-initialise a Razorpay order for retry */
export const retryPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
  if (!order) throw ApiError.notFound('Order not found')
  if (!order.user.equals(req.user._id)) throw ApiError.forbidden('Not allowed')
  if (order.paymentStatus === 'paid') throw ApiError.badRequest('Order is already paid')

  const payment = await Payment.findOne({ order: order._id })
  if (!payment) throw ApiError.notFound('Payment record not found')

  const gw = await createPaymentOrder({ amount: order.total, receipt: `${order.orderNumber}-r${payment.attempts + 1}` })
  // Conditional reset: a capture landing between the check above and this write
  // must not be overwritten back to 'pending'.
  const reset = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $nin: ['captured', 'refunded'] } },
    { $set: { gatewayOrderId: gw.orderId, status: 'pending' }, $inc: { attempts: 1 } },
    { new: true },
  )
  if (!reset) throw ApiError.badRequest('Order is already paid')

  return sendSuccess(res, {
    message: 'Payment re-initialised',
    data: {
      payment: {
        method: 'razorpay',
        keyId: gw.keyId,
        gatewayOrderId: gw.orderId,
        amount: gw.amount,
        currency: gw.currency,
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    },
  })
})

/* GET /payments — current user's payment history */
export const paymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('order', 'orderNumber orderStatus total')
    .sort({ createdAt: -1 })
    .lean()
  return sendSuccess(res, { data: { payments } })
})

/* POST /admin/orders/:id/refund (admin) — refund a paid order */
export const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  const payment = await Payment.findOne({ order: order._id })
  if (!payment) throw ApiError.notFound('Payment not found')
  if (order.paymentStatus === 'refunded') throw ApiError.badRequest('Order already refunded')

  const amount = req.body?.amount || order.total

  // For online payments, attempt a gateway refund (gated on keys)
  if (payment.gateway === 'razorpay' && payment.gatewayPaymentId) {
    const { refundPayment } = await import('../services/payment.service.js')
    await refundPayment(payment.gatewayPaymentId, amount)
  }

  payment.status = 'refunded'
  payment.refundStatus = amount >= order.total ? 'full' : 'partial'
  payment.refundedAmount = amount
  await payment.save()

  order.paymentStatus = 'refunded'
  if (order.orderStatus !== 'refunded') {
    await transitionOrder(order, 'refunded', { note: `Refunded ${amount} by admin`, by: 'admin', force: true })
  }
  return sendSuccess(res, { message: 'Refund processed', data: { order } })
})
