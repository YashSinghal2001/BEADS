import { z } from 'zod'
import { objectId } from './common.validator.js'

const media = z.object({ url: z.string().url(), publicId: z.string().optional(), alt: z.string().optional() })

const variant = z.object({
  color: z.string().optional(),
  size: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).nullable().optional(),
  images: z.array(media).optional(),
})

export const createProductSchema = {
  body: z.object({
    title: z.string().min(2),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    category: objectId,
    subCategory: z.string().optional(),
    tags: z.array(z.string()).optional(),
    barcode: z.string().optional(),
    brand: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    trending: z.coerce.boolean().optional(),
    bestSeller: z.coerce.boolean().optional(),
    newArrival: z.coerce.boolean().optional(),
    mrp: z.coerce.number().min(0),
    salePrice: z.coerce.number().min(0),
    stock: z.coerce.number().int().min(0).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    images: z.array(media).optional(),
    videos: z.array(media).optional(),
    variants: z.array(variant).optional(),
    specifications: z
      .object({
        material: z.string().optional(),
        weight: z.coerce.number().optional(),
        finish: z.string().optional(),
        packageContents: z.string().optional(),
        dimensions: z
          .object({
            length: z.coerce.number().optional(),
            width: z.coerce.number().optional(),
            height: z.coerce.number().optional(),
            unit: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.array(z.string()).optional(),
      })
      .optional(),
    isActive: z.coerce.boolean().optional(),
  }),
}

export const updateProductSchema = {
  body: createProductSchema.body.partial(),
}

export const productQuerySchema = {
  query: z.object({
    q: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(), // id or slug
    tags: z.string().optional(), // comma-separated
    material: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    featured: z.enum(['true', 'false']).optional(),
    bestSeller: z.enum(['true', 'false']).optional(),
    newArrival: z.enum(['true', 'false']).optional(),
    sort: z.enum(['featured', 'new', 'price-asc', 'price-desc', 'rating', 'popular']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(60).optional(),
  }),
}
