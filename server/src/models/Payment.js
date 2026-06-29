import mongoose from 'mongoose'

const { Schema, model } = mongoose

export const PAYMENT_STATUSES = [
  'created',
  'pending',
  'authorized',
  'captured',
  'failed',
  'cancelled',
  'refunded',
]

const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },

    amount: { type: Number, required: true }, // in rupees
    currency: { type: String, default: 'INR' },
    gateway: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },

    gatewayOrderId: { type: String, default: null, index: true },
    gatewayPaymentId: { type: String, default: null, index: true },
    gatewaySignature: { type: String, default: null },

    paymentMethod: { type: String, default: null }, // card / upi / netbanking / cod …

    status: { type: String, enum: PAYMENT_STATUSES, default: 'created', index: true },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'failed'],
      default: 'unverified',
    },
    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full', 'processing'],
      default: 'none',
    },
    refundedAmount: { type: Number, default: 0 },

    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

paymentSchema.index({ createdAt: -1 })

export const Payment = model('Payment', paymentSchema)
export default Payment
