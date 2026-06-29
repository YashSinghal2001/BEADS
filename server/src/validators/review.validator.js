import { z } from 'zod'
import { objectId } from './common.validator.js'

export const createReviewSchema = {
  body: z.object({
    product: objectId,
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    comment: z.string().max(2000).optional(),
    images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional() })).optional(),
  }),
}

export const updateReviewSchema = {
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: z.string().max(120).optional(),
    comment: z.string().max(2000).optional(),
  }),
}
