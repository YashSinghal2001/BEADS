import { EventEmitter } from 'node:events'
import { logger } from '../utils/logger.js'

/**
 * App-wide event bus for the event-driven order lifecycle.
 * Handlers are registered by services (email, shipping…) and never block the
 * caller — errors in a handler are logged, not propagated.
 */
class SafeEmitter extends EventEmitter {
  safeEmit(event, payload) {
    setImmediate(() => {
      try {
        this.emit(event, payload)
      } catch (err) {
        logger.error(`Event handler error for ${event}: ${err.message}`)
      }
    })
  }
}

export const eventBus = new SafeEmitter()
eventBus.setMaxListeners(50)

export const ORDER_EVENTS = {
  CREATED: 'order:created',
  PAID: 'order:paid',
  CONFIRMED: 'order:confirmed',
  SHIPPED: 'order:shipped',
  OUT_FOR_DELIVERY: 'order:out_for_delivery',
  DELIVERED: 'order:delivered',
  CANCELLED: 'order:cancelled',
  RETURNED: 'order:returned',
  REFUNDED: 'order:refunded',
  PAYMENT_FAILED: 'payment:failed',
}

export default eventBus
