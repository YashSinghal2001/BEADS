import { Product } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'
import { logger } from '../utils/logger.js'

/* Expression that recomputes stockStatus from (stock - reservedStock). */
const stockStatusExpr = {
  $let: {
    vars: { avail: { $subtract: ['$stock', '$reservedStock'] } },
    in: {
      $switch: {
        branches: [
          { case: { $lte: ['$$avail', 0] }, then: 'out_of_stock' },
          { case: { $lte: ['$$avail', '$lowStockThreshold'] }, then: 'low_stock' },
        ],
        default: 'in_stock',
      },
    },
  },
}

/**
 * Atomically reserve stock for a single product. The conditional filter
 * (`$expr available >= qty`) means two concurrent reservations can never both
 * succeed beyond what's available — this is the race-prevention guarantee.
 * Returns true if reserved.
 */
export async function reserve(productId, qty) {
  const res = await Product.updateOne(
    {
      _id: productId,
      isActive: true,
      $expr: { $gte: [{ $subtract: ['$stock', '$reservedStock'] }, qty] },
    },
    [{ $set: { reservedStock: { $add: ['$reservedStock', qty] } } }, { $set: { stockStatus: stockStatusExpr } }],
  )
  return res.modifiedCount === 1
}

/** Release a previously reserved quantity (floored at 0). */
export async function release(productId, qty) {
  await Product.updateOne({ _id: productId }, [
    { $set: { reservedStock: { $max: [0, { $subtract: ['$reservedStock', qty] }] } } },
    { $set: { stockStatus: stockStatusExpr } },
  ])
}

/** Commit a reservation → deduct from stock, drop the reservation, bump soldCount. */
export async function commit(productId, qty) {
  await Product.updateOne({ _id: productId }, [
    {
      $set: {
        stock: { $max: [0, { $subtract: ['$stock', qty] }] },
        reservedStock: { $max: [0, { $subtract: ['$reservedStock', qty] }] },
        soldCount: { $add: ['$soldCount', qty] },
      },
    },
    { $set: { stockStatus: stockStatusExpr } },
  ])
  await checkLowStock(productId)
}

/* ---------- batch helpers (with rollback on partial failure) ---------- */
const lineList = (items) => items.map((it) => ({ id: it.product, qty: it.quantity }))

export async function reserveMany(items) {
  const lines = lineList(items)
  const reserved = []
  for (const line of lines) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await reserve(line.id, line.qty)
    if (!ok) {
      // rollback what we reserved so far
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(reserved.map((r) => release(r.id, r.qty)))
      throw ApiError.badRequest('Insufficient stock for one or more items')
    }
    reserved.push(line)
  }
  return true
}

export async function releaseMany(items) {
  await Promise.all(lineList(items).map((l) => release(l.id, l.qty)))
}

export async function commitMany(items) {
  await Promise.all(lineList(items).map((l) => commit(l.id, l.qty)))
}

async function checkLowStock(productId) {
  const p = await Product.findById(productId).select('title stock reservedStock lowStockThreshold stockStatus').lean()
  if (!p) return
  const available = p.stock - p.reservedStock
  if (available <= p.lowStockThreshold) {
    logger.warn(`⚠️  Low stock alert: ${p.title} (${available} available)`)
  }
}

export default { reserve, release, commit, reserveMany, releaseMany, commitMany }
