import { Router } from 'express'
import * as ctrl from '../controllers/cart.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from '../validators/cart.validator.js'

const router = Router()

router.use(protect)

router.get('/', ctrl.getCart)
router.post('/', validate(addToCartSchema), ctrl.addToCart)
router.patch('/items/:itemId', validate(updateCartItemSchema), ctrl.updateCartItem)
router.delete('/items/:itemId', ctrl.removeCartItem)
router.delete('/', ctrl.clearCart)
router.post('/coupon', validate(applyCouponSchema), ctrl.applyCoupon)
router.delete('/coupon', ctrl.removeCoupon)

export default router
