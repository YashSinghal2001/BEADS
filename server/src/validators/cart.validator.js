import { z } from 'zod'
import { objectId } from './common.validator.js'

const variant = z
  .object({
    color: z.string().optional(),
    size: z.string().optional(),
    sku: z.string().optional(),
  })
  .optional()

export const addToCartSchema = {
  body: z.object({
    product: objectId,
    quantity: z.coerce.number().int().min(1).max(99).default(1),
    variant,
  }),
}

export const updateCartItemSchema = {
  body: z.object({
    quantity: z.coerce.number().int().min(1).max(99),
  }),
  params: z.object({ itemId: objectId }),
}

export const applyCouponSchema = {
  body: z.object({ code: z.string().min(1) }),
}
