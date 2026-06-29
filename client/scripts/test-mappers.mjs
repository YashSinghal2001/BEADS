/* Pure unit test for the API mappers (no Vite/DOM needed). */
import {
  normalizeProduct,
  normalizeProductDetail,
  normalizeCart,
  normalizeOrder,
  normalizeReview,
} from '../src/api/mappers.js'

let failed = 0
const eq = (actual, expected, label) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${ok ? '' : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`)
  if (!ok) failed++
}
const truthy = (v, label) => {
  console.log(`${v ? '  ✓' : '  ✗'} ${label}`)
  if (!v) failed++
}

const backendProduct = {
  _id: 'p1',
  title: 'Iridescent Acrylic Mix — Blush',
  slug: 'iridescent-acrylic-mix-blush-ab12',
  salePrice: 349,
  mrp: 499,
  averageRating: 4.9,
  totalReviews: 214,
  images: [{ url: 'https://img/1' }, { url: 'https://img/2' }],
  videos: [],
  specifications: { material: 'Acrylic', finish: 'Matte', packageContents: '50 beads' },
  sku: 'YSC-ABCD1234',
  stockStatus: 'in_stock',
  bestSeller: true,
  variants: [
    { color: 'Gold', size: '8mm', sku: 'YSC-p1-G8' },
    { color: 'Cream', size: '10mm', sku: 'YSC-p1-C10' },
  ],
  category: { _id: 'c1', name: 'Acrylic Beads', slug: 'acrylic-beads' },
}

console.log('normalizeProduct')
const p = normalizeProduct(backendProduct)
eq(p.name, 'Iridescent Acrylic Mix — Blush', 'name ← title')
eq(p.price, 349, 'price ← salePrice')
eq(p.compareAt, 499, 'compareAt ← mrp (since > price)')
eq(p.rating, 4.9, 'rating ← averageRating')
eq(p.reviews, 214, 'reviews ← totalReviews')
eq(p.image, 'https://img/1', 'image ← images[0].url')
eq(p.material, 'Acrylic', 'material ← specifications.material')
eq(p.colorNames, ['Gold', 'Cream'], 'colorNames ← variant colors')
eq(p.colors.length, 2, 'colors mapped to hex')
eq(p.badge, 'Best Seller', 'badge ← bestSeller flag')
eq(p.inStock, true, 'inStock ← stockStatus')
eq(p.category, 'acrylic-beads', 'category ← populated slug')
eq(p.categoryName, 'Acrylic Beads', 'categoryName ← populated name')

console.log('normalizeProductDetail')
const d = normalizeProductDetail(backendProduct)
eq(d.variants.size, ['8mm', '10mm'], 'detail variant sizes')
eq(d.variants.color, ['Gold', 'Cream'], 'detail variant colors')
eq(d.specs.SKU, 'YSC-ABCD1234', 'specs.SKU ← sku')
eq(d.specs.Material, 'Acrylic', 'specs.Material')
eq(d.shipping.freeOver, 999, 'shipping freeOver constant')
eq(d.faqs.length, 4, 'faqs generated')
truthy(Array.isArray(d.ratingBreakdown), 'ratingBreakdown present')

console.log('normalizeCart')
const cart = normalizeCart({
  items: [
    {
      _id: 'i1',
      product: { _id: 'p1', title: 'X', slug: 'x', image: 'u', stockStatus: 'in_stock', mrp: 499 },
      variant: { color: 'Gold', size: '8mm' },
      quantity: 2,
      price: 349,
      compareAt: 499,
      inStock: true,
    },
  ],
  coupon: { code: 'WELCOME10', type: 'percent', amount: 10 },
  totals: { subtotal: 698, discount: 70, shipping: 79, tax: 19, total: 726 },
  count: 2,
})
eq(cart.items[0].key, 'i1', 'cart item key ← _id')
eq(cart.items[0].name, 'X', 'cart item name ← product.title')
eq(cart.items[0].qty, 2, 'cart item qty ← quantity')
eq(cart.items[0].compareAt, 499, 'cart item compareAt')
eq(cart.totals.total, 726, 'cart totals pass through')
eq(cart.count, 2, 'cart count')

console.log('normalizeOrder')
const order = normalizeOrder({
  _id: 'o1',
  orderNumber: 'YSC-10428',
  orderStatus: 'delivered',
  total: 1297,
  createdAt: '2026-06-12T00:00:00.000Z',
  items: [{ product: 'p1', title: 'X', image: 'u', price: 349, quantity: 2 }],
  timeline: [{ status: 'delivered', note: 'Delivered' }],
})
eq(order.id, 'YSC-10428', 'order id ← orderNumber')
eq(order.status, 'Delivered', 'order status capitalised')
eq(order.tone, 'success', 'order tone for delivered')
eq(order.items[0].name, 'X', 'order item name ← title')
eq(order.items[0].qty, 2, 'order item qty ← quantity')

console.log('normalizeReview')
const review = normalizeReview({ _id: 'r1', user: { name: 'Aarohi' }, rating: 5, comment: 'Great', verifiedPurchase: true, createdAt: '2026-06-01T00:00:00.000Z' })
eq(review.name, 'Aarohi', 'review name ← user.name')
eq(review.verified, true, 'review verified ← verifiedPurchase')
eq(review.body, 'Great', 'review body ← comment')

console.log(failed === 0 ? '\n✅ All mapper assertions passed' : `\n❌ ${failed} assertion(s) failed`)
process.exit(failed === 0 ? 0 : 1)
