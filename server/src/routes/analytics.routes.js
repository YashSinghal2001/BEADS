import { Router } from 'express'
import * as ctrl from '../controllers/analytics.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'

const router = Router()

router.use(protect, isAdmin)

router.get('/overview', ctrl.overview)
router.get('/revenue', ctrl.revenue)
router.get('/top-products', ctrl.topProducts)
router.get('/low-stock', ctrl.lowStock)
router.get('/payments', ctrl.payments)
router.get('/funnel', ctrl.funnel)
router.get('/clv', ctrl.clv)
router.get('/shipping', ctrl.shipping)

export default router
