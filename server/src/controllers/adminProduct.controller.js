import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Product } from '../models/Product.js'
import { Category } from '../models/Category.js'
import { toCSV, parseCSV } from '../services/csv.service.js'

/* POST /admin/products/:id/duplicate */
export const duplicateProduct = asyncHandler(async (req, res) => {
  const src = await Product.findById(req.params.id).lean()
  if (!src) throw ApiError.notFound('Product not found')
  // eslint-disable-next-line no-unused-vars
  const { _id, slug, sku, createdAt, updatedAt, soldCount, averageRating, totalReviews, ...rest } = src
  const copy = await Product.create({
    ...rest,
    title: `${src.title} (Copy)`,
    slug: undefined,
    sku: undefined,
    isActive: false, // draft
    soldCount: 0,
    averageRating: 0,
    totalReviews: 0,
  })
  return sendSuccess(res, { statusCode: 201, message: 'Product duplicated', data: { product: copy } })
})

/* PATCH /admin/products/bulk — { ids:[], update:{} } */
export const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, update } = req.body
  if (!Array.isArray(ids) || !ids.length) throw ApiError.badRequest('No product ids provided')
  const allowed = ['isActive', 'featured', 'trending', 'bestSeller', 'newArrival', 'category', 'lowStockThreshold']
  const patch = {}
  for (const k of allowed) if (update?.[k] !== undefined) patch[k] = update[k]
  if (!Object.keys(patch).length) throw ApiError.badRequest('No valid fields to update')
  const result = await Product.updateMany({ _id: { $in: ids } }, { $set: patch })
  return sendSuccess(res, { message: `Updated ${result.modifiedCount} product(s)`, data: { modified: result.modifiedCount } })
})

/* GET /admin/products/export — CSV download */
export const exportCsv = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category', 'name').lean()
  const csv = toCSV(products, [
    { key: 'title', label: 'Title' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category', value: (p) => p.category?.name || '' },
    { key: 'mrp', label: 'MRP' },
    { key: 'salePrice', label: 'SalePrice' },
    { key: 'stock', label: 'Stock' },
    { key: 'stockStatus', label: 'StockStatus' },
    { key: 'isActive', label: 'Active' },
  ])
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="products.csv"')
  res.send(csv)
})

/* POST /admin/products/import — { csv } text body */
export const importCsv = asyncHandler(async (req, res) => {
  const text = req.body?.csv
  if (!text || typeof text !== 'string') throw ApiError.badRequest('Provide CSV text in the "csv" field')
  const rows = parseCSV(text)
  if (!rows.length) throw ApiError.badRequest('No rows found in CSV')

  const categories = await Category.find().select('name').lean()
  const catByName = categories.reduce((a, c) => ({ ...a, [c.name.toLowerCase()]: c._id }), {})
  const fallbackCat = categories[0]?._id

  let created = 0
  let updated = 0
  const errors = []
  for (const row of rows) {
    try {
      const categoryId = catByName[(row.Category || '').toLowerCase()] || fallbackCat
      const doc = {
        title: row.Title,
        category: categoryId,
        mrp: Number(row.MRP) || 0,
        salePrice: Number(row.SalePrice) || Number(row.MRP) || 0,
        stock: Number(row.Stock) || 0,
        isActive: row.Active !== 'false',
      }
      if (!doc.title) throw new Error('Missing Title')
      if (row.SKU) {
        const existing = await Product.findOne({ sku: row.SKU })
        if (existing) {
          Object.assign(existing, doc)
          await existing.save()
          updated += 1
          continue
        }
      }
      await Product.create(doc)
      created += 1
    } catch (err) {
      errors.push({ row: row.Title || '(unknown)', error: err.message })
    }
  }
  return sendSuccess(res, { message: `Imported ${created} created, ${updated} updated`, data: { created, updated, errors } })
})
