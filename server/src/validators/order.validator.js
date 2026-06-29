import { z } from 'zod'
import { addressBody, objectId } from './common.validator.js'
import { ORDER_STATUSES } from '../models/Order.js'

export const createOrderSchema = {
  body: z.object({
    shippingAddress: addressBody,
    billingAddress: addressBody.optional(),
    paymentMethod: z.enum(['cod', 'razorpay']).default('cod'),
    couponCode: z.string().optional(),
    notes: z.string().max(500).optional(),
    giftMessage: z.string().max(300).optional(),
  }),
}

export const cancelOrderSchema = {
  body: z.object({ reason: z.string().max(500).optional() }),
}

export const returnOrderSchema = {
  body: z.object({ reason: z.string().min(3, 'Please provide a reason') }),
}

export const updateOrderStatusSchema = {
  body: z.object({
    orderStatus: z.enum(ORDER_STATUSES),
    note: z.string().max(500).optional(),
  }),
  params: z.object({ id: objectId }),
}
