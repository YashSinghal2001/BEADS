import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Coupon } from '../models/Coupon.js'

/* POST /coupons/validate */
export const validateCoupon = asyncHandler(async (req, res) => {
  const code = req.body.code.toUpperCase()
  const subtotal = req.body.subtotal || 0
  const coupon = await Coupon.findOne({ code })
  if (!coupon) throw ApiError.notFound('Invalid coupon code')

  const check = coupon.isValidFor(subtotal)
  if (!check.ok) throw ApiError.badRequest(check.reason)

  return sendSuccess(res, {
    message: 'Coupon is valid',
    data: {
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      discount: coupon.computeDiscount(subtotal),
      description: coupon.description,
    },
  })
})

/* GET /coupons (admin) */
export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()
  return sendSuccess(res, { data: { coupons } })
})

/* POST /coupons (admin) */
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() })
  return sendSuccess(res, { statusCode: 201, message: 'Coupon created', data: { coupon } })
})

/* PATCH /coupons/:id (admin) */
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) throw ApiError.notFound('Coupon not found')
  Object.assign(coupon, req.body)
  if (req.body.code) coupon.code = req.body.code.toUpperCase()
  await coupon.save()
  return sendSuccess(res, { message: 'Coupon updated', data: { coupon } })
})

/* DELETE /coupons/:id (admin) */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const deleted = await Coupon.findByIdAndDelete(req.params.id)
  if (!deleted) throw ApiError.notFound('Coupon not found')
  return sendSuccess(res, { message: 'Coupon deleted' })
})
