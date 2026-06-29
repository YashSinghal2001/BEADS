import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Product } from '../models/Product.js'
import { getPagination, buildMeta } from '../utils/pagination.js'
import {
  buildProductFilter,
  buildProductSort,
  autocomplete as acService,
  suggestions as suggestService,
} from '../services/search.service.js'

/* GET /products */
export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const { filter, hasText } = await buildProductFilter(req.query)
  const sort = buildProductSort(req.query.sort, hasText)

  const projection = hasText ? { score: { $meta: 'textScore' } } : {}

  const [items, total] = await Promise.all([
    Product.find(filter, projection)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ])

  return sendSuccess(res, {
    data: { products: items },
    meta: buildMeta({ page, limit, total }),
  })
})

/* GET /products/search/autocomplete?q= */
export const autocomplete = asyncHandler(async (req, res) => {
  const results = await acService(req.query.q || '')
  return sendSuccess(res, { data: { results } })
})

/* GET /products/search/suggestions */
export const suggestions = asyncHandler(async (req, res) => {
  const results = await suggestService()
  return sendSuccess(res, { data: { suggestions: results } })
})

/* GET /products/:slug */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .lean()
  if (!product) throw ApiError.notFound('Product not found')
  return sendSuccess(res, { data: { product } })
})

/* GET /products/:slug/related */
export const getRelated = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('category').lean()
  if (!product) throw ApiError.notFound('Product not found')
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .limit(8)
    .select('title slug images salePrice mrp averageRating totalReviews stockStatus')
    .lean()
  return sendSuccess(res, { data: { products: related } })
})

/* ------------------------------ Admin ------------------------------- */
/* POST /products (admin) */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body)
  return sendSuccess(res, { statusCode: 201, message: 'Product created', data: { product } })
})

/* PATCH /products/:id (admin) */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw ApiError.notFound('Product not found')
  Object.assign(product, req.body)
  await product.save() // triggers slug/discount/stockStatus hooks
  return sendSuccess(res, { message: 'Product updated', data: { product } })
})

/* DELETE /products/:id (admin) — soft delete */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  )
  if (!product) throw ApiError.notFound('Product not found')
  return sendSuccess(res, { message: 'Product archived' })
})

/* PATCH /products/:id/stock (admin) */
export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body
  if (typeof stock !== 'number' || stock < 0) throw ApiError.badRequest('Invalid stock value')
  const product = await Product.findById(req.params.id)
  if (!product) throw ApiError.notFound('Product not found')
  product.stock = stock
  await product.save()
  return sendSuccess(res, { message: 'Stock updated', data: { product } })
})
