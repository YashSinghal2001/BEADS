import { Router } from 'express'
import * as ctrl from '../controllers/review.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { writeLimiter } from '../middleware/rateLimit.middleware.js'
import { idParam } from '../validators/common.validator.js'
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator.js'

const router = Router()

router.get('/product/:productId', ctrl.getProductReviews)
router.post('/:id/helpful', validate({ params: idParam }), ctrl.markHelpful)

// Authenticated
router.post('/', protect, writeLimiter, validate(createReviewSchema), ctrl.createReview)
router.patch('/:id', protect, validate({ params: idParam, ...updateReviewSchema }), ctrl.updateReview)
router.delete('/:id', protect, validate({ params: idParam }), ctrl.deleteReview)

// Admin
router.get('/', protect, isAdmin, ctrl.listAllReviews)
router.patch('/:id/moderate', protect, isAdmin, validate({ params: idParam }), ctrl.moderateReview)

export default router
