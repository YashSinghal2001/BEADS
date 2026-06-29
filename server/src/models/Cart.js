import mongoose from 'mongoose'

const { Schema, model } = mongoose

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: {
      color: { type: String, default: '' },
      size: { type: String, default: '' },
      sku: { type: String, default: '' },
    },
    quantity: { type: Number, required: true, min: 1, max: 99, default: 1 },
    priceAtAdd: { type: Number, required: true }, // snapshot for price-change detection
  },
  { _id: true },
)

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    coupon: {
      code: { type: String, default: null },
      type: { type: String, default: null },
      amount: { type: Number, default: 0 },
    },
    // Computed totals are persisted on update for fast reads
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Cart = model('Cart', cartSchema)
export default Cart
