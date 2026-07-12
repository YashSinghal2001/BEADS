import { ApiError } from '../utils/ApiError.js'
import { eventBus, ORDER_EVENTS } from './events.js'
import { emailQueue } from './email.service.js'

/* Allowed state machine for the order pipeline. */
export const ORDER_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'paid', 'cancelled'],
  confirmed: ['paid', 'processing', 'cancelled'],
  paid: ['confirmed', 'processing', 'cancelled', 'refunded'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'returned'],
  out_for_delivery: ['delivered', 'returned'],
  delivered: ['returned', 'refunded'],
  cancelled: ['refunded'],
  returned: ['refunded'],
  refunded: [],
}

export function canTransition(from, to) {
  if (from === to) return true
  return (ORDER_TRANSITIONS[from] || []).includes(to)
}

const EVENT_FOR = {
  paid: ORDER_EVENTS.PAID,
  confirmed: ORDER_EVENTS.CONFIRMED,
  shipped: ORDER_EVENTS.SHIPPED,
  out_for_delivery: ORDER_EVENTS.OUT_FOR_DELIVERY,
  delivered: ORDER_EVENTS.DELIVERED,
  cancelled: ORDER_EVENTS.CANCELLED,
  returned: ORDER_EVENTS.RETURNED,
  refunded: ORDER_EVENTS.REFUNDED,
}

/**
 * Transition an order to a new status with validation + audit trail.
 * Persists the order and emits the matching lifecycle event.
 */
export async function transitionOrder(order, to, { note = '', by = 'system', force = false } = {}) {
  const from = order.orderStatus
  if (!force && !canTransition(from, to)) {
    throw ApiError.badRequest(`Invalid order transition: ${from} → ${to}`)
  }
  order.orderStatus = to
  order.timeline.push({ status: to, note, by, at: new Date() })
  await order.save()

  if (EVENT_FOR[to]) eventBus.safeEmit(EVENT_FOR[to], order)
  return order
}

/* ----------------------- Lifecycle email handlers -------------------- */
const queueEmail = (type) => (order) => {
  emailQueue.enqueue({
    type,
    to: order.customerEmail || order.shippingAddress?.email || null,
    data: {
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.orderStatus,
      tracking: order.shipmentTracking,
      name: order.shippingAddress?.fullName,
    },
  })
}

eventBus.on(ORDER_EVENTS.PAID, queueEmail('payment_success'))
eventBus.on(ORDER_EVENTS.CONFIRMED, queueEmail('order_confirmation'))
eventBus.on(ORDER_EVENTS.SHIPPED, queueEmail('shipped'))
eventBus.on(ORDER_EVENTS.DELIVERED, queueEmail('delivered'))
eventBus.on(ORDER_EVENTS.CANCELLED, queueEmail('cancelled'))
eventBus.on(ORDER_EVENTS.REFUNDED, queueEmail('refund_issued'))
eventBus.on(ORDER_EVENTS.PAYMENT_FAILED, (order) => queueEmail('payment_failure')(order))

export default { transitionOrder, canTransition, ORDER_TRANSITIONS }
