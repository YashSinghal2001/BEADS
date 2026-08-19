/**
 * End-to-end smoke test:
 *  - spins up an in-memory MongoDB
 *  - boots the Express app
 *  - seeds categories + products
 *  - exercises auth (register/login/me), products list/detail, cart, wishlist
 *
 * Env is set BEFORE importing app modules because config/env.js validates at import.
 */
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-please-change-1234567890'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-change-0987654321'
process.env.CLIENT_URL = 'http://localhost:5173'
process.env.RAZORPAY_KEY_ID = 'rzp_test_key'
process.env.RAZORPAY_SECRET = 'rzp_test_secret_abcdef'
process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test_123'

let exitCode = 0
const assert = (cond, label) => {
  if (cond) {
    console.log(`  ✓ ${label}`)
  } else {
    exitCode = 1
    console.error(`  ✗ ${label}`)
  }
}

async function main() {
  let mongod
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    mongod = await MongoMemoryServer.create()
  } catch (err) {
    console.error('⚠️  Could not start in-memory MongoDB (likely no network for binary download).')
    console.error(`   ${err.message}`)
    console.error('   Skipping integration smoke test. Run `npm run check` for syntax validation.')
    process.exit(0)
  }

  process.env.MONGODB_URI = mongod.getUri('ys-creations-test')

  // ---- Shiprocket API stub -------------------------------------------------
  // Runs before the app boots so shipping.service.js picks the base URL up at
  // import time. Validates the payload contract and counts creates per
  // order_id so duplicate-creation bugs fail the run.
  const http = await import('node:http')
  const srCreates = new Map() // order_id → count
  const srOrders = new Map() // order_id → { id, shipment_id } (what the provider holds)
  let srSeq = 9000
  let srFailNext = false
  let srLastPayload = null
  const SR_REQUIRED = [
    'order_id', 'order_date', 'pickup_location', 'billing_customer_name',
    'billing_address', 'billing_city', 'billing_pincode', 'billing_state',
    'billing_country', 'billing_email', 'billing_phone', 'order_items',
    'payment_method', 'sub_total', 'length', 'breadth', 'height', 'weight',
  ]
  const srStub = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      const json = (code, obj) => {
        res.writeHead(code, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(obj))
      }
      if (req.url === '/auth/login') return json(200, { token: 'sr-test-token' })
      if (req.url === '/settings/company/pickup') {
        return json(200, { data: { shipping_address: [{ pickup_location: 'Home', is_primary_location: 1, city: 'Delhi', pin_code: '110085' }] } })
      }
      if (req.url.startsWith('/orders?search=')) {
        // order lookup by our orderNumber (channel_order_id) — the timeout
        // duplicate guard queries this before re-creating on a retry
        const q = decodeURIComponent(req.url.slice('/orders?search='.length))
        const hit = srOrders.get(q)
        return json(200, { data: hit ? [{ id: hit.id, channel_order_id: q, status: 'NEW', shipments: [{ id: hit.shipment_id }] }] : [] })
      }
      if (req.url === '/orders/create/adhoc') {
        if (srFailNext) {
          srFailNext = false
          return json(500, { message: 'stub-induced failure' })
        }
        const body = JSON.parse(raw || '{}')
        const missing = SR_REQUIRED.filter((k) => body[k] === undefined || body[k] === null || body[k] === '')
        if (missing.length) return json(422, { message: `missing: ${missing.join(',')}` })
        if (!Array.isArray(body.order_items) || body.order_items.some((i) => !i.name || !i.sku || !i.units || i.selling_price == null)) {
          return json(422, { message: 'bad order_items' })
        }
        srCreates.set(body.order_id, (srCreates.get(body.order_id) || 0) + 1)
        srLastPayload = body
        srSeq += 1
        srOrders.set(body.order_id, { id: srSeq, shipment_id: srSeq + 100000 })
        return json(200, { order_id: srSeq, shipment_id: srSeq + 100000, status: 'NEW' })
      }
      return json(404, { message: 'not found' })
    })
  })
  await new Promise((r) => srStub.listen(0, '127.0.0.1', r))
  process.env.SHIPROCKET_EMAIL = 'smoke@test.local'
  process.env.SHIPROCKET_PASSWORD = 'smoke-password'
  process.env.SHIPROCKET_WEBHOOK_TOKEN = 'sr-hook-token'
  process.env.SHIPROCKET_API_BASE = `http://127.0.0.1:${srStub.address().port}`
  // SHIPROCKET_PICKUP_LOCATION deliberately unset — the auto-detection path
  // (primary pickup address from the provider) is what production uses.
  delete process.env.SHIPROCKET_PICKUP_LOCATION

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

  const { createApp } = await import('../src/app.js')
  const { connectDB, disconnectDB } = await import('../src/config/db.js')
  const { Category } = await import('../src/models/Category.js')
  const { Product } = await import('../src/models/Product.js')
  const { buildProducts, categories } = await import('../src/jobs/seedData.js')

  await connectDB()

  // seed
  const cats = await Category.create(categories)
  const map = cats.reduce((a, c) => ({ ...a, [c.name]: c._id }), {})
  await Product.create(buildProducts(map))

  // ensure indexes (incl. the product text index) are built before querying
  await Promise.all([Product.init(), Category.init()])

  const app = createApp()
  const server = app.listen(0)
  const { port } = server.address()
  const base = `http://127.0.0.1:${port}`
  const api = (p) => `${base}${p}`

  const json = async (res) => ({ status: res.status, body: await res.json() })

  try {
    // health
    let r = await json(await fetch(api('/health')))
    assert(r.status === 200 && r.body.data.status === 'up', 'GET /health → up')

    // api index
    r = await json(await fetch(api('/api')))
    assert(r.status === 200 && r.body.success, 'GET /api → index')

    // products list
    r = await json(await fetch(api('/api/products?limit=5')))
    assert(r.status === 200 && r.body.data.products.length === 5, 'GET /api/products → paginated list')
    assert(r.body.meta.total === 24, 'products meta.total === 24')

    // search + filter
    r = await json(await fetch(api('/api/products?q=pearl&sort=price-asc')))
    assert(r.status === 200 && r.body.data.products.length > 0, 'GET /api/products?q=pearl → text search')

    const slug = r.body.data.products[0].slug
    r = await json(await fetch(api(`/api/products/${slug}`)))
    assert(r.status === 200 && r.body.data.product.slug === slug, 'GET /api/products/:slug → detail')

    // categories
    r = await json(await fetch(api('/api/categories')))
    assert(r.status === 200 && r.body.data.categories.length === 8, 'GET /api/categories → 8 categories with counts')

    // register
    r = await json(
      await fetch(api('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: 'test@ysc.com', password: 'secret123' }),
      }),
    )
    assert(r.status === 201 && r.body.data.accessToken, 'POST /api/auth/register → 201 + token')
    const token = r.body.data.accessToken

    // duplicate register → 409
    r = await json(
      await fetch(api('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dup', email: 'test@ysc.com', password: 'secret123' }),
      }),
    )
    assert(r.status === 409, 'POST /api/auth/register (dup) → 409 conflict')

    // login
    r = await json(
      await fetch(api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@ysc.com', password: 'secret123' }),
      }),
    )
    assert(r.status === 200 && r.body.data.accessToken, 'POST /api/auth/login → 200 + token')

    // protected: profile without token → 401
    r = await json(await fetch(api('/api/users/profile')))
    assert(r.status === 401, 'GET /api/users/profile (no token) → 401')

    // protected: profile with token → 200
    r = await json(await fetch(api('/api/users/profile'), { headers: { Authorization: `Bearer ${token}` } }))
    assert(r.status === 200 && r.body.data.user.email === 'test@ysc.com', 'GET /api/users/profile (token) → 200')

    // validation error → 400
    r = await json(
      await fetch(api('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      }),
    )
    assert(r.status === 400, 'POST /api/auth/login (invalid) → 400 validation')

    // cart add → 201
    const pid = (await json(await fetch(api('/api/products?limit=1')))).body.data.products[0]._id
    r = await json(
      await fetch(api('/api/cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product: pid, quantity: 2 }),
      }),
    )
    assert(r.status === 201 && r.body.data.count === 2, 'POST /api/cart → item added, totals computed')
    assert(r.body.data.totals.total > 0, 'cart totals.total computed > 0')

    // cart line matching regression: lines must merge only on (product + variant),
    // never across different products that share a variant key (e.g. both `{}`)
    const addLine = async (body) =>
      json(
        await fetch(api('/api/cart'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }),
      )
    const lineOf = (items, id, color = '') =>
      items.find((it) => String(it.product._id) === String(id) && (it.variant?.color || '') === color)

    const pid2 = (await json(await fetch(api('/api/products?limit=2')))).body.data.products[1]._id
    assert(String(pid2) !== String(pid), 'regression setup: two distinct products')

    // different product + same empty variant → separate line (the audit's corruption case)
    r = await addLine({ product: pid2, quantity: 1 })
    assert(r.body.data.items.length === 2, 'cart: 2nd product w/ empty variant → own line, not merged')
    assert(
      lineOf(r.body.data.items, pid)?.quantity === 2 && lineOf(r.body.data.items, pid2)?.quantity === 1,
      'cart: quantities stay per-product (A×2, B×1)',
    )

    // same product + same variant → merges into one line
    r = await addLine({ product: pid2, quantity: 1 })
    assert(
      r.body.data.items.length === 2 && lineOf(r.body.data.items, pid2)?.quantity === 2,
      'cart: same product + same variant → merged (B×2)',
    )

    // same product + different variant → separate line
    r = await addLine({ product: pid2, quantity: 1, variant: { color: 'Red' } })
    assert(r.body.data.items.length === 3, 'cart: same product + different variant → own line')

    // same product + same non-empty variant → merges
    r = await addLine({ product: pid2, quantity: 1, variant: { color: 'Red' } })
    assert(
      r.body.data.items.length === 3 && lineOf(r.body.data.items, pid2, 'Red')?.quantity === 2,
      'cart: same product + same variant (Red) → merged',
    )

    // different product + same non-empty variant → separate line
    r = await addLine({ product: pid, quantity: 1, variant: { color: 'Red' } })
    assert(
      r.body.data.items.length === 4 && lineOf(r.body.data.items, pid, 'Red')?.quantity === 1,
      'cart: different product + same variant (Red) → own line',
    )

    // regression: Product Detail vs Quick Add payloads for a simple product.
    // The old Product Detail page sent `variant: { size: null, color: null }`
    // for products without variants; the schema only allows strings or absent
    // keys, so the request 400'd while Quick Add (`variant: {}`) worked.
    r = await addLine({ product: pid2, quantity: 1, variant: { size: null, color: null } })
    assert(
      r.status === 400 && r.body.message === 'Validation failed',
      'cart: null variant axes (legacy PD payload) → 400 Validation failed',
    )
    assert(
      ['variant.color', 'variant.size'].every((f) => (r.body.errors || []).some((e) => e.field === f)),
      'cart: 400 pinpoints variant.color + variant.size',
    )
    // explicit `variant: {}` (what Quick Add and the fixed Product Detail send)
    // must join the same line as variant-omitted adds — same product, same qty math
    r = await addLine({ product: pid2, quantity: 1, variant: {} })
    assert(
      r.status === 201 && r.body.data.items.length === 4 && lineOf(r.body.data.items, pid2)?.quantity === 3,
      'cart: `variant: {}` (PD/Quick Add shape) merges with variant-omitted line (B×3)',
    )

    // restore the cart to exactly (pid × 2, no variant) for the order flow below
    for (const it of r.body.data.items) {
      if (String(it.product._id) === String(pid) && !(it.variant?.color || '')) continue
      // eslint-disable-next-line no-await-in-loop
      r = await json(
        await fetch(api(`/api/cart/items/${it._id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
    }
    assert(
      r.body.data.count === 2 && r.body.data.items.length === 1 && lineOf(r.body.data.items, pid)?.quantity === 2,
      'cart restored to a single A×2 line after regression checks',
    )

    // coupon validate
    const { Coupon } = await import('../src/models/Coupon.js')
    await Coupon.create({ code: 'WELCOME10', type: 'percent', amount: 10, active: true })
    r = await json(
      await fetch(api('/api/coupons/validate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'WELCOME10', subtotal: 1000 }),
      }),
    )
    assert(r.status === 200 && r.body.data.discount === 100, 'POST /api/coupons/validate → 10% = ₹100')

    // ---- Phase 4: commerce engine ----
    const cryptoMod = await import('node:crypto')
    const { Product } = await import('../src/models/Product.js')
    const { Order } = await import('../src/models/Order.js')
    const { Payment } = await import('../src/models/Payment.js')
    const { WebhookEvent } = await import('../src/models/WebhookEvent.js')
    const { User } = await import('../src/models/User.js')
    const { verifyPaymentSignature } = await import('../src/services/payment.service.js')

    await User.create({ name: 'Admin', email: 'admin@ysc.com', password: 'admin12345', role: 'admin', isVerified: true })
    const adminToken = (
      await json(
        await fetch(api('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@ysc.com', password: 'admin12345' }),
        }),
      )
    ).body.data.accessToken

    const beforeStock = (await Product.findById(pid).lean()).stock

    // place a COD order from the existing cart (qty 2)
    r = await json(
      await fetch(api('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shippingAddress: { fullName: 'Test User', phone: '9876543210', addressLine1: '1 Test St', city: 'Mumbai', state: 'MH', pincode: '400001' },
          paymentMethod: 'cod',
        }),
      }),
    )
    assert(r.status === 201 && r.body.data.order.orderStatus === 'confirmed', 'POST /api/orders (COD) → 201 confirmed')
    const orderId = r.body.data.order._id

    const afterStock = (await Product.findById(pid).lean()).stock
    assert(afterStock === beforeStock - 2, 'inventory committed → stock decremented by 2')

    const orderDoc = await Order.findById(orderId).lean()
    assert(orderDoc.inventoryCommitted === true, 'order.inventoryCommitted = true')
    const pay = await Payment.findOne({ order: orderId }).lean()
    assert(pay && pay.gateway === 'cod', 'Payment record created (cod)')

    // pay-time auto-dispatch is REMOVED: a confirmed order waits for admin accept
    await sleep(400)
    const codFresh = await Order.findById(orderId).lean()
    assert(codFresh.orderStatus === 'confirmed' && !codFresh.shipmentTracking?.shipmentId, 'no auto-dispatch: confirmed COD order waits for admin accept')
    assert(!srCreates.has(codFresh.orderNumber), 'no auto-dispatch: provider never called at checkout')

    // invalid vs valid status transition
    r = await json(await fetch(api(`/api/orders/${orderId}/status`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ orderStatus: 'delivered' }) }))
    assert(r.status === 400, 'invalid transition confirmed→delivered → 400')
    r = await json(await fetch(api(`/api/orders/${orderId}/status`), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ orderStatus: 'processing' }) }))
    assert(r.status === 200 && r.body.data.order.orderStatus === 'processing', 'valid transition confirmed→processing → 200')

    const o2 = await Order.findById(orderId).lean()
    assert(o2.timeline.some((t) => t.status === 'processing' && t.by === 'admin'), 'timeline audit recorded (by=admin)')

    // payment signature verification (HMAC)
    const ro = 'order_test'
    const rp = 'pay_test'
    const sig = cryptoMod.createHmac('sha256', 'rzp_test_secret_abcdef').update(`${ro}|${rp}`).digest('hex')
    assert(verifyPaymentSignature({ orderId: ro, paymentId: rp, signature: sig }) === true, 'verifyPaymentSignature valid → true')
    assert(verifyPaymentSignature({ orderId: ro, paymentId: rp, signature: 'bad' }) === false, 'verifyPaymentSignature invalid → false')

    // webhook idempotency (model-level)
    await WebhookEvent.init()
    await WebhookEvent.create({ source: 'razorpay', eventId: 'evt_1', event: 'payment.captured' })
    let dupBlocked = false
    try {
      await WebhookEvent.create({ source: 'razorpay', eventId: 'evt_1', event: 'payment.captured' })
    } catch (e) {
      dupBlocked = e.code === 11000
    }
    assert(dupBlocked, 'webhook idempotency: duplicate eventId blocked')

    // invoice PDF
    const invRes = await fetch(api(`/api/orders/${orderId}/invoice`), { headers: { Authorization: `Bearer ${token}` } })
    const buf = Buffer.from(await invRes.arrayBuffer())
    assert(invRes.status === 200 && invRes.headers.get('content-type') === 'application/pdf' && buf.subarray(0, 4).toString() === '%PDF', 'GET /orders/:id/invoice → PDF')

    // reorder
    r = await json(await fetch(api(`/api/orders/${orderId}/reorder`), { method: 'POST', headers: { Authorization: `Bearer ${token}` } }))
    assert(r.status === 200 && r.body.data.added >= 1, 'POST /orders/:id/reorder → items re-added')

    // ---- Shiprocket dispatch on admin acceptance (idempotent) ----
    const shippingSvc = await import('../src/services/shipping.service.js')
    const shipAddr = { fullName: 'Test User', phone: '9876543210', addressLine1: '1 Test St', city: 'Mumbai', state: 'MH', pincode: '400001' }
    const buyerDoc = await User.findOne({ email: 'test@ysc.com' }).lean()
    const mkOrder = (prod, overrides = {}) =>
      Order.create({
        user: buyerDoc._id,
        items: [{ product: prod._id, title: prod.title, price: prod.salePrice, quantity: 1 }],
        shippingAddress: shipAddr,
        customerEmail: buyerDoc.email,
        subtotal: prod.salePrice,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: prod.salePrice,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        ...overrides,
      })
    const acceptPost = async (id, bearer = adminToken) =>
      json(await fetch(api(`/api/orders/${id}/accept`), { method: 'POST', headers: { Authorization: `Bearer ${bearer}` } }))
    const shipPost = async (id, bearer = adminToken) =>
      json(await fetch(api(`/api/orders/${id}/ship`), { method: 'POST', headers: { Authorization: `Bearer ${bearer}` } }))
    const prodForShip = await Product.findOne({ isActive: true, stock: { $gte: 5 } }).lean()

    // a confirmed order left alone must NEVER be dispatched (re-checked at the end)
    const untouched = await mkOrder(prodForShip)

    // (a) Accept: confirmed → processing + Shiprocket order created automatically
    const acc = await mkOrder(prodForShip)
    r = await acceptPost(acc._id)
    assert(r.status === 200 && r.body.data?.order?.orderStatus === 'processing', 'accept: confirmed → processing')
    assert(r.body.data?.shipping?.status === 'created', 'accept: response carries shipping.status=created')
    const accDoc = await Order.findById(acc._id).lean()
    assert(
      accDoc.shipmentTracking?.provider === 'shiprocket' && Boolean(accDoc.shipmentTracking?.providerOrderId) && Boolean(accDoc.shipmentTracking?.shipmentId),
      'accept: provider + shipment ids persisted on the order',
    )
    assert(srCreates.get(accDoc.orderNumber) === 1, 'accept: exactly one provider order created')
    assert(
      accDoc.timeline.some((t) => t.status === 'processing' && /accepted/i.test(t.note || '')) && accDoc.timeline.some((t) => /shiprocket order/i.test(t.note || '')),
      'accept: timeline records acceptance + provider order',
    )
    assert(srLastPayload?.pickup_location === 'Home', 'shiprocket: pickup_location auto-resolved from primary pickup address')
    assert(
      Boolean(srLastPayload?.billing_email) && Boolean(srLastPayload?.billing_phone) && srLastPayload?.billing_last_name !== undefined,
      'shiprocket: payload carries billing email/phone/last name',
    )

    // (b) repeated Accept (double click / replay) → idempotent, no duplicate
    r = await acceptPost(acc._id)
    assert(r.status === 200 && r.body.data?.shipping?.status === 'already', 'accept: repeat accept → shipping.status=already')
    assert(srCreates.get(accDoc.orderNumber) === 1, 'accept: repeat accept created no duplicate')
    r = await shipPost(acc._id)
    assert(r.status === 200 && /already/i.test(r.body.message || ''), 'shiprocket: /:id/ship after success → already exists')
    assert(srCreates.get(accDoc.orderNumber) === 1, 'shiprocket: retry after success created no duplicate')

    // concurrent double-click on Accept → one transition, one provider order
    const dbl = await mkOrder(prodForShip)
    const [dr1, dr2] = await Promise.all([acceptPost(dbl._id), acceptPost(dbl._id)])
    assert(dr1.status === 200 && dr2.status === 200, 'accept: concurrent double accept → both requests succeed')
    const dblDoc = await Order.findById(dbl._id).lean()
    assert(
      dblDoc.orderStatus === 'processing' && dblDoc.timeline.filter((t) => /accepted/i.test(t.note || '')).length === 1,
      'accept: concurrent double accept → exactly one transition',
    )
    assert(srCreates.get(dblDoc.orderNumber) === 1, 'accept: concurrent double accept → one provider order')

    // (c) accept refused for ineligible states; dispatch refused everywhere
    const pendingOrder = await mkOrder(prodForShip, { paymentMethod: 'razorpay', paymentStatus: 'pending', orderStatus: 'pending' })
    r = await acceptPost(pendingOrder._id)
    assert(r.status === 400, 'accept: pending order → 400')
    const cancelledOrder = await mkOrder(prodForShip, { orderStatus: 'cancelled' })
    r = await acceptPost(cancelledOrder._id)
    assert(r.status === 400, 'accept: cancelled order → 400')
    let disp = await shippingSvc.dispatchShipment(pendingOrder._id, { by: 'system' })
    assert(disp.ok === false && disp.skipped === true, 'shiprocket: pending order → dispatch refused (not eligible)')
    r = await shipPost(pendingOrder._id)
    assert(r.status === 400, 'shiprocket: /:id/ship on pending order → 400')
    assert(
      !srCreates.has(pendingOrder.orderNumber) && !srCreates.has(cancelledOrder.orderNumber),
      'shiprocket: refused orders never reached the provider',
    )

    // (d) customer tokens are forbidden on both admin endpoints
    r = await acceptPost(acc._id, token)
    assert(r.status === 403, 'accept: customer token → 403')
    r = await shipPost(acc._id, token)
    assert(r.status === 403, 'ship: customer token → 403')

    // (e) Accept with provider 500 → order stays accepted, failure recorded safely
    const failOrder = await mkOrder(prodForShip)
    srFailNext = true
    r = await acceptPost(failOrder._id)
    assert(r.status === 200 && r.body.data?.order?.orderStatus === 'processing', 'accept: provider 500 → order still accepted (processing)')
    assert(r.body.data?.shipping?.status === 'failed' && Boolean(r.body.data?.shipping?.message), 'accept: provider 500 → shipping.status=failed with message')
    let failDoc = await Order.findById(failOrder._id).lean()
    assert(failDoc.orderStatus === 'processing' && !failDoc.shipmentTracking.shipmentId && !failDoc.shipmentTracking.providerOrderId, 'accept-fail: order remains processing, no provider ids')
    assert(
      failDoc.shipmentTracking.status === 'failed' && typeof failDoc.shipmentTracking.lastError === 'string' && failDoc.shipmentTracking.lastError.length > 0,
      'accept-fail: shipmentTracking.status=failed + lastError recorded',
    )
    assert(failDoc.timeline.some((t) => /shiprocket creation failed/i.test(t.note || '')), 'accept-fail: timeline notes the failure')
    assert(!srCreates.has(failDoc.orderNumber), 'accept-fail: no provider order created')
    assert(!/password|secret|bearer|authorization/i.test(failDoc.shipmentTracking.lastError), 'accept-fail: lastError carries no credentials')

    // (f) retry after failure → created, exactly one provider order, error cleared
    r = await shipPost(failOrder._id)
    failDoc = await Order.findById(failOrder._id).lean()
    assert(r.status === 201 && Boolean(failDoc.shipmentTracking.shipmentId), 'shiprocket: admin retry after failure → created')
    assert(failDoc.shipmentTracking.status !== 'failed' && failDoc.shipmentTracking.lastError === null, 'shiprocket: success clears failed status + lastError')
    assert(srCreates.get(failDoc.orderNumber) === 1, 'shiprocket: failed attempt + retry → exactly one provider order')

    // (g) timeout duplicate guard: provider succeeded but the local save was
    // lost → retry recovers the existing provider order instead of re-creating
    const lost = await mkOrder(prodForShip)
    r = await acceptPost(lost._id)
    let lostDoc = await Order.findById(lost._id).lean()
    const lostProviderId = lostDoc.shipmentTracking.providerOrderId
    assert(r.status === 200 && Boolean(lostProviderId), 'timeout-guard: setup order dispatched')
    await Order.updateOne(
      { _id: lost._id },
      { $set: { 'shipmentTracking.providerOrderId': null, 'shipmentTracking.shipmentId': null, 'shipmentTracking.status': 'failed', 'shipmentTracking.lastError': 'simulated local timeout' } },
    )
    r = await shipPost(lost._id)
    lostDoc = await Order.findById(lost._id).lean()
    assert(r.status === 200 && /already/i.test(r.body.message || ''), 'timeout-guard: retry reports existing order instead of re-creating')
    assert(lostDoc.shipmentTracking.providerOrderId === lostProviderId, 'timeout-guard: original provider order reference recovered')
    assert(srCreates.get(lostDoc.orderNumber) === 1, 'timeout-guard: no second provider order created')

    // (h) concurrent dispatch of the same order → single creation
    const dualOrder = await mkOrder(prodForShip)
    const [d1, d2] = await Promise.all([
      shippingSvc.dispatchShipment(dualOrder._id, { by: 'system' }),
      shippingSvc.dispatchShipment(dualOrder._id, { by: 'system' }),
    ])
    assert([d1, d2].filter((x) => x.created).length === 1, 'shiprocket: concurrent dispatch → exactly one creator')
    assert(srCreates.get(dualOrder.orderNumber) === 1, 'shiprocket: concurrent dispatch → one provider order')

    // (i) accept also dispatches an order already moved to processing manually
    // (the checkout COD order was transitioned by the /status tests above)
    r = await acceptPost(orderId)
    assert(r.status === 200 && r.body.data?.shipping?.status === 'created', 'accept: processing order without provider order → dispatches')

    // (j) admin order-detail envelope — the contract the admin UI unwraps
    r = await json(await fetch(api(`/api/orders/${orderId}`), { headers: { Authorization: `Bearer ${adminToken}` } }))
    assert(r.status === 200 && r.body.data?.order?.orderNumber === codFresh.orderNumber, 'GET /orders/:id (admin) → { data: { order } } envelope')
    assert(Boolean(r.body.data?.order?.shipmentTracking?.shipmentId), 'GET /orders/:id → Shiprocket references present in detail')

    // (k) Shiprocket webhook: token-authenticated, updates AWB/courier/status, idempotent
    const hookSend = async (bodyObj, tokenHeader) => {
      const headers = { 'Content-Type': 'application/json' }
      if (tokenHeader) headers['x-api-key'] = tokenHeader
      return json(await fetch(api('/api/webhooks/shiprocket'), { method: 'POST', headers, body: JSON.stringify(bodyObj) }))
    }
    const srHook = { awb: 'SMKAWB123', current_status: 'picked up', order_id: accDoc.orderNumber, courier_name: 'Delhivery', etd: '2026-08-25 10:00:00' }
    r = await hookSend(srHook, null)
    assert(r.status === 401, 'sr-webhook: missing token → 401')
    r = await hookSend(srHook, 'wrong-token')
    assert(r.status === 401, 'sr-webhook: wrong token → 401')
    r = await hookSend(srHook, 'sr-hook-token')
    let hooked = await Order.findById(acc._id).lean()
    assert(r.status === 200 && hooked.shipmentTracking.awb === 'SMKAWB123' && hooked.shipmentTracking.courier === 'Delhivery', 'sr-webhook: AWB + courier recorded')
    assert(hooked.orderStatus === 'shipped' && hooked.shipmentTracking.status === 'picked up', 'sr-webhook: picked up → order shipped')
    assert(hooked.shipmentTracking.estimatedDelivery instanceof Date || Boolean(hooked.shipmentTracking.estimatedDelivery), 'sr-webhook: ETA captured')
    r = await hookSend(srHook, 'sr-hook-token')
    assert(r.status === 200 && /duplicate/i.test(r.body.message || ''), 'sr-webhook: replayed event → duplicate ignored')
    r = await hookSend({ awb: 'SMKAWB123', current_status: 'delivered', order_id: accDoc.orderNumber }, 'sr-hook-token')
    hooked = await Order.findById(acc._id).lean()
    assert(r.status === 200 && hooked.orderStatus === 'delivered' && hooked.shipmentTracking.status === 'delivered', 'sr-webhook: delivered → order delivered')

    // analytics (admin)
    r = await json(await fetch(api('/api/analytics/overview'), { headers: { Authorization: `Bearer ${adminToken}` } }))
    assert(r.status === 200 && typeof r.body.data.totalRevenue === 'number', 'GET /analytics/overview (admin) → 200')
    r = await json(await fetch(api('/api/analytics/payments'), { headers: { Authorization: `Bearer ${adminToken}` } }))
    assert(r.status === 200 && 'successRate' in r.body.data, 'GET /analytics/payments → success rate')

    // ---- Phase 4b: payment hardening (verify/webhook idempotency + config) ----
    const inventorySvc = await import('../src/services/inventory.service.js')
    const { markOrderPaid } = await import('../src/controllers/payment.controller.js')
    const { execFileSync } = await import('node:child_process')
    const os = await import('node:os')

    const buyer = await User.findOne({ email: 'test@ysc.com' }).lean()
    const payProd = await Product.findOne({ _id: { $nin: [pid, pid2] }, isActive: true, stock: { $gte: 10 } }).lean()
    assert(Boolean(buyer && payProd), 'payment setup: buyer + dedicated product available')
    const payAddr = { fullName: 'Test User', phone: '9876543210', addressLine1: '1 Test St', city: 'Mumbai', state: 'MH', pincode: '400001' }

    /* Build a pending prepaid order the way createOrder does: reserve → order → payment. */
    const mkPrepaid = async (gatewayOrderId) => {
      await inventorySvc.reserveMany([{ product: payProd._id, quantity: 1 }])
      const o = await Order.create({
        user: buyer._id,
        items: [{ product: payProd._id, title: payProd.title, price: payProd.salePrice, quantity: 1 }],
        shippingAddress: payAddr,
        customerEmail: buyer.email,
        subtotal: payProd.salePrice,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: payProd.salePrice,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        inventoryReserved: true,
      })
      const p = await Payment.create({ user: buyer._id, order: o._id, amount: o.total, gateway: 'razorpay', gatewayOrderId, status: 'pending' })
      o.payment = p._id
      await o.save()
      return { o, p }
    }
    const stockOf = () => Product.findById(payProd._id).select('stock reservedStock soldCount').lean()
    const pointsOf = async () => (await User.findById(buyer._id).select('loyaltyPoints').lean()).loyaltyPoints
    const verifySig = (gwOrder, gwPay) =>
      cryptoMod.createHmac('sha256', 'rzp_test_secret_abcdef').update(`${gwOrder}|${gwPay}`).digest('hex')
    const hookBody = (gwId, payId, event = 'payment.captured') =>
      ({ event, payload: { payment: { entity: { id: payId, order_id: gwId, method: 'upi' } } } })
    const webhookPost = async (bodyObj, { eventId, signature } = {}) => {
      const raw = JSON.stringify(bodyObj)
      const headers = { 'Content-Type': 'application/json' }
      if (signature !== null) {
        headers['x-razorpay-signature'] =
          signature ?? cryptoMod.createHmac('sha256', 'whsec_test_123').update(raw).digest('hex')
      }
      if (eventId) headers['x-razorpay-event-id'] = eventId
      return json(await fetch(api('/api/webhooks/razorpay'), { method: 'POST', headers, body: raw }))
    }
    const verifyPost = async (body, bearer = token) =>
      json(
        await fetch(api('/api/payments/verify'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
          body: JSON.stringify(body),
        }),
      )

    // (1) verify-vs-webhook race: two callers with independently loaded stale docs
    // confirm the same payment concurrently — side effects must apply exactly once.
    const A = await mkPrepaid('order_SMK_RACE')
    const sR0 = await stockOf()
    const ptsR0 = await pointsOf()
    const [oA1, oA2] = await Promise.all([Order.findById(A.o._id), Order.findById(A.o._id)])
    const [pA1, pA2] = await Promise.all([Payment.findById(A.p._id), Payment.findById(A.p._id)])
    await Promise.all([
      markOrderPaid(oA1, pA1, { paymentId: 'pay_SMK_RACE' }),
      markOrderPaid(oA2, pA2, { paymentId: 'pay_SMK_RACE' }),
    ])
    const sR1 = await stockOf()
    const ptsR1 = await pointsOf()
    assert(sR1.soldCount === sR0.soldCount + 1, 'race: soldCount incremented exactly once')
    assert(sR1.stock === sR0.stock - 1 && sR1.reservedStock === sR0.reservedStock - 1, 'race: stock committed exactly once')
    assert(ptsR1 === ptsR0 + Math.floor(A.o.total / 100), 'race: loyalty awarded exactly once')
    const raceOrder = await Order.findById(A.o._id).lean()
    assert(raceOrder.paymentStatus === 'paid' && raceOrder.orderStatus === 'confirmed', 'race: order paid + confirmed')
    assert(
      raceOrder.timeline.filter((t) => t.status === 'paid').length === 1 &&
        raceOrder.timeline.filter((t) => t.status === 'confirmed').length === 1,
      'race: single paid/confirmed timeline entries',
    )
    assert((await Payment.findById(A.p._id).lean()).status === 'captured', 'race: payment captured')
    await sleep(300)
    let raceDoc = await Order.findById(A.o._id).lean()
    assert(!raceDoc.shipmentTracking?.shipmentId && !srCreates.has(raceDoc.orderNumber), 'race: capture alone does not dispatch (waits for admin accept)')
    r = await acceptPost(A.o._id)
    raceDoc = await Order.findById(A.o._id).lean()
    assert(r.status === 200 && srCreates.get(raceDoc.orderNumber) === 1, 'race: accept after concurrent capture → exactly one Shiprocket order')

    // (2) webhook security + idempotency over HTTP
    const B = await mkPrepaid('order_SMK_HOOK')
    r = await webhookPost(hookBody('order_SMK_HOOK', 'pay_SMK_HOOK'), { eventId: 'evt_smk_0', signature: null })
    assert(r.status === 401, 'webhook: missing signature → 401')
    r = await webhookPost(hookBody('order_SMK_HOOK', 'pay_SMK_HOOK'), { eventId: 'evt_smk_0', signature: 'deadbeef' })
    assert(r.status === 401, 'webhook: invalid signature → 401')
    assert((await Payment.findById(B.p._id).lean()).status === 'pending', 'webhook: rejected delivery causes no state change')

    const sH0 = await stockOf()
    const ptsH0 = await pointsOf()
    r = await webhookPost(hookBody('order_SMK_HOOK', 'pay_SMK_HOOK'), { eventId: 'evt_smk_1' })
    const pB = await Payment.findById(B.p._id).lean()
    assert(r.status === 200 && pB.status === 'captured' && pB.gatewayPaymentId === 'pay_SMK_HOOK' && pB.paymentMethod === 'upi', 'webhook: valid capture → payment captured w/ gateway ids')
    const sH1 = await stockOf()
    assert(sH1.soldCount === sH0.soldCount + 1 && sH1.reservedStock === sH0.reservedStock - 1, 'webhook: stock committed once')
    r = await webhookPost(hookBody('order_SMK_HOOK', 'pay_SMK_HOOK'), { eventId: 'evt_smk_1' })
    assert(r.status === 200 && /duplicate/i.test(r.body.message || ''), 'webhook: duplicate event id → ignored')
    r = await webhookPost(hookBody('order_SMK_HOOK', 'pay_SMK_HOOK'), { eventId: 'evt_smk_2' })
    const sH2 = await stockOf()
    const ptsH2 = await pointsOf()
    assert(
      r.status === 200 && sH2.soldCount === sH1.soldCount && ptsH2 === ptsH0 + Math.floor(B.o.total / 100),
      'webhook: re-notify of captured payment → no duplicate side effects',
    )
    await sleep(300)
    let hookOrderDoc = await Order.findById(B.o._id).lean()
    assert(!hookOrderDoc.shipmentTracking?.shipmentId && !srCreates.has(hookOrderDoc.orderNumber), 'webhook: replayed captures do not dispatch (waits for admin accept)')
    r = await acceptPost(B.o._id)
    hookOrderDoc = await Order.findById(B.o._id).lean()
    assert(r.status === 200 && srCreates.get(hookOrderDoc.orderNumber) === 1, 'webhook: accept after replayed captures → exactly one Shiprocket order')

    // (3) browser verification
    const C = await mkPrepaid('order_SMK_VER')
    const D = await mkPrepaid('order_SMK_VER2')

    // cross-order replay: a VALID signature for C's gateway order posted against D
    r = await verifyPost({
      orderId: D.o._id,
      razorpay_order_id: 'order_SMK_VER',
      razorpay_payment_id: 'pay_SMK_C',
      razorpay_signature: verifySig('order_SMK_VER', 'pay_SMK_C'),
    })
    assert(r.status === 400, 'verify: signature from a different order → 400')
    assert((await Payment.findById(D.p._id).lean()).status === 'pending', 'verify: mismatched gateway order leaves payment untouched')

    // non-owner cannot verify
    r = await verifyPost({ orderId: C.o._id, razorpay_order_id: 'order_SMK_VER', razorpay_payment_id: 'pay_SMK_C', razorpay_signature: verifySig('order_SMK_VER', 'pay_SMK_C') }, adminToken)
    assert(r.status === 403, 'verify: non-owner → 403')

    // invalid signature → 400, payment failed, reservation released exactly once
    const sD0 = await stockOf()
    r = await verifyPost({ orderId: D.o._id, razorpay_order_id: 'order_SMK_VER2', razorpay_payment_id: 'pay_SMK_D', razorpay_signature: 'bad' })
    const pD = await Payment.findById(D.p._id).lean()
    const sD1 = await stockOf()
    assert(r.status === 400 && pD.status === 'failed', 'verify: invalid signature → 400 + payment failed')
    assert(sD1.reservedStock === sD0.reservedStock - 1 && sD1.stock === sD0.stock, 'verify: failure releases the reservation')
    r = await verifyPost({ orderId: D.o._id, razorpay_order_id: 'order_SMK_VER2', razorpay_payment_id: 'pay_SMK_D', razorpay_signature: 'bad' })
    const sD2 = await stockOf()
    assert(r.status === 400 && sD2.reservedStock === sD1.reservedStock, 'verify: repeated failure does not release twice')

    // valid verification, then repeat → no duplicate side effects
    const sV0 = await stockOf()
    const ptsV0 = await pointsOf()
    r = await verifyPost({ orderId: C.o._id, razorpay_order_id: 'order_SMK_VER', razorpay_payment_id: 'pay_SMK_C', razorpay_signature: verifySig('order_SMK_VER', 'pay_SMK_C') })
    const pC = await Payment.findById(C.p._id).lean()
    const sV1 = await stockOf()
    assert(r.status === 200 && pC.status === 'captured', 'verify: valid signature → captured')
    assert(sV1.soldCount === sV0.soldCount + 1 && sV1.reservedStock === sV0.reservedStock - 1, 'verify: stock committed once')
    r = await verifyPost({ orderId: C.o._id, razorpay_order_id: 'order_SMK_VER', razorpay_payment_id: 'pay_SMK_C', razorpay_signature: verifySig('order_SMK_VER', 'pay_SMK_C') })
    const sV2 = await stockOf()
    const ptsV2 = await pointsOf()
    assert(
      r.status === 200 && /already/i.test(r.body.message || '') && sV2.soldCount === sV1.soldCount && ptsV2 === ptsV0 + Math.floor(C.o.total / 100),
      'verify: repeat verification → already-verified no-op',
    )
    await sleep(300)
    let verDoc = await Order.findById(C.o._id).lean()
    assert(!verDoc.shipmentTracking?.shipmentId && !srCreates.has(verDoc.orderNumber), 'verify: verification does not dispatch (waits for admin accept)')
    r = await acceptPost(C.o._id)
    verDoc = await Order.findById(C.o._id).lean()
    assert(r.status === 200 && srCreates.get(verDoc.orderNumber) === 1, 'verify: accept after repeated verification → exactly one Shiprocket order')
    const dOrderDoc = await Order.findById(D.o._id).lean()
    assert(
      !dOrderDoc.shipmentTracking?.shipmentId && !srCreates.has(dOrderDoc.orderNumber),
      'failed payment order (D) → never dispatched to Shiprocket',
    )

    // (4) production must refuse to boot with Razorpay keys but no webhook secret
    const envUrl = new URL('../src/config/env.js', import.meta.url).href
    const envBase = {
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/ysc-envtest',
      JWT_SECRET: 'smoke-secret-0123456789',
      JWT_REFRESH_SECRET: 'smoke-refresh-0123456789',
      RAZORPAY_KEY_ID: 'rzp_test_key',
      RAZORPAY_SECRET: 'rzp_test_secret',
    }
    const runEnvCheck = (overrides = {}) => {
      try {
        execFileSync(process.execPath, ['--input-type=module', '-e', `await import('${envUrl}')`], {
          env: { ...envBase, ...overrides },
          cwd: os.tmpdir(),
          stdio: 'pipe',
        })
        return { code: 0, stderr: '' }
      } catch (err) {
        return { code: err.status ?? 1, stderr: String(err.stderr || '') }
      }
    }
    const noSecret = runEnvCheck()
    assert(noSecret.code === 1 && noSecret.stderr.includes('RAZORPAY_WEBHOOK_SECRET'), 'env: prod + razorpay keys w/o webhook secret → boot refused')
    assert(runEnvCheck({ RAZORPAY_WEBHOOK_SECRET: 'whsec_x' }).code === 0, 'env: prod with webhook secret → boots')
    assert(runEnvCheck({ NODE_ENV: 'development' }).code === 0, 'env: development w/o webhook secret still allowed')

    // Shiprocket enabled in production requires the webhook token (audit fix)
    const srEnv = { RAZORPAY_WEBHOOK_SECRET: 'whsec_x', SHIPROCKET_EMAIL: 'sr@x.com', SHIPROCKET_PASSWORD: 'sr-pass' }
    const noSrToken = runEnvCheck(srEnv)
    assert(noSrToken.code === 1 && noSrToken.stderr.includes('SHIPROCKET_WEBHOOK_TOKEN'), 'env: prod + shiprocket creds w/o webhook token → boot refused')
    assert(runEnvCheck({ ...srEnv, SHIPROCKET_WEBHOOK_TOKEN: 'tok_x' }).code === 0, 'env: prod shiprocket with webhook token → boots')
    assert(runEnvCheck({ ...srEnv, NODE_ENV: 'development' }).code === 0, 'env: development w/o shiprocket token still allowed')

    // ---- Phase 5: admin CMS ----
    const adminHdr = { Authorization: `Bearer ${adminToken}` }

    // RBAC: normal user blocked from admin
    r = await json(await fetch(api('/api/admin/dashboard'), { headers: { Authorization: `Bearer ${token}` } }))
    assert(r.status === 403, 'RBAC: non-admin → 403 on /admin/dashboard')

    // admin me + permissions
    r = await json(await fetch(api('/api/admin/me'), { headers: adminHdr }))
    assert(r.status === 200 && Array.isArray(r.body.data.permissions) && r.body.data.permissions.length > 0, 'GET /admin/me → permissions')

    // dashboard
    r = await json(await fetch(api('/api/admin/dashboard'), { headers: adminHdr }))
    assert(r.status === 200 && typeof r.body.data.overview.totalRevenue === 'number' && Array.isArray(r.body.data.monthlyRevenue), 'GET /admin/dashboard → consolidated payload')

    // product duplicate
    r = await json(await fetch(api(`/api/admin/products/${pid}/duplicate`), { method: 'POST', headers: adminHdr }))
    assert(r.status === 201 && r.body.data.product.isActive === false, 'POST /admin/products/:id/duplicate → draft copy')

    // bulk update
    r = await json(await fetch(api('/api/admin/products/bulk'), { method: 'PATCH', headers: { ...adminHdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [pid], update: { featured: true } }) }))
    assert(r.status === 200 && r.body.data.modified === 1, 'PATCH /admin/products/bulk → 1 modified')

    // CSV export
    const csvRes = await fetch(api('/api/admin/products/export'), { headers: adminHdr })
    const csvText = await csvRes.text()
    assert(csvRes.status === 200 && csvRes.headers.get('content-type')?.includes('text/csv') && csvText.startsWith('Title,'), 'GET /admin/products/export → CSV')

    // customers + segments
    r = await json(await fetch(api('/api/admin/customers'), { headers: adminHdr }))
    assert(r.status === 200 && Array.isArray(r.body.data.customers), 'GET /admin/customers → list')
    r = await json(await fetch(api('/api/admin/customers/segments/summary'), { headers: adminHdr }))
    assert(r.status === 200 && typeof r.body.data.total === 'number', 'GET /admin/customers/segments → summary')

    // content CRUD (banner) + public read
    r = await json(await fetch(api('/api/admin/content/banners'), { method: 'POST', headers: { ...adminHdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Spring drop', placement: 'hero' }) }))
    assert(r.status === 201, 'POST /admin/content/banners → 201')
    r = await json(await fetch(api('/api/banners?placement=hero')))
    assert(r.status === 200 && r.body.data.banners.length >= 1, 'GET /banners (public) → active banner')

    // activity log captured the admin mutations
    await new Promise((res) => setTimeout(res, 250))
    r = await json(await fetch(api('/api/admin/activity'), { headers: adminHdr }))
    assert(r.status === 200 && r.body.data.activity.length >= 1, 'GET /admin/activity → audit trail recorded')

    // ---- product deletion: hard delete + reference cleanup vs archive ----
    // (a) product with NO orders → permanently deleted, cart line pulled
    r = await json(
      await fetch(api('/api/products'), {
        method: 'POST',
        headers: { ...adminHdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Deletable Test Bead', category: String(cats[0]._id), mrp: 10, salePrice: 5, stock: 3 }),
      }),
    )
    assert(r.status === 201 && r.body.data.product?._id, 'delete-flow: setup product created')
    const delId = r.body.data.product._id
    r = await json(
      await fetch(api('/api/cart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product: delId, quantity: 1 }),
      }),
    )
    assert(r.status === 201, 'delete-flow: setup product added to a customer cart')
    r = await json(await fetch(api(`/api/products/${delId}`), { method: 'DELETE', headers: adminHdr }))
    assert(r.status === 200 && r.body.data?.deleted === true, 'DELETE /products/:id (no orders) → permanently deleted')
    assert((await Product.findById(delId)) === null, 'delete-flow: product document is gone')
    r = await json(await fetch(api('/api/cart'), { headers: { Authorization: `Bearer ${token}` } }))
    assert(
      r.status === 200 && !(r.body.data.items || []).some((it) => String(it.product?._id) === String(delId)),
      'delete-flow: cart line for the deleted product was removed',
    )
    r = await json(await fetch(api(`/api/products/${delId}`), { method: 'DELETE', headers: adminHdr }))
    assert(r.status === 404, 'DELETE /products/:id (already gone) → 404')

    // (b) product WITH order references → archived, never hard-deleted
    const ordersBefore = await Order.countDocuments({})
    r = await json(await fetch(api(`/api/products/${pid}`), { method: 'DELETE', headers: adminHdr }))
    assert(r.status === 200 && r.body.data?.archived === true, 'DELETE /products/:id (has orders) → archived instead')
    const archived = await Product.findById(pid).lean()
    assert(Boolean(archived) && archived.isActive === false, 'delete-flow: order-referenced product kept, isActive=false')
    assert((await Order.countDocuments({})) === ordersBefore, 'delete-flow: orders untouched by archive')

    // 404
    r = await json(await fetch(api('/api/nope')))
    assert(r.status === 404, 'GET /api/nope → 404 notFound')

    // ---- Shiprocket global invariants ----
    // a confirmed order that was never accepted must never have been dispatched
    const untouchedDoc = await Order.findById(untouched._id).lean()
    assert(
      untouchedDoc.orderStatus === 'confirmed' && !untouchedDoc.shipmentTracking?.shipmentId && !srCreates.has(untouchedDoc.orderNumber),
      'shiprocket: confirmed order without accept → no provider order (entire run)',
    )
    // never a duplicate provider order anywhere in the run
    const srDups = [...srCreates.entries()].filter(([, n]) => n > 1)
    assert(
      srDups.length === 0,
      `shiprocket: no duplicate provider orders across the entire run${srDups.length ? ` (dups: ${srDups.map(([k]) => k).join(',')})` : ''}`,
    )
  } finally {
    server.close()
    srStub.close()
    await disconnectDB()
    await mongod.stop()
  }

  console.log(exitCode === 0 ? '\n✅ Smoke test passed' : '\n❌ Smoke test had failures')
  process.exit(exitCode)
}

main().catch((err) => {
  console.error('Smoke test crashed:', err)
  process.exit(1)
})
