import mongoose from 'mongoose'
import { slugify, uniqueSuffix } from '../utils/slugify.js'

const { Schema, model } = mongoose

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  { _id: false },
)

const variantSchema = new Schema(
  {
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    sku: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: null }, // null → inherit salePrice
    images: { type: [mediaSchema], default: [] },
  },
  { _id: true },
)

const dimensionsSchema = new Schema(
  {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    unit: { type: String, default: 'cm' },
  },
  { _id: false },
)

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },
    shortDescription: { type: String, default: '', maxlength: 300 },
    description: { type: String, default: '' },

    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subCategory: { type: String, default: '' },
    tags: { type: [String], default: [], index: true },

    sku: { type: String, unique: true, index: true },
    barcode: { type: String, default: '', index: true },
    brand: { type: String, default: 'YS Creations' },

    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    bestSeller: { type: Boolean, default: false, index: true },
    newArrival: { type: Boolean, default: false, index: true },

    // Pricing
    mrp: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // Inventory
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
      index: true,
    },

    // Wholesale tier pricing (applied for B2B customers by min quantity)
    tierPricing: {
      type: [
        new Schema({ minQty: { type: Number, required: true }, price: { type: Number, required: true } }, { _id: false }),
      ],
      default: [],
    },
    moq: { type: Number, default: 1 }, // minimum order quantity (wholesale)

    // Personalization / customization
    customization: {
      enabled: { type: Boolean, default: false },
      beadColors: { type: [String], default: [] },
      packaging: { type: [String], default: [] }, // e.g. ['Gift box', 'Pouch']
      engraving: {
        enabled: { type: Boolean, default: false },
        maxChars: { type: Number, default: 20 },
        pricePerItem: { type: Number, default: 0 },
      },
    },

    // Media
    images: { type: [mediaSchema], default: [] },
    videos: { type: [mediaSchema], default: [] },

    // Variants
    variants: { type: [variantSchema], default: [] },

    // Specifications
    specifications: {
      material: { type: String, default: '' },
      dimensions: { type: dimensionsSchema, default: () => ({}) },
      weight: { type: Number, default: 0 }, // grams
      finish: { type: String, default: '' },
      packageContents: { type: String, default: '' },
    },

    // SEO
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      metaKeywords: { type: [String], default: [] },
    },

    // Ratings (denormalised from reviews)
    averageRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    totalReviews: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0, index: true },

    // Shipping
    shipping: {
      weight: { type: Number, default: 0 },
      dimensions: { type: dimensionsSchema, default: () => ({}) },
      shippingClass: { type: String, default: 'standard' },
    },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

/* Available stock = stock − reserved */
productSchema.virtual('availableStock').get(function availableStock() {
  return Math.max(0, (this.stock || 0) - (this.reservedStock || 0))
})

/* Derive slug, discount and stock status before save */
productSchema.pre('validate', function derive(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = `${slugify(this.title)}-${uniqueSuffix(4)}`
  }
  if (!this.sku) {
    this.sku = `YSC-${uniqueSuffix(8).toUpperCase()}`
  }
  next()
})

productSchema.pre('save', function computeFields(next) {
  if (this.mrp > 0 && this.salePrice >= 0) {
    this.discountPercentage = Math.round(((this.mrp - this.salePrice) / this.mrp) * 100)
  }
  const available = Math.max(0, (this.stock || 0) - (this.reservedStock || 0))
  if (available <= 0) this.stockStatus = 'out_of_stock'
  else if (available <= (this.lowStockThreshold || 0)) this.stockStatus = 'low_stock'
  else this.stockStatus = 'in_stock'
  next()
})

/* Full-text search across the most relevant fields */
productSchema.index(
  { title: 'text', shortDescription: 'text', description: 'text', tags: 'text', brand: 'text' },
  { weights: { title: 10, tags: 6, shortDescription: 4, description: 1, brand: 2 }, name: 'product_text' },
)

/* Common query/sort patterns */
productSchema.index({ category: 1, isActive: 1 })
productSchema.index({ salePrice: 1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ soldCount: -1 })

export const Product = model('Product', productSchema)
export default Product
