import { z } from 'zod'

export const createBlogSchema = {
  body: z.object({
    title: z.string().min(3),
    excerpt: z.string().max(320).optional(),
    content: z.string().optional(),
    featuredImage: z.object({ url: z.string().url(), publicId: z.string().optional() }).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.array(z.string()).optional(),
      })
      .optional(),
    published: z.coerce.boolean().optional(),
  }),
}

export const updateBlogSchema = {
  body: createBlogSchema.body.partial(),
}
