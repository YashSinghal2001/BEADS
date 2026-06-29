import { Router } from 'express'
import * as ctrl from '../controllers/blog.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { idParam } from '../validators/common.validator.js'
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator.js'

const router = Router()

router.get('/', ctrl.listBlogs)
router.get('/admin/all', protect, isAdmin, ctrl.listAllBlogs)
router.get('/:slug', ctrl.getBlog)

// Admin
router.post('/', protect, isAdmin, validate(createBlogSchema), ctrl.createBlog)
router.patch('/:id', protect, isAdmin, validate({ params: idParam, ...updateBlogSchema }), ctrl.updateBlog)
router.delete('/:id', protect, isAdmin, validate({ params: idParam }), ctrl.deleteBlog)

export default router
