import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { Order } from '../models/Order.js'
import { Payment } from '../models/Payment.js'
import { WebhookEvent } from '../models/WebhookEvent.js'
import { verifyWebhookSignature } from '../services/payment.service.js'
import { transitionOrder } from '../services/order.service.js'
import { markOrderPaid, handlePaymentFailed } from './payment.controller.js'

/**
 * Record a webhook event for idempotency. Returns false if already processed
 * (replay) — the caller should then no-op and return 200.
 */
async function claimEvent(source, eventId, event, payload) {
  try {
    await WebhookEvent.create({ source, eventId, event, payload })
    return true
  } catch (err) {
    if (err.code === 11000) return false // duplicate → already processed
    throw err
  }
}

/* POST /webhooks/razorpay */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature']
  const eventId = req.headers['x-razorpay-event-id'] || `rzp-${Date.now()}`
  const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}))

  if (!verifyWebhookSignature(raw, signature)) {
    throw ApiError.unauthorized('Invalid webhook signature')
  }

  const body = req.body || {}
  const event = body.event
  const claimed = await claimEvent('razorpay', eventId, event, body)
  if (!claimed) return res.status(200).json({ success: true, message: 'Duplicate ignored' })

  const entity = body.payload?.payment?.entity || {}
  const gatewayOrderId = entity.order_id
  const payment = gatewayOrderId ? await Payment.findOne({ gatewayOrderId }) : null
  const order = payment ? await Order.findById(payment.order) : null

  if (payment && order) {
    switch (event) {
      case 'payment.captured':
      case 'payment.authorized':
        await markOrderPaid(order, payment, { paymentId: entity.id, method: entity.method })
        break
      case 'payment.failed':
        await handlePaymentFailed(order, payment, entity.error_description || 'Payment failed')
        break
      case 'refund.processed':
        payment.status = 'refunded'
        payment.refundStatus = 'full'
        payment.refundedAmount = (entity.amount || 0) / 100
        await payment.save()
        order.paymentStatus = 'refunded'
        if (order.orderStatus !== 'refunded') await transitionOrder(order, 'refunded', { note: 'Refund processed', by: 'system', force: true })
        break
      default:
        logger.info(`Unhandled Razorpay event: ${event}`)
    }
  }

  return res.status(200).json({ success: true })
})

/* POST /webhooks/shiprocket */
export const shiprocketWebhook = asyncHandler(async (req, res) => {
  // Shiprocket uses a configured token header for authentication
  const token = req.headers['x-api-key'] || req.headers['x-webhook-token']
  if (config.SHIPROCKET_WEBHOOK_TOKEN && token !== config.SHIPROCKET_WEBHOOK_TOKEN) {
    throw ApiError.unauthorized('Invalid webhook token')
  }

  const body = req.body || {}
  const awb = body.awb || body.awb_code
  const srStatus = (body.current_status || body.shipment_status || '').toLowerCase()
  const eventId = `${awb || 'na'}-${srStatus}-${body.order_id || ''}`

  const claimed = await claimEvent('shiprocket', eventId, srStatus || 'unknown', body)
  if (!claimed) return res.status(200).json({ success: true, message: 'Duplicate ignored' })

  const order = awb
    ? await Order.findOne({ 'shipmentTracking.awb': awb })
    : await Order.findOne({ orderNumber: body.order_id })

  if (order) {
    const map = {
      'picked up': 'shipped',
      shipped: 'shipped',
      'in transit': 'out_for_delivery',
      'out for delivery': 'out_for_delivery',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      returned: 'returned',
      cancelled: 'cancelled',
    }
    const target = srStatus.startsWith('rto') ? 'returned' : map[srStatus]
    order.shipmentTracking.status = srStatus
    // Opportunistically capture shipment identifiers the payload carries.
    if (awb && !order.shipmentTracking.awb) order.shipmentTracking.awb = String(awb)
    const courier = body.courier_name || body.courier
    if (courier && !order.shipmentTracking.courier) order.shipmentTracking.courier = String(courier)
    if (body.etd && !order.shipmentTracking.estimatedDelivery) {
      const etd = new Date(body.etd)
      if (!Number.isNaN(etd.getTime())) order.shipmentTracking.estimatedDelivery = etd
    }
    if (target && order.orderStatus !== target) {
      await transitionOrder(order, target, { note: `Shiprocket: ${srStatus}`, by: 'system', force: true })
    } else {
      await order.save()
    }
  }

  return res.status(200).json({ success: true })
})
