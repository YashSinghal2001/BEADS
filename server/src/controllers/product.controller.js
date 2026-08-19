import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Product } from '../models/Product.js'
import { Order } from '../models/Order.js'
import { Cart } from '../models/Cart.js'
import { Wishlist } from '../models/Wishlist.js'
import { Review } from '../models/Review.js'
import { isAdminRole } from '../middleware/rbac.middleware.js'
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
  // Admin consoles pass includeInactive=true to manage draft/deactivated
  // products; the flag is ignored for non-admin requesters.
  const includeInactive = req.query.includeInactive === 'true' && isAdminRole(req.user?.role)
  const { filter, hasText } = await buildProductFilter(req.query, { includeInactive })
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

/* DELETE /products/:id (admin) — permanently delete when nothing depends on
 * it; archive (isActive=false) when order history references the product so
 * past orders keep resolving. References in carts/wishlists/reviews are
 * cleaned up on a hard delete — all scoped to this exact product id. */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw ApiError.notFound('Product not found')

  const orderRefs = await Order.countDocuments({ 'items.product': product._id })
  if (orderRefs > 0) {
    product.isActive = false
    await product.save()
    return sendSuccess(res, {
      message: `Product archived — ${orderRefs} order(s) reference it`,
      data: { deleted: false, archived: true },
    })
  }

  await Product.deleteOne({ _id: product._id })
  await Cart.updateMany(
    { 'items.product': product._id },
    { $pull: { items: { product: product._id } } },
  )
  await Wishlist.updateMany({ products: product._id }, { $pull: { products: product._id } })
  await Review.deleteMany({ product: product._id })
  return sendSuccess(res, { message: 'Product deleted', data: { deleted: true, archived: false } })
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
