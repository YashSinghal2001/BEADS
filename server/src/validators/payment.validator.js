import { z } from 'zod'
import { objectId } from './common.validator.js'

export const verifyPaymentSchema = {
  body: z.object({
    orderId: objectId,
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }),
}
