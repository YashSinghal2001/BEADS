import { Router } from 'express'
import * as ctrl from '../controllers/webhook.controller.js'

const router = Router()

// Gateways authenticate via signature/token (verified inside the controller),
// so these endpoints are intentionally unauthenticated.
router.post('/razorpay', ctrl.razorpayWebhook)
router.post('/shiprocket', ctrl.shiprocketWebhook)

export default router
