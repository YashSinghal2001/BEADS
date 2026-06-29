import { Router } from 'express'
import * as content from '../controllers/content.controller.js'

const router = Router()

// Public, read-only content (active items only)
router.get('/banners', content.listPublic('banners'))
router.get('/testimonials', content.listPublic('testimonials'))
router.get('/faqs', content.listPublic('faqs'))

export default router
