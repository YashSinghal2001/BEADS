import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { authLimiter } from '../middleware/rateLimit.middleware.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../validators/auth.validator.js'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), ctrl.register)
router.post('/login', authLimiter, validate(loginSchema), ctrl.login)
router.post('/logout', ctrl.logout)
router.post('/refresh', ctrl.refresh)
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), ctrl.verifyOtp)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), ctrl.resetPassword)

export default router
