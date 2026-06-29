import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { requireAdmin, requirePermission } from '../middleware/rbac.middleware.js'
import { activityLog } from '../middleware/activityLog.middleware.js'
import * as admin from '../controllers/admin.controller.js'
import * as adminProduct from '../controllers/adminProduct.controller.js'
import * as customer from '../controllers/customer.controller.js'
import * as content from '../controllers/content.controller.js'
import { refundOrder } from '../controllers/payment.controller.js'

const router = Router()

// Every admin route requires an admin-capable role; mutations are audit-logged.
router.use(protect, requireAdmin, activityLog)

/* Dashboard + meta */
router.get('/me', admin.me)
router.get('/dashboard', requirePermission('dashboard.view'), admin.dashboard)
router.get('/activity', requirePermission('activity.view'), admin.activity)
router.get('/coupons/analytics', requirePermission('coupon.read'), admin.couponAnalytics)

/* Product CMS extras */
router.post('/products/:id/duplicate', requirePermission('product.write'), adminProduct.duplicateProduct)
router.patch('/products/bulk', requirePermission('product.write'), adminProduct.bulkUpdate)
router.get('/products/export', requirePermission('product.read'), adminProduct.exportCsv)
router.post('/products/import', requirePermission('product.write'), adminProduct.importCsv)

/* Customer CRM */
router.get('/customers', requirePermission('customer.read'), customer.listCustomers)
router.get('/customers/segments/summary', requirePermission('customer.read'), customer.segments)
router.get('/customers/:id', requirePermission('customer.read'), customer.getCustomer)
router.patch('/customers/:id', requirePermission('customer.write'), customer.updateCustomer)

/* Content CMS (banners | testimonials | faqs) */
router.get('/content/:resource', requirePermission('content.read'), content.listAllAny)
router.post('/content/:resource', requirePermission('content.write'), content.createAny)
router.patch('/content/:resource/:id', requirePermission('content.write'), content.updateAny)
router.delete('/content/:resource/:id', requirePermission('content.write'), content.removeAny)

/* Order refund */
router.post('/orders/:id/refund', requirePermission('order.refund'), refundOrder)

export default router
