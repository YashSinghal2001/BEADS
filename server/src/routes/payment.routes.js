import { Router } from 'express'
import * as ctrl from '../controllers/payment.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { verifyPaymentSchema } from '../validators/payment.validator.js'

const router = Router()

router.use(protect)

router.get('/', ctrl.paymentHistory)
router.post('/verify', validate(verifyPaymentSchema), ctrl.verifyPayment)
router.post('/:orderId/retry', ctrl.retryPayment)

export default router
