import { Router } from 'express'
import * as ctrl from '../controllers/upload.controller.js'
import { protect, isAdmin } from '../middleware/auth.middleware.js'
import { uploadImages, uploadMedia } from '../middleware/upload.middleware.js'

const router = Router()

router.get('/status', ctrl.uploadStatus)
router.post('/avatar', protect, uploadImages.single('avatar'), ctrl.uploadAvatar)
router.post('/images', protect, isAdmin, uploadImages.array('images', 8), ctrl.uploadProductImages)
router.post('/video', protect, isAdmin, uploadMedia.single('video'), ctrl.uploadProductVideo)

export default router
