import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Wishlist } from '../models/Wishlist.js'
import { Product } from '../models/Product.js'

async function getOrCreate(userId) {
  let wishlist = await Wishlist.findOne({ user: userId })
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] })
  return wishlist
}

/* GET /wishlist */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id)
  await wishlist.populate({
    path: 'products',
    select: 'title slug images salePrice mrp averageRating totalReviews stockStatus',
  })
  return sendSuccess(res, { data: { products: wishlist.products } })
})

/* POST /wishlist/:productId */
export const addToWishlist = asyncHandler(async (req, res) => {
  const exists = await Product.exists({ _id: req.params.productId })
  if (!exists) throw ApiError.notFound('Product not found')

  const wishlist = await getOrCreate(req.user._id)
  if (!wishlist.products.some((p) => p.equals(req.params.productId))) {
    wishlist.products.unshift(req.params.productId)
    await wishlist.save()
  }
  return sendSuccess(res, { message: 'Added to wishlist', data: { count: wishlist.products.length } })
})

/* DELETE /wishlist/:productId */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id)
  wishlist.products = wishlist.products.filter((p) => !p.equals(req.params.productId))
  await wishlist.save()
  return sendSuccess(res, { message: 'Removed from wishlist', data: { count: wishlist.products.length } })
})

/* DELETE /wishlist */
export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreate(req.user._id)
  wishlist.products = []
  await wishlist.save()
  return sendSuccess(res, { message: 'Wishlist cleared' })
})
