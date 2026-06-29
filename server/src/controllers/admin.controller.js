import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { AdminActivity } from '../models/AdminActivity.js'
import { Coupon } from '../models/Coupon.js'
import { Order } from '../models/Order.js'
import { getPagination, buildMeta } from '../utils/pagination.js'
import { permissionsFor } from '../middleware/rbac.middleware.js'
import {
  getOverview,
  getMonthlyRevenue,
  getTopProducts,
  getLowStockProducts,
  getOrdersByStatus,
  getPaymentStats,
  getCheckoutFunnel,
  getCustomerLifetimeValue,
  getShippingPerformance,
} from '../services/analytics.service.js'

/* GET /admin/dashboard — one consolidated payload for the admin home */
export const dashboard = asyncHandler(async (req, res) => {
  const [overview, monthly, top, lowStock, ordersByStatus, payments, funnel, clv, shippingPerf] = await Promise.all([
    getOverview(),
    getMonthlyRevenue(12),
    getTopProducts(6),
    getLowStockProducts(10),
    getOrdersByStatus(),
    getPaymentStats(),
    getCheckoutFunnel(),
    getCustomerLifetimeValue(),
    getShippingPerformance(),
  ])
  const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(8).lean()

  return sendSuccess(res, {
    data: {
      overview: {
        ...overview,
        paymentSuccessRate: payments.successRate,
        checkoutAbandonmentRate: funnel.abandonmentRate,
        customerLifetimeValue: clv.averageLifetimeValue,
        avgDeliveryDays: shippingPerf.avgDeliveryDays,
      },
      monthlyRevenue: monthly,
      topProducts: top,
      lowStock,
      ordersByStatus,
      recentOrders,
    },
  })
})

/* GET /admin/activity */
export const activity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 30 })
  const [items, total] = await Promise.all([
    AdminActivity.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminActivity.countDocuments(),
  ])
  return sendSuccess(res, { data: { activity: items }, meta: buildMeta({ page, limit, total }) })
})

/* GET /admin/me — the signed-in admin + resolved permissions */
export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    data: { user: req.user.toSafeJSON(), permissions: permissionsFor(req.user) },
  })
})

/* GET /admin/coupons/analytics — usage stats */
export const couponAnalytics = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().lean()
  const data = coupons.map((c) => ({
    code: c.code,
    type: c.type,
    amount: c.amount,
    used: c.usedCount,
    limit: c.usageLimit,
    active: c.active,
    expiryDate: c.expiryDate,
    utilisation: c.usageLimit ? Math.round((c.usedCount / c.usageLimit) * 100) : null,
  }))
  return sendSuccess(res, { data: { coupons: data } })
})
