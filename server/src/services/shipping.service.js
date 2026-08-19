import { config } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'

/**
 * Shiprocket service — modular and inert until credentials are set.
 * Uses the Shiprocket REST API via fetch with a cached auth token.
 */
const SR_BASE = config.SHIPROCKET_API_BASE || 'https://apiv2.shiprocket.in/v1/external'

export const isShippingEnabled = () => config.features.shiprocket

let tokenCache = { token: null, expiresAt: 0 }

async function authenticate() {
  if (!config.features.shiprocket) throw ApiError.badRequest('Shipping integration is not enabled yet.')
  if (tokenCache.token && tokenCache.expiresAt > Date.now()) return tokenCache.token

  const res = await fetch(`${SR_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: config.SHIPROCKET_EMAIL, password: config.SHIPROCKET_PASSWORD }),
  })
  if (!res.ok) throw new ApiError(502, 'Shiprocket authentication failed')
  const data = await res.json()
  tokenCache = { token: data.token, expiresAt: Date.now() + 9 * 24 * 3600 * 1000 } // ~10-day token
  return data.token
}

async function sr(path, { method = 'GET', body } = {}) {
  const token = await authenticate()
  const res = await fetch(`${SR_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    logger.error(`Shiprocket ${method} ${path} failed: ${res.status} ${text}`)
    throw new ApiError(502, 'Shipping provider request failed')
  }
  return res.json()
}

/* Pickup-location nickname: explicit env override, else the primary pickup
 * address configured in the Shiprocket account (cached — it rarely changes). */
let pickupCache = { name: null, at: 0 }
async function resolvePickupLocation() {
  if (config.SHIPROCKET_PICKUP_LOCATION) return config.SHIPROCKET_PICKUP_LOCATION
  if (pickupCache.name && Date.now() - pickupCache.at < 12 * 3600 * 1000) return pickupCache.name
  const data = await sr('/settings/company/pickup')
  const addrs = data.data?.shipping_address || []
  const primary = addrs.find((a) => a.is_primary_location) || addrs[0]
  if (!primary?.pickup_location) throw new ApiError(502, 'No pickup location configured in Shiprocket')
  pickupCache = { name: primary.pickup_location, at: Date.now() }
  return pickupCache.name
}

/** Sum real product shipping weight (grams) for the order, in kg. */
async function orderWeightKg(order) {
  try {
    const ids = order.items.map((it) => it.product)
    const products = await Product.find({ _id: { $in: ids } })
      .select('shipping.weight specifications.weight')
      .lean()
    const grams = order.items.reduce((sum, it) => {
      const p = products.find((x) => String(x._id) === String(it.product))
      const w = p?.shipping?.weight || p?.specifications?.weight || 0
      return sum + w * it.quantity
    }, 0)
    return grams > 0 ? Math.max(grams / 1000, 0.05) : 0.3
  } catch {
    return 0.3 // fall back to the default package weight
  }
}

/** Create a shipment (adhoc order) from an Order document. */
export async function createShipment(order) {
  const addr = order.shippingAddress
  const [firstName, ...restName] = String(addr.fullName || '').trim().split(/\s+/)
  const payload = {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
    pickup_location: await resolvePickupLocation(),
    ...(config.SHIPROCKET_CHANNEL_ID ? { channel_id: config.SHIPROCKET_CHANNEL_ID } : {}),
    billing_customer_name: firstName || addr.fullName,
    billing_last_name: restName.join(' '),
    billing_address: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state,
    billing_country: addr.country || 'India',
    billing_email: order.customerEmail || '',
    billing_phone: addr.phone,
    shipping_is_billing: true,
    order_items: order.items.map((it) => ({
      name: it.title,
      sku: it.sku || String(it.product),
      units: it.quantity,
      selling_price: it.price,
    })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    // The collectible/order value — total after discount, incl. shipping+tax.
    sub_total: order.total,
    length: 10,
    breadth: 10,
    height: 5,
    weight: await orderWeightKg(order),
  }
  const data = await sr('/orders/create/adhoc', { method: 'POST', body: payload })
  return {
    provider: 'shiprocket',
    providerOrderId: String(data.order_id || ''),
    shipmentId: String(data.shipment_id || data.order_id || ''),
    status: String(data.status || 'created').toLowerCase(),
  }
}

/**
 * Find an existing Shiprocket order carrying our orderNumber (sent to the
 * provider as order_id, echoed back as channel_order_id). Duplicate guard for
 * retries: a previous attempt may have succeeded remotely while the local
 * save was lost (timeout/crash between the API call and the DB write).
 * Best-effort — returns null on any failure or ambiguity so the caller falls
 * back to normal creation. Never throws.
 */
export async function findProviderOrder(orderNumber) {
  try {
    const data = await sr(`/orders?search=${encodeURIComponent(orderNumber)}`)
    const match = (Array.isArray(data.data) ? data.data : []).find(
      (o) => String(o.channel_order_id) === String(orderNumber),
    )
    if (!match?.id) return null
    const shipments = Array.isArray(match.shipments) ? match.shipments : [match.shipments].filter(Boolean)
    return {
      provider: 'shiprocket',
      providerOrderId: String(match.id),
      shipmentId: String(shipments[0]?.id || match.shipment_id || match.id),
      status: String(match.status || 'created').toLowerCase(),
    }
  } catch {
    return null
  }
}

/* ---------------------- Idempotent dispatch on accept ---------------------- */

/** Order statuses for which creating a shipment is legitimate. */
const DISPATCHABLE = ['confirmed', 'paid', 'processing', 'packed']
const IN_FLIGHT = 'creating'

/**
 * Idempotently create the Shiprocket order for a store order. Triggered by
 * the admin accepting an order (POST /orders/:id/accept) or retrying a failed
 * attempt (POST /orders/:id/ship).
 *
 * Exactly-once by construction: a conditional update claims the order
 * (shipmentId still null and no claim in flight) before any network call, so
 * concurrent triggers — double-clicked Accept, browser retries, repeated
 * admin clicks — collapse to a single creation. On provider failure the
 * claim moves to 'failed' (with a safe lastError for the admin UI), which a
 * later retry can claim again.
 *
 * When the claimed order shows a previous attempt ('failed', or a stale
 * 'creating' claim reclaimed via `reclaimStale`), the provider is first asked
 * whether our orderNumber already exists there — covering the case where the
 * create succeeded remotely but the response was lost locally — and an
 * existing provider order is recorded instead of creating a duplicate.
 *
 * `reclaimStale` lets the admin retry an order whose previous attempt crashed
 * mid-flight (claim held, no shipmentId) — never exposed to automatic paths.
 * Never throws; returns a result object.
 */
export async function dispatchShipment(orderId, { by = 'system', reclaimStale = false } = {}) {
  if (!isShippingEnabled()) {
    return { ok: false, skipped: true, reason: 'shipping-disabled' }
  }

  const claim = {
    _id: orderId,
    'shipmentTracking.shipmentId': null,
    orderStatus: { $in: DISPATCHABLE },
    ...(reclaimStale ? {} : { 'shipmentTracking.status': { $ne: IN_FLIGHT } }),
  }
  // `new: false` → pre-claim snapshot, so the previous attempt state is known.
  // No field used below (address, items, orderNumber, orderStatus) is touched
  // by the claim update itself.
  const order = await Order.findOneAndUpdate(
    claim,
    { $set: { 'shipmentTracking.status': IN_FLIGHT } },
    { new: false },
  )
  if (!order) {
    const existing = await Order.findById(orderId).select('shipmentTracking orderStatus').lean()
    if (existing?.shipmentTracking?.shipmentId) {
      return { ok: true, already: true, shipment: existing.shipmentTracking }
    }
    if (!existing) return { ok: false, skipped: true, reason: 'not-found' }
    return {
      ok: false,
      skipped: true,
      reason: existing.shipmentTracking?.status === IN_FLIGHT ? 'in-flight' : 'not-eligible',
    }
  }

  const record = (shipment, note) =>
    Order.findOneAndUpdate(
      { _id: order._id, 'shipmentTracking.status': IN_FLIGHT },
      {
        $set: {
          'shipmentTracking.provider': shipment.provider,
          'shipmentTracking.providerOrderId': shipment.providerOrderId,
          'shipmentTracking.shipmentId': shipment.shipmentId,
          'shipmentTracking.status': shipment.status,
          'shipmentTracking.lastError': null,
        },
        $push: { timeline: { status: order.orderStatus, note, by, at: new Date() } },
      },
      { new: true },
    )

  try {
    const priorStatus = order.shipmentTracking?.status || null
    if (priorStatus === 'failed' || (reclaimStale && priorStatus === IN_FLIGHT)) {
      const found = await findProviderOrder(order.orderNumber)
      if (found) {
        const updated = await record(found, `Shiprocket order ${found.providerOrderId} recovered from a previous attempt`)
        logger.info(`Shiprocket order recovered for ${order.orderNumber}: order_id=${found.providerOrderId}`)
        return { ok: true, already: true, recovered: true, shipment: found, order: updated }
      }
    }

    const shipment = await createShipment(order)
    const updated = await record(shipment, `Shiprocket order ${shipment.providerOrderId} (shipment ${shipment.shipmentId}) created`)
    logger.info(`Shiprocket order created for ${order.orderNumber}: order_id=${shipment.providerOrderId} shipment_id=${shipment.shipmentId}`)
    return { ok: true, created: true, shipment, order: updated }
  } catch (err) {
    // Record the failure for the admin UI and release the claim — 'failed' is
    // claimable again, so the accept response can offer "Retry Shiprocket".
    // Only our own error messages land in lastError (provider bodies are
    // logged, never rethrown), so nothing sensitive is stored or exposed.
    const message = String(err?.message || 'Shipping provider request failed').slice(0, 300)
    await Order.updateOne(
      { _id: order._id, 'shipmentTracking.status': IN_FLIGHT },
      {
        $set: { 'shipmentTracking.status': 'failed', 'shipmentTracking.lastError': message },
        $push: { timeline: { status: order.orderStatus, note: 'Shiprocket creation failed', by, at: new Date() } },
      },
    ).catch(() => {})
    logger.error(`Shiprocket dispatch failed for ${order.orderNumber}: ${err.message}`)
    return { ok: false, error: err, message }
  }
}

export async function generateAWB(shipmentId, courierId) {
  const data = await sr('/courier/assign/awb', { method: 'POST', body: { shipment_id: shipmentId, courier_id: courierId } })
  const r = data.response?.data || {}
  return { awb: r.awb_code || null, courier: r.courier_name || null }
}

export async function schedulePickup(shipmentId) {
  return sr('/courier/generate/pickup', { method: 'POST', body: { shipment_id: [shipmentId] } })
}

export async function generateLabel(shipmentId) {
  const data = await sr('/courier/generate/label', { method: 'POST', body: { shipment_id: [shipmentId] } })
  return data.label_url || null
}

export async function generateManifest(shipmentId) {
  const data = await sr('/manifests/generate', { method: 'POST', body: { shipment_id: [shipmentId] } })
  return data.manifest_url || null
}

export async function trackShipment(awb) {
  const data = await sr(`/courier/track/awb/${awb}`)
  const t = data.tracking_data || {}
  return {
    awb,
    status: t.shipment_status || 'unknown',
    checkpoints: t.shipment_track_activities || [],
    trackingUrl: t.track_url || null,
  }
}

/** Simple delivery estimate used before a live integration exists. */
export function estimateDelivery() {
  return {
    minDays: 3,
    maxDays: 6,
    from: new Date(Date.now() + 3 * 86400000),
    to: new Date(Date.now() + 6 * 86400000),
  }
}
