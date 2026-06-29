import { z } from 'zod'

export const validateCouponSchema = {
  body: z.object({
    code: z.string().min(1),
    subtotal: z.coerce.number().min(0).optional(),
  }),
}

export const createCouponSchema = {
  body: z.object({
    code: z.string().min(3),
    description: z.string().optional(),
    type: z.enum(['percent', 'flat', 'shipping']),
    amount: z.coerce.number().min(0),
    minimumPurchase: z.coerce.number().min(0).optional(),
    maximumDiscount: z.coerce.number().min(0).nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    usageLimit: z.coerce.number().int().min(1).nullable().optional(),
    perUserLimit: z.coerce.number().int().min(1).nullable().optional(),
    active: z.coerce.boolean().optional(),
  }),
}

export const updateCouponSchema = {
  body: createCouponSchema.body.partial(),
}
