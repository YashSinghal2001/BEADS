import { Router } from 'express'
import * as ctrl from '../controllers/coupon.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { idParam } from '../validators/common.validator.js'
import { validateCouponSchema, createCouponSchema, updateCouponSchema } from '../validators/coupon.validator.js'

const router = Router()

router.post('/validate', validate(validateCouponSchema), ctrl.validateCoupon)

// Admin
router.get('/', protect, isAdmin, ctrl.listCoupons)
router.post('/', protect, isAdmin, validate(createCouponSchema), ctrl.createCoupon)
router.patch('/:id', protect, isAdmin, validate({ params: idParam, ...updateCouponSchema }), ctrl.updateCoupon)
router.delete('/:id', protect, isAdmin, validate({ params: idParam }), ctrl.deleteCoupon)

export default router
