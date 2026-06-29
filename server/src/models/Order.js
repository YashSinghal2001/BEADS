import mongoose from 'mongoose'
import { addressSchema } from './User.js'

const { Schema, model } = mongoose

export const ORDER_STATUSES = [
  'draft',
  'pending',
  'confirmed',
  'paid',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true }, // snapshot
    image: { type: String, default: '' },
    sku: { type: String, default: '' },
    variant: {
      color: { type: String, default: '' },
      size: { type: String, default: '' },
    },
    price: { type: Number, required: true }, // unit price at purchase
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true },
)

const timelineSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: '' },
    by: { type: String, default: 'system' }, // 'system' | 'customer' | 'admin' | userId
    at: { type: Date, default: Date.now },
  },
  { _id: false },
)

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },

    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, default: null },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String, default: null },

    paymentMethod: { type: String, enum: ['cod', 'razorpay'], default: 'cod' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    paymentInfo: {
      provider: { type: String, default: null },
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      signature: { type: String, default: null },
    },

    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },

    payment: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },

    shipmentTracking: {
      provider: { type: String, default: null },
      shipmentId: { type: String, default: null },
      awb: { type: String, default: null },
      courier: { type: String, default: null },
      trackingUrl: { type: String, default: null },
      label: { type: String, default: null },
      manifest: { type: String, default: null },
      shippingCost: { type: Number, default: 0 },
      status: { type: String, default: null },
      estimatedDelivery: { type: Date, default: null },
    },

    giftMessage: { type: String, default: '' },

    // inventory bookkeeping
    inventoryReserved: { type: Boolean, default: false },
    inventoryCommitted: { type: Boolean, default: false },

    notes: { type: String, default: '' },
    timeline: { type: [timelineSchema], default: [] },

    cancelledReason: { type: String, default: '' },
    returnReason: { type: String, default: '' },
  },
  { timestamps: true },
)

orderSchema.index({ createdAt: -1 })
orderSchema.index({ user: 1, createdAt: -1 })

/* Generate a human-friendly order number */
orderSchema.pre('validate', async function genNumber(next) {
  if (this.orderNumber) return next()
  const seq = Math.floor(10000 + Math.random() * 89999)
  this.orderNumber = `YSC-${seq}`
  next()
})

/* Seed the timeline with the initial status */
orderSchema.pre('save', function seedTimeline(next) {
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({ status: this.orderStatus, note: 'Order placed' })
  }
  next()
})

export const Order = model('Order', orderSchema)
export default Order
