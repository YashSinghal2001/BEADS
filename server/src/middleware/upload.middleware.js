import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

const storage = multer.memoryStorage()

function fileFilter(allowed) {
  return (req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`))
  }
}

/** Image uploads (avatars, product images) — 5 MB each. */
export const uploadImages = multer({
  storage,
  fileFilter: fileFilter(IMAGE_TYPES),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
})

/** Media uploads incl. video — 50 MB each. */
export const uploadMedia = multer({
  storage,
  fileFilter: fileFilter([...IMAGE_TYPES, ...VIDEO_TYPES]),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
})

export default uploadImages
