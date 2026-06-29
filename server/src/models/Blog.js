import mongoose from 'mongoose'
import { slugify } from '../utils/slugify.js'

const { Schema, model } = mongoose

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, default: '', maxlength: 320 },
    content: { type: String, default: '' },
    featuredImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    category: { type: String, default: 'General', index: true },
    tags: { type: [String], default: [], index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      metaKeywords: { type: [String], default: [] },
    },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
)

blogSchema.pre('validate', function setSlug(next) {
  if (this.isModified('title') || !this.slug) this.slug = slugify(this.title)
  next()
})

blogSchema.pre('save', function setPublishedAt(next) {
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  next()
})

blogSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' })

export const Blog = model('Blog', blogSchema)
export default Blog
