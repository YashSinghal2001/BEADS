/*
 * Mappers: translate backend documents into the exact shapes the existing
 * premium UI already consumes. This is what lets us swap the data source
 * WITHOUT touching component markup.
 */
import {
  colorHex,
  badgeFromFlags,
  defaultHighlights,
  buildFaqs,
  FREE_SHIPPING_THRESHOLD,
} from '../lib/constants.js'

const uniq = (arr) => [...new Set(arr.filter(Boolean))]

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1)

/* ----------------------------- Category ------------------------------ */
export function normalizeCategory(c = {}) {
  return {
    id: c._id,
    name: c.name,
    slug: c.slug,
    tagline: c.description || '',
    count: c.productCount ?? 0,
    image: c.image?.url || '',
  }
}

/* ------------------------------ Product ------------------------------ */
export function normalizeProduct(p = {}) {
  const category = p.category && typeof p.category === 'object' ? p.category : null
  const colorNames = uniq((p.variants || []).map((v) => v.color))
  const price = p.salePrice ?? 0
  return {
    id: p._id,
    _id: p._id,
    name: p.title,
    title: p.title,
    slug: p.slug,
    price,
    compareAt: p.mrp && p.mrp > price ? p.mrp : null,
    rating: p.averageRating ?? 0,
    reviews: p.totalReviews ?? 0,
    image: p.images?.[0]?.url || '',
    images: (p.images || []).map((i) => i.url).filter(Boolean),
    material: p.specifications?.material || '',
    colorNames,
    colors: colorNames.length ? colorNames.map(colorHex) : ['#D4A373'],
    badge: badgeFromFlags(p),
    inStock: p.stockStatus !== 'out_of_stock',
    category: category?.slug || p.category || '',
    categoryName: category?.name || '',
    categorySlug: category?.slug || '',
    soldCount: p.soldCount ?? 0,
    createdAt: p.createdAt,
  }
}

export function normalizeProductDetail(p = {}) {
  const base = normalizeProduct(p)
  const isKit = base.categoryName?.toLowerCase().includes('kit')
  const sizes = uniq((p.variants || []).map((v) => v.size))
  return {
    ...base,
    video: p.videos?.[0]?.url || null,
    description:
      p.description ||
      `Crafted for makers who care about detail, the ${base.name} brings a refined, premium finish to every piece.`,
    shortDescription: p.shortDescription || '',
    highlights: defaultHighlights,
    variants: {
      size: sizes,
      color: base.colorNames,
    },
    specs: {
      Material: p.specifications?.material || '—',
      Finish: p.specifications?.finish || 'Glossy',
      'Hole Size': '1.2mm',
      'Pack Quantity': p.specifications?.packageContents || '50 beads',
      SKU: p.sku || '—',
      Origin: 'Imported · QC in India',
    },
    shipping: {
      dispatch: 'Ships within 24 hours',
      delivery: '3–6 business days across India',
      freeOver: FREE_SHIPPING_THRESHOLD,
      returns: '7-day easy returns on unopened packs',
    },
    faqs: buildFaqs(p.specifications?.material || 'beads', isKit),
    reviewList: [],
    ratingBreakdown: defaultBreakdown(base.rating),
  }
}

/* Rough breakdown when we only know the average (replaced by real review data). */
export function defaultBreakdown(avg = 0) {
  if (!avg) return [5, 4, 3, 2, 1].map((star) => ({ star, pct: 0 }))
  return [
    { star: 5, pct: 72 },
    { star: 4, pct: 19 },
    { star: 3, pct: 6 },
    { star: 2, pct: 2 },
    { star: 1, pct: 1 },
  ]
}

/* Compute a breakdown from a real list of reviews. */
export function breakdownFromReviews(reviews = []) {
  if (!reviews.length) return defaultBreakdown(0)
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => (counts[r.rating] = (counts[r.rating] || 0) + 1))
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: Math.round((counts[star] / reviews.length) * 100),
  }))
}

/* ------------------------------ Review ------------------------------- */
export function normalizeReview(r = {}) {
  return {
    id: r._id,
    name: r.user?.name || 'Customer',
    rating: r.rating,
    date: fmtDate(r.createdAt),
    verified: r.verifiedPurchase,
    title: r.title || 'Review',
    body: r.comment || '',
    adminReply: r.adminReply || '',
  }
}

/* ------------------------------- Cart -------------------------------- */
export function normalizeCart(data = {}) {
  const items = (data.items || []).map((it) => ({
    key: it._id,
    id: it.product?._id,
    slug: it.product?.slug,
    name: it.product?.title,
    image: it.product?.image || '',
    price: it.price,
    compareAt: it.compareAt ?? null,
    variant: it.variant || {},
    qty: it.quantity,
    inStock: it.inStock !== false,
  }))
  return {
    items,
    coupon: data.coupon || null,
    totals: data.totals || { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 },
    count: data.count ?? items.reduce((n, it) => n + it.qty, 0),
  }
}

/* ------------------------------ Order -------------------------------- */
export const ORDER_STATUS_TONE = {
  delivered: 'success',
  shipped: 'gold',
  packed: 'gold',
  processing: 'sand',
  confirmed: 'sand',
  pending: 'sand',
  cancelled: 'dark',
  returned: 'dark',
  refunded: 'dark',
}

export function normalizeOrder(o = {}) {
  const lastTimeline = o.timeline?.[o.timeline.length - 1]
  return {
    _id: o._id,
    id: o.orderNumber,
    date: fmtDate(o.createdAt),
    status: cap(o.orderStatus || 'pending'),
    statusKey: o.orderStatus,
    tone: ORDER_STATUS_TONE[o.orderStatus] || 'sand',
    total: o.total,
    paymentStatus: o.paymentStatus,
    tracking:
      o.shipmentTracking?.trackingUrl
        ? `Tracking: ${o.shipmentTracking.awb || 'assigned'}`
        : lastTimeline?.note || 'Order received',
    items: (o.items || []).map((it) => ({
      id: it.product,
      name: it.title,
      image: it.image,
      price: it.price,
      qty: it.quantity,
      variant: it.variant,
    })),
    raw: o,
  }
}
