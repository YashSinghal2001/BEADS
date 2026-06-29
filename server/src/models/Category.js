import mongoose from 'mongoose'
import { slugify } from '../utils/slugify.js'

const { Schema, model } = mongoose

const seoSchema = new Schema(
  {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: [String], default: [] },
  },
  { _id: false },
)

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true },
)

categorySchema.pre('validate', function setSlug(next) {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name)
  next()
})

categorySchema.index({ order: 1, name: 1 })

export const Category = model('Category', categorySchema)
export default Category
