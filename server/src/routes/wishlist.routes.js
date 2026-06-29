import { Router } from 'express'
import * as ctrl from '../controllers/wishlist.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { z } from 'zod'
import { objectId } from '../validators/common.validator.js'

const router = Router()
const productParam = { params: z.object({ productId: objectId }) }

router.use(protect)

router.get('/', ctrl.getWishlist)
router.post('/:productId', validate(productParam), ctrl.addToWishlist)
router.delete('/:productId', validate(productParam), ctrl.removeFromWishlist)
router.delete('/', ctrl.clearWishlist)

export default router
