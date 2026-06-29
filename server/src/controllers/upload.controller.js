import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadBuffer, uploadMany, isMediaEnabled } from '../services/cloudinary.service.js'
import { User } from '../models/User.js'

/* POST /uploads/avatar (auth) */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image provided')
  const result = await uploadBuffer(req.file.buffer, { folder: 'ys-creations/avatars' })
  await User.findByIdAndUpdate(req.user._id, { avatar: { url: result.url, publicId: result.publicId } })
  return sendSuccess(res, { message: 'Avatar updated', data: { avatar: result } })
})

/* POST /uploads/images (admin) — product images */
export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No images provided')
  const results = await uploadMany(req.files, { folder: 'ys-creations/products' })
  return sendSuccess(res, { message: 'Images uploaded', data: { images: results } })
})

/* POST /uploads/video (admin) — product video */
export const uploadProductVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No video provided')
  const result = await uploadBuffer(req.file.buffer, {
    folder: 'ys-creations/videos',
    resourceType: 'video',
  })
  return sendSuccess(res, { message: 'Video uploaded', data: { video: result } })
})

/* GET /uploads/status */
export const uploadStatus = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: { enabled: isMediaEnabled() } })
})
