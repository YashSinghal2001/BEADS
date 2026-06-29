import { z } from 'zod'

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id')

export const idParam = z.object({ id: objectId })
export const slugParam = z.object({ slug: z.string().min(1) })

export const addressBody = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone'),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional().default(''),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().optional().default('India'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Enter a valid 6-digit pincode'),
  landmark: z.string().optional().default(''),
  isDefault: z.coerce.boolean().optional().default(false),
})

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  sort: z.string().optional(),
})
