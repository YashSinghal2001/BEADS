import { z } from 'zod'

const seo = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).optional(),
  })
  .optional()

export const createCategorySchema = {
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    image: z.object({ url: z.string().url(), publicId: z.string().optional() }).optional(),
    featured: z.coerce.boolean().optional(),
    order: z.coerce.number().int().optional(),
    seo,
  }),
}

export const updateCategorySchema = {
  body: createCategorySchema.body.partial(),
}
