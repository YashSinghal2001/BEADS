import mongoose from 'mongoose'

const { Schema, model } = mongoose

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', maxlength: 120 },
    comment: { type: String, default: '', maxlength: 2000 },
    images: {
      type: [{ url: String, publicId: String }],
      default: [],
    },
    verifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    adminReply: { type: String, default: '' },
  },
  { timestamps: true },
)

/* One review per user per product */
reviewSchema.index({ user: 1, product: 1 }, { unique: true })

/* Recompute denormalised rating on the product */
reviewSchema.statics.recalcProduct = async function recalcProduct(productId) {
  const [agg] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  const Product = mongoose.model('Product')
  await Product.findByIdAndUpdate(productId, {
    averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    totalReviews: agg ? agg.count : 0,
  })
}

reviewSchema.post('save', function afterSave(doc) {
  doc.constructor.recalcProduct(doc.product)
})
reviewSchema.post('findOneAndDelete', function afterDelete(doc) {
  if (doc) mongoose.model('Review').recalcProduct(doc.product)
})

export const Review = model('Review', reviewSchema)
export default Review
