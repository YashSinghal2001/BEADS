import { Router } from 'express'
import * as ctrl from '../controllers/payment.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { writeLimiter } from '../middleware/rateLimit.middleware.js'
import { verifyPaymentSchema } from '../validators/payment.validator.js'

const router = Router()

router.use(protect)

router.get('/', ctrl.paymentHistory)
router.post('/verify', writeLimiter, validate(verifyPaymentSchema), ctrl.verifyPayment)
router.post('/:orderId/retry', writeLimiter, ctrl.retryPayment)

export default router
