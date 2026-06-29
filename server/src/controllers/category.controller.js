import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'

/* GET /categories */
export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.featured === 'true' ? { featured: true } : {}
  const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean()

  // attach product counts
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countMap = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {})
  const withCounts = categories.map((c) => ({ ...c, productCount: countMap[c._id] || 0 }))

  return sendSuccess(res, { data: { categories: withCounts } })
})

/* GET /categories/:slug */
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).lean()
  if (!category) throw ApiError.notFound('Category not found')
  return sendSuccess(res, { data: { category } })
})

/* POST /categories (admin) */
export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body)
  return sendSuccess(res, { statusCode: 201, message: 'Category created', data: { category } })
})

/* PATCH /categories/:id (admin) */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw ApiError.notFound('Category not found')
  Object.assign(category, req.body)
  await category.save()
  return sendSuccess(res, { message: 'Category updated', data: { category } })
})

/* DELETE /categories/:id (admin) */
export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id })
  if (inUse > 0) throw ApiError.conflict(`Cannot delete: ${inUse} product(s) use this category`)
  const deleted = await Category.findByIdAndDelete(req.params.id)
  if (!deleted) throw ApiError.notFound('Category not found')
  return sendSuccess(res, { message: 'Category deleted' })
})
