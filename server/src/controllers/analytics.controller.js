import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
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

/* GET /analytics/overview (admin) */
export const overview = asyncHandler(async (req, res) => {
  const [stats, ordersByStatus, payments, funnel, clv] = await Promise.all([
    getOverview(),
    getOrdersByStatus(),
    getPaymentStats(),
    getCheckoutFunnel(),
    getCustomerLifetimeValue(),
  ])
  return sendSuccess(res, {
    data: {
      ...stats,
      ordersByStatus,
      paymentSuccessRate: payments.successRate,
      checkoutAbandonmentRate: funnel.abandonmentRate,
      customerLifetimeValue: clv.averageLifetimeValue,
    },
  })
})

/* GET /analytics/revenue?months=12 (admin) */
export const revenue = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, parseInt(req.query.months, 10) || 12))
  const monthly = await getMonthlyRevenue(months)
  return sendSuccess(res, { data: { monthly } })
})

/* GET /analytics/top-products (admin) */
export const topProducts = asyncHandler(async (req, res) => {
  const products = await getTopProducts(Number(req.query.limit) || 8)
  return sendSuccess(res, { data: { products } })
})

/* GET /analytics/low-stock (admin) */
export const lowStock = asyncHandler(async (req, res) => {
  const products = await getLowStockProducts(Number(req.query.limit) || 20)
  return sendSuccess(res, { data: { products } })
})

/* GET /analytics/payments (admin) */
export const payments = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: await getPaymentStats() })
})

/* GET /analytics/funnel (admin) */
export const funnel = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: await getCheckoutFunnel() })
})

/* GET /analytics/clv (admin) */
export const clv = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: await getCustomerLifetimeValue() })
})

/* GET /analytics/shipping (admin) */
export const shipping = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: await getShippingPerformance() })
})
