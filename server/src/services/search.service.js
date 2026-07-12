import { Product } from '../models/Product.js'
import { Category } from '../models/Category.js'

/**
 * Resolve a category identifier that may be an ObjectId or a slug.
 */
async function resolveCategoryId(category) {
  if (!category) return null
  if (/^[0-9a-fA-F]{24}$/.test(category)) return category
  const cat = await Category.findOne({ slug: category }).select('_id').lean()
  return cat?._id || '000000000000000000000000' // non-matching id → empty results
}

/**
 * Build a Mongo filter object from normalised query params.
 */
export async function buildProductFilter(q = {}, { includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true }

  const term = (q.q || q.search || '').trim()
  if (term) filter.$text = { $search: term }

  if (q.category) filter.category = await resolveCategoryId(q.category)

  if (q.tags) filter.tags = { $in: q.tags.split(',').map((t) => t.trim()).filter(Boolean) }
  if (q.material) filter['specifications.material'] = q.material

  if (q.minPrice != null || q.maxPrice != null) {
    filter.salePrice = {}
    if (q.minPrice != null) filter.salePrice.$gte = Number(q.minPrice)
    if (q.maxPrice != null) filter.salePrice.$lte = Number(q.maxPrice)
  }

  if (q.minRating != null) filter.averageRating = { $gte: Number(q.minRating) }
  if (q.inStock === 'true') filter.stockStatus = { $ne: 'out_of_stock' }
  if (q.featured === 'true') filter.featured = true
  if (q.bestSeller === 'true') filter.bestSeller = true
  if (q.newArrival === 'true') filter.newArrival = true

  return { filter, hasText: Boolean(term) }
}

/**
 * Map a sort key to a Mongo sort object.
 */
export function buildProductSort(sort, hasText) {
  switch (sort) {
    case 'price-asc':
      return { salePrice: 1 }
    case 'price-desc':
      return { salePrice: -1 }
    case 'rating':
      return { averageRating: -1, totalReviews: -1 }
    case 'new':
      return { createdAt: -1 }
    case 'popular':
      return { soldCount: -1 }
    case 'featured':
    default:
      return hasText
        ? { score: { $meta: 'textScore' }, soldCount: -1 }
        : { featured: -1, bestSeller: -1, soldCount: -1, createdAt: -1 }
  }
}

/**
 * Lightweight autocomplete — prefix/contains match on title + tags.
 */
export async function autocomplete(term, limit = 8) {
  if (!term || term.trim().length < 2) return []
  const rx = new RegExp(term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const results = await Product.find({ isActive: true, $or: [{ title: rx }, { tags: rx }] })
    .select('title slug images salePrice')
    .limit(limit)
    .lean()
  return results.map((p) => ({
    title: p.title,
    slug: p.slug,
    price: p.salePrice,
    image: p.images?.[0]?.url || '',
  }))
}

/** Popular search suggestions (top tags + trending titles). */
export async function suggestions(limit = 8) {
  const trending = await Product.find({ isActive: true, trending: true })
    .select('title slug')
    .limit(limit)
    .lean()
  return trending.map((p) => ({ title: p.title, slug: p.slug }))
}
