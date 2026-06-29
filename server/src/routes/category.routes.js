import { Router } from 'express'
import * as ctrl from '../controllers/category.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { idParam } from '../validators/common.validator.js'
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js'

const router = Router()

router.get('/', ctrl.listCategories)
router.get('/:slug', ctrl.getCategory)

// Admin
router.post('/', protect, isAdmin, validate(createCategorySchema), ctrl.createCategory)
router.patch('/:id', protect, isAdmin, validate({ params: idParam, ...updateCategorySchema }), ctrl.updateCategory)
router.delete('/:id', protect, isAdmin, validate({ params: idParam }), ctrl.deleteCategory)

export default router
