import { Router } from 'express'
import * as ctrl from '../controllers/product.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { idParam } from '../validators/common.validator.js'
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator.js'

const router = Router()

router.get('/', validate(productQuerySchema), ctrl.listProducts)
router.get('/search/autocomplete', ctrl.autocomplete)
router.get('/search/suggestions', ctrl.suggestions)
router.get('/:slug', ctrl.getProduct)
router.get('/:slug/related', ctrl.getRelated)

// Admin
router.post('/', protect, isAdmin, validate(createProductSchema), ctrl.createProduct)
router.patch('/:id', protect, isAdmin, validate({ params: idParam, ...updateProductSchema }), ctrl.updateProduct)
router.patch('/:id/stock', protect, isAdmin, validate({ params: idParam }), ctrl.updateStock)
router.delete('/:id', protect, isAdmin, validate({ params: idParam }), ctrl.deleteProduct)

export default router
