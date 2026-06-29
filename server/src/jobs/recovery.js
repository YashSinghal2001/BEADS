import { Order } from '../models/Order.js'
import { Payment } from '../models/Payment.js'
import * as inventory from '../services/inventory.service.js'
import { transitionOrder } from '../services/order.service.js'
import { logger } from '../utils/logger.js'

const RESERVATION_TTL_MIN = 30

/**
 * Release inventory held by prepaid orders that never completed payment,
 * then cancel them. Runs on a schedule in production.
 */
export async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_TTL_MIN * 60 * 1000)
  const stale = await Order.find({
    orderStatus: 'pending',
    paymentMethod: 'razorpay',
    inventoryReserved: true,
    inventoryCommitted: false,
    createdAt: { $lt: cutoff },
  })

  let released = 0
  for (const order of stale) {
    // eslint-disable-next-line no-await-in-loop
    await inventory.releaseMany(order.items)
    order.inventoryReserved = false
    // eslint-disable-next-line no-await-in-loop
    await Payment.updateOne({ order: order._id, status: { $ne: 'captured' } }, { status: 'failed', lastError: 'Payment timed out' })
    // eslint-disable-next-line no-await-in-loop
    await transitionOrder(order, 'cancelled', { note: 'Auto-cancelled: payment timed out', by: 'system', force: true })
    released += 1
  }
  if (released) logger.info(`Recovery: released ${released} expired reservation(s)`)
  return released
}

/**
 * Reconcile payments stuck in 'pending'/'authorized' beyond a grace window.
 * With a live gateway this would query Razorpay for the true status; here it
 * flags long-pending payments for review.
 */
export async function reconcilePayments() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const stuck = await Payment.find({
    status: { $in: ['pending', 'authorized', 'created'] },
    createdAt: { $lt: cutoff },
  }).select('_id order status')
  if (stuck.length) logger.warn(`Recovery: ${stuck.length} payment(s) need reconciliation`)
  return stuck.map((p) => p._id)
}

export async function runRecovery() {
  await releaseExpiredReservations()
  await reconcilePayments()
}

export default runRecovery
