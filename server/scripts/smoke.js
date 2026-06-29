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

    // analytics (admin)
    r = await json(await fetch(api('/api/analytics/overview'), { headers: { Authorization: `Bearer ${adminToken}` } }))
    assert(r.status === 200 && typeof r.body.data.totalRevenue === 'number', 'GET /analytics/overview (admin) → 200')
    r = await json(await fetch(api('/api/analytics/payments'), { headers: { Authorization: `Bearer ${adminToken}` } }))
    assert(r.status === 200 && 'successRate' in r.body.data, 'GET /analytics/payments → success rate')

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

    // 404
    r = await json(await fetch(api('/api/nope')))
    assert(r.status === 404, 'GET /api/nope → 404 notFound')
  } finally {
    server.close()
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
