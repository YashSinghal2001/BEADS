import mongoose from 'mongoose'

const { Schema, model } = mongoose

const webhookEventSchema = new Schema(
  {
    source: { type: String, enum: ['razorpay', 'shiprocket'], required: true },
    eventId: { type: String, required: true }, // gateway event id / dedupe key
    event: { type: String, required: true }, // e.g. payment.captured
    status: { type: String, enum: ['processed', 'failed', 'skipped'], default: 'processed' },
    payload: { type: Schema.Types.Mixed, default: {} },
    error: { type: String, default: null },
  },
  { timestamps: true },
)

/* one row per (source, eventId) → guarantees idempotency */
webhookEventSchema.index({ source: 1, eventId: 1 }, { unique: true })

export const WebhookEvent = model('WebhookEvent', webhookEventSchema)
export default WebhookEvent
