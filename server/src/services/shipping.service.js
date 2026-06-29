import { config } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

/**
 * Shiprocket service — modular and inert until credentials are set.
 * Uses the Shiprocket REST API via fetch with a cached auth token.
 */
const SR_BASE = 'https://apiv2.shiprocket.in/v1/external'

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

/** Create a shipment (adhoc order) from an Order document. */
export async function createShipment(order) {
  const addr = order.shippingAddress
  const payload = {
    order_id: order.orderNumber,
    order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
    billing_customer_name: addr.fullName,
    billing_address: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state,
    billing_country: addr.country || 'India',
    billing_phone: addr.phone,
    shipping_is_billing: true,
    order_items: order.items.map((it) => ({
      name: it.title,
      sku: it.sku,
      units: it.quantity,
      selling_price: it.price,
    })),
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.subtotal,
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.3,
  }
  const data = await sr('/orders/create/adhoc', { method: 'POST', body: payload })
  return {
    provider: 'shiprocket',
    shipmentId: String(data.shipment_id || data.order_id || ''),
    status: data.status || 'created',
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
