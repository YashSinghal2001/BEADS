import { cloudinary } from '../config/cloudinary.js'
import { config } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

const FOLDER = 'ys-creations'

/**
 * Upload an in-memory file buffer to Cloudinary with automatic compression.
 * Throws a clear error if Cloudinary is not configured.
 */
export function uploadBuffer(buffer, { folder = FOLDER, resourceType = 'image', publicId } = {}) {
  if (!config.features.cloudinary) {
    throw ApiError.internal('Media uploads are not enabled — configure Cloudinary credentials.')
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        // sensible compression / optimisation defaults
        transformation:
          resourceType === 'image'
            ? [{ quality: 'auto:good', fetch_format: 'auto' }]
            : undefined,
      },
      (err, result) => {
        if (err) return reject(new ApiError(502, `Cloudinary upload failed: ${err.message}`))
        resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height })
      },
    )
    stream.end(buffer)
  })
}

export async function uploadMany(files = [], opts = {}) {
  return Promise.all(files.map((f) => uploadBuffer(f.buffer, opts)))
}

export async function deleteAsset(publicId, resourceType = 'image') {
  if (!config.features.cloudinary || !publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (err) {
    logger.warn(`Cloudinary delete failed for ${publicId}: ${err.message}`)
  }
}

export const isMediaEnabled = () => config.features.cloudinary
