import mongoose from 'mongoose'

const { Schema, model } = mongoose

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true },
)

export const Wishlist = model('Wishlist', wishlistSchema)
export default Wishlist
