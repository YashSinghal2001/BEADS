import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { Order } from '../models/Order.js'
import { getPagination, buildMeta } from '../utils/pagination.js'

/* GET /admin/customers */
export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const filter = {}
  if (req.query.role) filter.role = req.query.role
  if (req.query.wholesale === 'true') filter.isWholesale = true
  if (req.query.blocked === 'true') filter.isBlocked = true
  if (req.query.q) {
    const rx = new RegExp(req.query.q, 'i')
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }]
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('name email phone role isWholesale wholesaleTier isBlocked loyaltyPoints createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ])

  // attach spend + order count per user
  const ids = users.map((u) => u._id)
  const spend = await Order.aggregate([
    { $match: { user: { $in: ids }, orderStatus: { $nin: ['cancelled'] } } },
    { $group: { _id: '$user', total: { $sum: '$total' }, orders: { $sum: 1 } } },
  ])
  const spendMap = spend.reduce((a, s) => ({ ...a, [s._id]: s }), {})
  const customers = users.map((u) => ({
    ...u,
    totalSpend: spendMap[u._id]?.total || 0,
    orderCount: spendMap[u._id]?.orders || 0,
  }))

  return sendSuccess(res, { data: { customers }, meta: buildMeta({ page, limit, total }) })
})

/* GET /admin/customers/:id */
export const getCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens -otpHash -resetTokenHash').lean()
  if (!user) throw ApiError.notFound('Customer not found')

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean()
  const [clv] = await Order.aggregate([
    { $match: { user: user._id, orderStatus: { $nin: ['cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$total' }, orders: { $sum: 1 }, avg: { $avg: '$total' } } },
  ])

  return sendSuccess(res, {
    data: {
      customer: user,
      orders,
      stats: {
        lifetimeValue: clv?.total || 0,
        orderCount: clv?.orders || 0,
        averageOrderValue: clv ? Math.round(clv.avg) : 0,
      },
    },
  })
})

/* PATCH /admin/customers/:id */
export const updateCustomer = asyncHandler(async (req, res) => {
  const { role, isBlocked, isWholesale, wholesaleTier, tags, addNote, businessName, gstin } = req.body
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('Customer not found')

  if (role !== undefined) {
    // only super_admin can grant admin-level roles
    if (['admin', 'super_admin'].includes(role) && req.user.role !== 'super_admin') {
      throw ApiError.forbidden('Only a super admin can assign admin roles')
    }
    user.role = role
  }
  if (isBlocked !== undefined) user.isBlocked = isBlocked
  if (isWholesale !== undefined) user.isWholesale = isWholesale
  if (wholesaleTier !== undefined) user.wholesaleTier = wholesaleTier
  if (businessName !== undefined) user.businessName = businessName
  if (gstin !== undefined) user.gstin = gstin
  if (Array.isArray(tags)) user.tags = tags
  if (addNote) user.adminNotes.push({ note: addNote, by: req.user.name })

  await user.save()
  return sendSuccess(res, { message: 'Customer updated', data: { customer: user.toSafeJSON() } })
})

/* GET /admin/customers/segments/summary */
export const segments = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  const [total, wholesale, blocked, newThisMonth, repeat] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ isWholesale: true }),
    User.countDocuments({ isBlocked: true }),
    User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } }),
    Order.aggregate([
      { $group: { _id: '$user', orders: { $sum: 1 } } },
      { $match: { orders: { $gt: 1 } } },
      { $count: 'count' },
    ]),
  ])
  const topSpenders = await Order.aggregate([
    { $match: { orderStatus: { $nin: ['cancelled'] } } },
    { $group: { _id: '$user', total: { $sum: '$total' } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $project: { total: 1, name: { $arrayElemAt: ['$user.name', 0] }, email: { $arrayElemAt: ['$user.email', 0] } } },
  ])
  return sendSuccess(res, {
    data: { total, wholesale, blocked, newThisMonth, repeatCustomers: repeat[0]?.count || 0, topSpenders },
  })
})
