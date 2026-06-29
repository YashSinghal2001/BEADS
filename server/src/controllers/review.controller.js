import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Review } from '../models/Review.js'
import { Order } from '../models/Order.js'
import { getPagination, buildMeta } from '../utils/pagination.js'

/* GET /reviews/product/:productId */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const filter = { product: req.params.productId, status: 'approved' }
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('user', 'name avatar').sort({ helpfulCount: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ])
  return sendSuccess(res, { data: { reviews }, meta: buildMeta({ page, limit, total }) })
})

/* POST /reviews */
export const createReview = asyncHandler(async (req, res) => {
  const { product, rating, title, comment, images } = req.body

  if (await Review.exists({ user: req.user._id, product })) {
    throw ApiError.conflict('You have already reviewed this product')
  }

  // verified purchase = the user has a delivered order containing this product
  const verifiedPurchase = await Order.exists({
    user: req.user._id,
    'items.product': product,
    orderStatus: { $in: ['delivered', 'shipped'] },
  })

  const review = await Review.create({
    user: req.user._id,
    product,
    rating,
    title,
    comment,
    images,
    verifiedPurchase: Boolean(verifiedPurchase),
  })

  return sendSuccess(res, { statusCode: 201, message: 'Review posted', data: { review } })
})

/* PATCH /reviews/:id */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) throw ApiError.notFound('Review not found')
  if (!review.user.equals(req.user._id)) throw ApiError.forbidden('You can only edit your own review')

  Object.assign(review, req.body)
  await review.save()
  return sendSuccess(res, { message: 'Review updated', data: { review } })
})

/* DELETE /reviews/:id */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) throw ApiError.notFound('Review not found')
  const isOwner = review.user.equals(req.user._id)
  if (!isOwner && req.user.role !== 'admin') throw ApiError.forbidden('Not allowed')

  await Review.findOneAndDelete({ _id: review._id })
  return sendSuccess(res, { message: 'Review deleted' })
})

/* POST /reviews/:id/helpful */
export const markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpfulCount: 1 } },
    { new: true },
  )
  if (!review) throw ApiError.notFound('Review not found')
  return sendSuccess(res, { message: 'Thanks for your feedback', data: { helpfulCount: review.helpfulCount } })
})

/* ------------------------------ Admin ------------------------------- */
/* GET /reviews (admin) */
export const listAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const filter = req.query.status ? { status: req.query.status } : {}
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('user', 'name email').populate('product', 'title slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ])
  return sendSuccess(res, { data: { reviews }, meta: buildMeta({ page, limit, total }) })
})

/* PATCH /reviews/:id/moderate (admin) */
export const moderateReview = asyncHandler(async (req, res) => {
  const { status, adminReply } = req.body
  const review = await Review.findById(req.params.id)
  if (!review) throw ApiError.notFound('Review not found')
  if (status) review.status = status
  if (adminReply !== undefined) review.adminReply = adminReply
  await review.save()
  await Review.recalcProduct(review.product)
  return sendSuccess(res, { message: 'Review updated', data: { review } })
})
