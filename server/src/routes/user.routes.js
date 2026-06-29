import { Router } from 'express'
import * as ctrl from '../controllers/user.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
} from '../validators/user.validator.js'

const router = Router()

router.use(protect)

router.get('/profile', ctrl.getProfile)
router.patch('/profile', validate(updateProfileSchema), ctrl.updateProfile)
router.patch('/password', validate(changePasswordSchema), ctrl.changePassword)

router.get('/addresses', ctrl.listAddresses)
router.post('/addresses', validate(addressSchema), ctrl.addAddress)
router.patch('/addresses/:addressId', ctrl.updateAddress)
router.delete('/addresses/:addressId', ctrl.deleteAddress)

router.get('/notifications', ctrl.listNotifications)
router.patch('/notifications/read', ctrl.markNotificationsRead)

export default router
