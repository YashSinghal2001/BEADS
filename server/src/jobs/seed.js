import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { User } from '../models/User.js'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { Coupon } from '../models/Coupon.js'
import { categories, buildProducts, coupons } from './seedData.js'

const destroyOnly = process.argv.includes('--destroy')

async function clearAll() {
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Coupon.deleteMany({}),
    User.deleteMany({ role: { $ne: 'admin' } }),
  ])
  logger.info('Cleared products, categories, coupons and non-admin users')
}

async function seed() {
  await connectDB()

  if (destroyOnly) {
    await clearAll()
    await User.deleteMany({})
    logger.info('Database emptied')
    return
  }

  await clearAll()

  // Admin
  const adminExists = await User.findOne({ email: config.SEED_ADMIN_EMAIL })
  if (!adminExists) {
    await User.create({
      name: 'YS Admin',
      email: config.SEED_ADMIN_EMAIL,
      password: config.SEED_ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
    })
    logger.info(`Admin created: ${config.SEED_ADMIN_EMAIL}`)
  }

  // Categories
  const createdCategories = await Category.create(categories)
  const categoryMap = createdCategories.reduce((acc, c) => ({ ...acc, [c.name]: c._id }), {})
  logger.info(`Inserted ${createdCategories.length} categories`)

  // Products
  const products = buildProducts(categoryMap)
  const createdProducts = await Product.create(products)
  logger.info(`Inserted ${createdProducts.length} products`)

  // Coupons
  await Coupon.create(coupons)
  logger.info(`Inserted ${coupons.length} coupons`)

  logger.info('✅ Seed complete')
}

seed()
  .catch((err) => {
    logger.error(`Seed failed: ${err.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDB()
    await mongoose.connection.close().catch(() => {})
    process.exit(process.exitCode || 0)
  })
