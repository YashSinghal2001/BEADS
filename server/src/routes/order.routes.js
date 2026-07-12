import { Router } from 'express'
import * as ctrl from '../controllers/order.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { writeLimiter } from '../middleware/rateLimit.middleware.js'
import { idParam } from '../validators/common.validator.js'
import {
  createOrderSchema,
  cancelOrderSchema,
  returnOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator.js'

const router = Router()

router.use(protect)

// Admin (declared before '/:id' to avoid route shadowing)
router.get('/admin/all', isAdmin, ctrl.listAllOrders)
router.patch('/:id/status', isAdmin, validate(updateOrderStatusSchema), ctrl.updateOrderStatus)
router.post('/:id/ship', isAdmin, validate({ params: idParam }), ctrl.createShipment)
router.get('/:id/label', isAdmin, validate({ params: idParam }), ctrl.downloadLabel)

// User
router.post('/', writeLimiter, validate(createOrderSchema), ctrl.createOrder)
router.get('/', ctrl.getUserOrders)
router.get('/:id', validate({ params: idParam }), ctrl.getOrder)
router.get('/:id/invoice', validate({ params: idParam }), ctrl.downloadInvoice)
router.post('/:id/reorder', validate({ params: idParam }), ctrl.reorder)
router.patch('/:id/cancel', validate({ params: idParam, ...cancelOrderSchema }), ctrl.cancelOrder)
router.patch('/:id/return', validate({ params: idParam, ...returnOrderSchema }), ctrl.returnOrder)

export default router
