import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'

/* GET /users/profile */
export const getProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: { user: req.user.toSafeJSON() } })
})

/* PATCH /users/profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body
  const user = await User.findById(req.user._id)
  if (name !== undefined) user.name = name
  if (phone !== undefined) user.phone = phone
  if (avatar !== undefined) user.avatar = avatar
  await user.save()
  return sendSuccess(res, { message: 'Profile updated', data: { user: user.toSafeJSON() } })
})

/* PATCH /users/password */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select('+password +refreshTokens')
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect')
  }
  user.password = newPassword
  user.refreshTokens = [] // force re-auth on other devices
  await user.save()
  return sendSuccess(res, { message: 'Password changed successfully' })
})

/* --------------------------- Addresses ------------------------------ */
/* GET /users/addresses */
export const listAddresses = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: { addresses: req.user.addresses } })
})

/* POST /users/addresses */
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const address = req.body
  if (address.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => (a.isDefault = false))
    address.isDefault = true
  }
  user.addresses.push(address)
  await user.save()
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Address added',
    data: { addresses: user.addresses },
  })
})

/* PATCH /users/addresses/:addressId */
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const addr = user.addresses.id(req.params.addressId)
  if (!addr) throw ApiError.notFound('Address not found')

  Object.assign(addr, req.body)
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = a._id.equals(addr._id)))
  }
  await user.save()
  return sendSuccess(res, { message: 'Address updated', data: { addresses: user.addresses } })
})

/* DELETE /users/addresses/:addressId */
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const addr = user.addresses.id(req.params.addressId)
  if (!addr) throw ApiError.notFound('Address not found')
  const wasDefault = addr.isDefault
  addr.deleteOne()
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true
  await user.save()
  return sendSuccess(res, { message: 'Address removed', data: { addresses: user.addresses } })
})

/* ------------------------- Notifications ---------------------------- */
/* GET /users/notifications */
export const listNotifications = asyncHandler(async (req, res) => {
  const sorted = [...req.user.notifications].sort((a, b) => b.createdAt - a.createdAt)
  return sendSuccess(res, { data: { notifications: sorted } })
})

/* PATCH /users/notifications/read */
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  user.notifications.forEach((n) => (n.read = true))
  await user.save()
  return sendSuccess(res, { message: 'Notifications marked as read' })
})
