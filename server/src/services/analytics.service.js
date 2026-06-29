import { Order } from '../models/Order.js'
import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { Payment } from '../models/Payment.js'
import { Cart } from '../models/Cart.js'

const PAID_MATCH = { paymentStatus: 'paid' }
const REVENUE_STATUSES = ['confirmed', 'processing', 'packed', 'shipped', 'delivered']

/** Headline numbers for the admin dashboard. */
export async function getOverview() {
  const [revenueAgg, orderCount, userCount, productCount, pendingCount] = await Promise.all([
    Order.aggregate([
      { $match: { orderStatus: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
  ])

  const totalRevenue = revenueAgg[0]?.total || 0
  const paidOrders = revenueAgg[0]?.count || 0
  const conversionRate = userCount > 0 ? Math.round((paidOrders / userCount) * 1000) / 10 : 0
  const avgOrderValue = paidOrders > 0 ? Math.round(totalRevenue / paidOrders) : 0

  return {
    totalRevenue,
    totalOrders: orderCount,
    totalUsers: userCount,
    totalProducts: productCount,
    pendingOrders: pendingCount,
    avgOrderValue,
    conversionRate,
  }
}

/** Revenue grouped by month for the last `months` months. */
export async function getMonthlyRevenue(months = 12) {
  const since = new Date()
  since.setMonth(since.getMonth() - (months - 1))
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, orderStatus: { $in: REVENUE_STATUSES } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ])

  return rows.map((r) => ({
    month: `${r._id.y}-${String(r._id.m).padStart(2, '0')}`,
    revenue: r.revenue,
    orders: r.orders,
  }))
}

/** Top-selling products by soldCount (optionally by revenue). */
export async function getTopProducts(limit = 8) {
  return Product.find({})
    .sort({ soldCount: -1 })
    .limit(limit)
    .select('title slug images salePrice soldCount averageRating stock')
    .lean()
}

/** Products at or below their low-stock threshold. */
export async function getLowStockProducts(limit = 20) {
  return Product.find({ stockStatus: { $in: ['low_stock', 'out_of_stock'] } })
    .sort({ stock: 1 })
    .limit(limit)
    .select('title slug stock reservedStock lowStockThreshold stockStatus')
    .lean()
}

/** Order counts grouped by status. */
export async function getOrdersByStatus() {
  const rows = await Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }])
  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {})
}

export { PAID_MATCH }

/* ---------------------- Payment success rate ------------------------- */
export async function getPaymentStats() {
  const rows = await Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  const byStatus = rows.reduce((a, r) => ({ ...a, [r._id]: r.count }), {})
  const captured = byStatus.captured || 0
  const failed = byStatus.failed || 0
  const attempted = captured + failed
  return {
    byStatus,
    successRate: attempted > 0 ? Math.round((captured / attempted) * 1000) / 10 : 0,
  }
}

/* ----------------------- Checkout abandonment ------------------------ */
export async function getCheckoutFunnel() {
  const [activeCarts, paidOrders] = await Promise.all([
    Cart.countDocuments({ 'items.0': { $exists: true } }),
    Order.countDocuments({ paymentStatus: 'paid' }),
  ])
  const started = activeCarts + paidOrders
  const abandonmentRate = started > 0 ? Math.round((activeCarts / started) * 1000) / 10 : 0
  return { activeCarts, paidOrders, abandonmentRate }
}

/* ------------------ Customer lifetime value (avg) -------------------- */
export async function getCustomerLifetimeValue() {
  const [agg] = await Order.aggregate([
    { $match: { orderStatus: { $in: REVENUE_STATUSES } } },
    { $group: { _id: '$user', spend: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $group: { _id: null, avgClv: { $avg: '$spend' }, avgOrders: { $avg: '$orders' }, customers: { $sum: 1 } } },
  ])
  return {
    averageLifetimeValue: agg ? Math.round(agg.avgClv) : 0,
    averageOrdersPerCustomer: agg ? Math.round(agg.avgOrders * 10) / 10 : 0,
    payingCustomers: agg ? agg.customers : 0,
  }
}

/* --------------------- Shipping performance -------------------------- */
export async function getShippingPerformance() {
  const orders = await Order.find({ orderStatus: { $in: ['delivered'] } })
    .select('timeline')
    .lean()
  let totalDays = 0
  let counted = 0
  for (const o of orders) {
    const shipped = o.timeline?.find((t) => t.status === 'shipped')?.at
    const delivered = o.timeline?.find((t) => t.status === 'delivered')?.at
    if (shipped && delivered) {
      totalDays += (new Date(delivered) - new Date(shipped)) / 86400000
      counted += 1
    }
  }
  return {
    deliveredOrders: orders.length,
    avgDeliveryDays: counted > 0 ? Math.round((totalDays / counted) * 10) / 10 : null,
  }
}
