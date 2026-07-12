import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Cart } from '../models/Cart.js'
import { Coupon } from '../models/Coupon.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { Payment } from '../models/Payment.js'
import { computeTotals } from '../services/pricing.service.js'
import { createPaymentOrder } from '../services/payment.service.js'
import * as inventory from '../services/inventory.service.js'
import { transitionOrder } from '../services/order.service.js'
import * as shipping from '../services/shipping.service.js'
import { generateInvoice, generateLabel, generatePackingSlip } from '../services/document.service.js'
import { getPagination, buildMeta } from '../utils/pagination.js'

function unitPrice(product, variant) {
  if (variant?.sku) {
    const v = product.variants?.find((x) => x.sku === variant.sku)
    if (v && v.price != null) return v.price
  }
  return product.salePrice
}

/* POST /orders — reserve stock → create order → (COD commit | Razorpay pending) */
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, billingAddress, paymentMethod = 'cod', notes, giftMessage } = req.body

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product')
  const items = (cart?.items || []).filter((it) => it.product)
  if (items.length === 0) throw ApiError.badRequest('Your cart is empty')

  const orderItems = []
  for (const it of items) {
    const p = it.product
    if (!p.isActive) throw ApiError.badRequest(`${p.title} is no longer available`)
    orderItems.push({
      product: p._id,
      quantity: it.quantity,
      title: p.title,
      image: p.images?.[0]?.url || '',
      sku: it.variant?.sku || p.sku,
      variant: { color: it.variant?.color || '', size: it.variant?.size || '' },
      price: unitPrice(p, it.variant),
    })
  }

  // 1) Reserve stock atomically (throws 400 if insufficient)
  await inventory.reserveMany(orderItems)

  // 2) Coupon + totals — the usedCount increment happens here, atomically
  // guarded by usageLimit, so two concurrent checkouts can never both claim
  // the last use of a single-use coupon (previously a plain findByIdAndUpdate
  // after order creation, which was a TOCTOU race).
  let couponDoc = null
  if (cart.coupon?.code) {
    const candidate = await Coupon.findOne({ code: cart.coupon.code })
    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
    if (candidate && candidate.isValidFor(subtotal).ok) {
      const withinPerUserLimit =
        candidate.perUserLimit == null ||
        (await Order.countDocuments({ user: req.user._id, couponCode: candidate.code })) < candidate.perUserLimit
      if (withinPerUserLimit) {
        couponDoc = await Coupon.findOneAndUpdate(
          {
            _id: candidate._id,
            $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
          },
          { $inc: { usedCount: 1 } },
          { new: true },
        )
      }
    }
  }
  const totals = computeTotals(orderItems.map((i) => ({ price: i.price, quantity: i.quantity })), couponDoc)

  // Snapshot so a failure partway through checkout can restore the cart
  // instead of leaving it silently emptied with no order to show for it.
  const originalCartItems = cart.items
  const originalCartCoupon = cart.coupon
  let order = null
  let payment = null
  let cartCleared = false
  let inventoryCommitted = false

  try {
    // 3) Create order (reserved, pending)
    order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      customerEmail: req.user.email,
      ...totals,
      couponCode: couponDoc?.code || null,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      inventoryReserved: true,
      notes: notes || '',
      giftMessage: giftMessage || '',
    })

    // 4) Create the payment record
    payment = await Payment.create({
      user: req.user._id,
      order: order._id,
      amount: totals.total,
      gateway: paymentMethod === 'cod' ? 'cod' : 'razorpay',
      paymentMethod: paymentMethod === 'cod' ? 'cod' : null,
      status: paymentMethod === 'cod' ? 'pending' : 'created',
    })
    order.payment = payment._id

    // common post-order bookkeeping
    cart.items = []
    cart.coupon = { code: null, type: null, amount: 0 }
    await cart.save()
    cartCleared = true
    await User.findByIdAndUpdate(req.user._id, {
      $push: { notifications: { type: 'order', title: 'Order placed', body: `Order ${order.orderNumber} received.` } },
    })

    let paymentPayload = { method: paymentMethod }

    if (paymentMethod === 'cod') {
      // 5a) COD → commit inventory + confirm immediately
      await inventory.commitMany(orderItems)
      inventoryCommitted = true
      order.inventoryCommitted = true
      await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: Math.floor(totals.total / 100) } })
      await transitionOrder(order, 'confirmed', { note: 'Order confirmed (COD)', by: 'system' })
    } else {
      // 5b) Razorpay → create gateway order; inventory stays reserved until payment verified
      const gw = await createPaymentOrder({ amount: totals.total, receipt: order.orderNumber })
      payment.gatewayOrderId = gw.orderId
      payment.status = 'pending'
      await payment.save()
      await order.save()
      paymentPayload = {
        method: 'razorpay',
        keyId: gw.keyId,
        gatewayOrderId: gw.orderId,
        amount: gw.amount,
        currency: gw.currency,
        orderId: order._id,
        orderNumber: order.orderNumber,
      }
    }

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Order placed successfully',
      data: { order, payment: paymentPayload },
    })
  } catch (err) {
    // Compensating rollback — there's no multi-document transaction here (the
    // target deployment's replica-set support isn't guaranteed), so any
    // failure after reserving unwinds everything by hand instead of leaving
    // an orphaned order/payment or a silently-emptied cart.
    if (inventoryCommitted) {
      // Stock was already deducted (not just reserved) — reverse the commit,
      // same as a customer-initiated cancellation would.
      await Promise.all(
        orderItems.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, soldCount: -i.quantity } })),
      ).catch(() => {})
    } else {
      await inventory.releaseMany(orderItems).catch(() => {})
    }
    if (couponDoc) await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: -1 } }).catch(() => {})
    if (payment) await Payment.deleteOne({ _id: payment._id }).catch(() => {})
    if (order) await Order.deleteOne({ _id: order._id }).catch(() => {})
    if (cartCleared) {
      await Cart.updateOne(
        { _id: cart._id },
        { $set: { items: originalCartItems, coupon: originalCartCoupon } },
      ).catch(() => {})
    }
    throw err
  }
})

/* GET /orders */
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const filter = { user: req.user._id }
  if (req.query.status) filter.orderStatus = req.query.status
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ])
  return sendSuccess(res, { data: { orders }, meta: buildMeta({ page, limit, total }) })
})

/* GET /orders/:id */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('payment').lean()
  if (!order) throw ApiError.notFound('Order not found')
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not allowed')
  }
  return sendSuccess(res, { data: { order } })
})

/* PATCH /orders/:id/cancel */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  if (!order.user.equals(req.user._id)) throw ApiError.forbidden('Not allowed')
  if (!['pending', 'confirmed', 'processing', 'paid'].includes(order.orderStatus)) {
    throw ApiError.badRequest('This order can no longer be cancelled')
  }

  // return stock: committed → restock; only-reserved → release
  if (order.inventoryCommitted) {
    await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, soldCount: -i.quantity } })))
  } else if (order.inventoryReserved) {
    await inventory.releaseMany(order.items)
  }
  order.inventoryReserved = false
  order.cancelledReason = req.body.reason || 'Cancelled by customer'
  await transitionOrder(order, 'cancelled', { note: order.cancelledReason, by: 'customer' })

  return sendSuccess(res, { message: 'Order cancelled', data: { order } })
})

/* PATCH /orders/:id/return */
export const returnOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  if (!order.user.equals(req.user._id)) throw ApiError.forbidden('Not allowed')
  if (order.orderStatus !== 'delivered') throw ApiError.badRequest('Only delivered orders can be returned')

  order.returnReason = req.body.reason
  await transitionOrder(order, 'returned', { note: req.body.reason, by: 'customer' })
  return sendSuccess(res, { message: 'Return requested', data: { order } })
})

/* POST /orders/:id/reorder — re-add the order's items to the cart */
export const reorder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) throw ApiError.notFound('Order not found')
  if (String(order.user) !== String(req.user._id)) throw ApiError.forbidden('Not allowed')

  let cart = await Cart.findOne({ user: req.user._id })
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] })

  let added = 0
  for (const it of order.items) {
    // eslint-disable-next-line no-await-in-loop
    const p = await Product.findById(it.product)
    if (!p || !p.isActive || p.availableStock < it.quantity) continue
    cart.items.push({
      product: it.product,
      variant: it.variant,
      quantity: it.quantity,
      priceAtAdd: p.salePrice,
    })
    added += 1
  }
  await cart.save()
  return sendSuccess(res, { message: `${added} item(s) added to cart`, data: { added } })
})

/* GET /orders/:id/invoice — streams a PDF tax invoice */
export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('payment')
  if (!order) throw ApiError.notFound('Order not found')
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not allowed')
  }
  const pdf = await generateInvoice(order, { user: req.user, payment: order.payment })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`)
  res.send(pdf)
})

/* ------------------------------ Admin ------------------------------- */
/* GET /orders/admin/all */
export const listAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query)
  const filter = {}
  if (req.query.status) filter.orderStatus = req.query.status
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ])
  return sendSuccess(res, { data: { orders }, meta: buildMeta({ page, limit, total }) })
})

/* PATCH /orders/:id/status (admin) */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, note } = req.body
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  if (orderStatus === 'delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'paid'
  await transitionOrder(order, orderStatus, { note: note || '', by: 'admin' })
  return sendSuccess(res, { message: 'Order status updated', data: { order } })
})

/* POST /orders/:id/ship (admin) — create a Shiprocket shipment */
export const createShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  const shipment = await shipping.createShipment(order)
  order.shipmentTracking.provider = shipment.provider
  order.shipmentTracking.shipmentId = shipment.shipmentId
  order.shipmentTracking.status = shipment.status
  await transitionOrder(order, 'shipped', { note: `Shipment ${shipment.shipmentId} created`, by: 'admin' })
  return sendSuccess(res, { message: 'Shipment created', data: { order } })
})

/* GET /orders/:id/label (admin) — packing slip / label PDF */
export const downloadLabel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  const pdf = req.query.type === 'packing' ? await generatePackingSlip(order) : await generateLabel(order)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${req.query.type || 'label'}-${order.orderNumber}.pdf"`)
  res.send(pdf)
})
