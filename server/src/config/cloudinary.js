import { v2 as cloudinary } from 'cloudinary'
import { config } from './env.js'
import { logger } from '../utils/logger.js'

/**
 * Configure Cloudinary only when credentials are present.
 * `config.features.cloudinary` gates all upload behaviour elsewhere.
 */
if (config.features.cloudinary) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_NAME,
    api_key: config.CLOUDINARY_KEY,
    api_secret: config.CLOUDINARY_SECRET,
    secure: true,
  })
  logger.info('Cloudinary configured')
} else {
  logger.warn('Cloudinary not configured — media uploads run in local/no-op mode')
}

export { cloudinary }
export default cloudinary
