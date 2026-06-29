import { z } from 'zod'
import { addressBody } from './common.validator.js'

export const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone').optional(),
    avatar: z.object({ url: z.string().url(), publicId: z.string().optional() }).optional(),
  }),
}

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
}

export const addressSchema = { body: addressBody }
