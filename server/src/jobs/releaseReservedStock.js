import { Product } from '../models/Product.js'
import { logger } from '../utils/logger.js'

/**
 * Release reserved stock for abandoned/expired checkouts.
 * Intended to run on a schedule (e.g. node-cron) in production. Exposed as a
 * function so it can be invoked by a scheduler or manually.
 */
export async function releaseReservedStock() {
  const result = await Product.updateMany(
    { reservedStock: { $gt: 0 } },
    [{ $set: { reservedStock: 0 } }],
  )
  logger.info(`Released reserved stock on ${result.modifiedCount} product(s)`)
  return result.modifiedCount
}

export default releaseReservedStock
