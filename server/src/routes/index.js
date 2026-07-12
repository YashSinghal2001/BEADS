import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import categoryRoutes from './category.routes.js'
import productRoutes from './product.routes.js'
import wishlistRoutes from './wishlist.routes.js'
import cartRoutes from './cart.routes.js'
import reviewRoutes from './review.routes.js'
import orderRoutes from './order.routes.js'
import couponRoutes from './coupon.routes.js'
import uploadRoutes from './upload.routes.js'
import analyticsRoutes from './analytics.routes.js'
import paymentRoutes from './payment.routes.js'
import webhookRoutes from './webhook.routes.js'
import adminRoutes from './admin.routes.js'
import contentRoutes from './content.routes.js'

const router = Router()

router.get('/', (req, res) =>
  res.json({
    success: true,
    message: 'YS Creations API',
    data: {
      version: '1.0.0',
      endpoints: [
        'auth', 'users', 'categories', 'products', 'wishlist',
        'cart', 'reviews', 'orders', 'payments', 'coupons',
        'uploads', 'analytics', 'webhooks', 'admin',
        'banners', 'testimonials', 'faqs',
      ],
    },
  }),
)

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/wishlist', wishlistRoutes)
router.use('/cart', cartRoutes)
router.use('/reviews', reviewRoutes)
router.use('/orders', orderRoutes)
router.use('/payments', paymentRoutes)
router.use('/coupons', couponRoutes)
router.use('/uploads', uploadRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/webhooks', webhookRoutes)
router.use('/admin', adminRoutes)
router.use('/', contentRoutes)

export default router
