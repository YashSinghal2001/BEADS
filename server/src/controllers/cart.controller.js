import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Cart } from '../models/Cart.js'
import { Coupon } from '../models/Coupon.js'
import { Product } from '../models/Product.js'
import { computeTotals } from '../services/pricing.service.js'

async function getOrCreate(userId) {
  let cart = await Cart.findOne({ user: userId })
  if (!cart) cart = await Cart.create({ user: userId, items: [] })
  return cart
}

/** Resolve the unit price for an item, honouring a variant override. */
function unitPrice(product, variant) {
  if (variant?.sku) {
    const v = product.variants?.find((x) => x.sku === variant.sku)
    if (v && v.price != null) return v.price
  }
  return product.salePrice
}

/**
 * Populate products, recompute live totals (and revalidate any coupon),
 * persist, and return a client-friendly shape.
 */
async function buildCartResponse(cart) {
  await cart.populate({
    path: 'items.product',
    select: 'title slug images salePrice mrp variants stockStatus availableStock stock reservedStock',
  })

  // drop items whose product no longer exists
  cart.items = cart.items.filter((it) => it.product)

  const lineItems = cart.items.map((it) => ({
    price: unitPrice(it.product, it.variant),
    quantity: it.quantity,
  }))

  // revalidate coupon
  let couponDoc = null
  if (cart.coupon?.code) {
    couponDoc = await Coupon.findOne({ code: cart.coupon.code })
    const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0)
    if (!couponDoc || !couponDoc.isValidFor(subtotal).ok) {
      cart.coupon = { code: null, type: null, amount: 0 }
      couponDoc = null
    }
  }

  const totals = computeTotals(lineItems, couponDoc)
  Object.assign(cart, totals)
  if (couponDoc) {
    cart.coupon = { code: couponDoc.code, type: couponDoc.type, amount: couponDoc.amount }
  }
  await cart.save()

  const items = cart.items.map((it) => {
    const price = unitPrice(it.product, it.variant)
    return {
      _id: it._id,
      product: {
        _id: it.product._id,
        title: it.product.title,
        slug: it.product.slug,
        image: it.product.images?.[0]?.url || '',
        stockStatus: it.product.stockStatus,
        mrp: it.product.mrp,
      },
      variant: it.variant,
      quantity: it.quantity,
      price,
      compareAt: it.product.mrp && it.product.mrp > price ? it.product.mrp : null,
      inStock: it.product.stockStatus !== 'out_of_stock',
    }
  })

  return {
    items,
    coupon: cart.coupon?.code ? cart.coupon : null,
    totals: {
      subtotal: cart.subtotal,
      discount: cart.discount,
      shipping: cart.shipping,
      tax: cart.tax,
      total: cart.total,
    },
    count: items.reduce((n, it) => n + it.quantity, 0),
  }
}

/* GET /cart */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id)
  return sendSuccess(res, { data: await buildCartResponse(cart) })
})

/* POST /cart */
export const addToCart = asyncHandler(async (req, res) => {
  const { product: productId, quantity = 1, variant = {} } = req.body
  const product = await Product.findById(productId)
  if (!product || !product.isActive) throw ApiError.notFound('Product not found')
  if (product.availableStock < quantity) throw ApiError.badRequest('Not enough stock available')

  const cart = await getOrCreate(req.user._id)
  // A cart line is the same only for the same product AND the same variant —
  // matching on variant alone merged distinct products that share a key (e.g. `{}`).
  const key = (v) => `${v.color || ''}|${v.size || ''}|${v.sku || ''}`
  const existing = cart.items.find(
    (it) => it.product.equals(product._id) && key(it.variant) === key(variant),
  )

  if (existing) existing.quantity = Math.min(99, existing.quantity + quantity)
  else cart.items.push({ product: productId, variant, quantity, priceAtAdd: product.salePrice })

  await cart.save()
  return sendSuccess(res, { statusCode: 201, message: 'Added to cart', data: await buildCartResponse(cart) })
})

/* PATCH /cart/items/:itemId */
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body
  const cart = await getOrCreate(req.user._id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw ApiError.notFound('Cart item not found')
  item.quantity = quantity
  await cart.save()
  return sendSuccess(res, { message: 'Cart updated', data: await buildCartResponse(cart) })
})

/* DELETE /cart/items/:itemId */
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw ApiError.notFound('Cart item not found')
  item.deleteOne()
  await cart.save()
  return sendSuccess(res, { message: 'Item removed', data: await buildCartResponse(cart) })
})

/* DELETE /cart */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id)
  cart.items = []
  cart.coupon = { code: null, type: null, amount: 0 }
  await cart.save()
  return sendSuccess(res, { message: 'Cart cleared', data: await buildCartResponse(cart) })
})

/* POST /cart/coupon */
export const applyCoupon = asyncHandler(async (req, res) => {
  const code = req.body.code.toUpperCase()
  const cart = await getOrCreate(req.user._id)

  const built = await buildCartResponse(cart)
  const coupon = await Coupon.findOne({ code })
  if (!coupon) throw ApiError.notFound('Invalid coupon code')

  const check = coupon.isValidFor(built.totals.subtotal)
  if (!check.ok) throw ApiError.badRequest(check.reason)

  cart.coupon = { code: coupon.code, type: coupon.type, amount: coupon.amount }
  await cart.save()
  return sendSuccess(res, { message: 'Coupon applied', data: await buildCartResponse(cart) })
})

/* DELETE /cart/coupon */
export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await getOrCreate(req.user._id)
  cart.coupon = { code: null, type: null, amount: 0 }
  await cart.save()
  return sendSuccess(res, { message: 'Coupon removed', data: await buildCartResponse(cart) })
})
