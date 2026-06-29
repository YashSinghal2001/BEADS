import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { uniqueSuffix } from '../utils/slugify.js'

const { Schema, model } = mongoose

/* ----------------------------- Address ------------------------------- */
export const addressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true },
)

/* --------------------------- Notification ---------------------------- */
const notificationSchema = new Schema(
  {
    type: { type: String, enum: ['order', 'promo', 'system'], default: 'system' },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true },
)

/* -------------------------- Refresh token ---------------------------- */
const refreshTokenSchema = new Schema(
  {
    token: { type: String, required: true }, // sha256 hash of the JWT
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { _id: true, timestamps: true },
)

/* ------------------------------ User --------------------------------- */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: {
      type: String,
      enum: ['user', 'support', 'warehouse', 'manager', 'admin', 'super_admin'],
      default: 'user',
      index: true,
    },
    permissions: { type: [String], default: [] }, // optional per-user overrides

    // Admin CRM
    adminNotes: {
      type: [
        new Schema(
          { note: String, by: String, at: { type: Date, default: Date.now } },
          { _id: true },
        ),
      ],
      default: [],
    },
    tags: { type: [String], default: [] },

    // Wholesale / B2B
    isWholesale: { type: Boolean, default: false, index: true },
    wholesaleTier: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none' },
    businessName: { type: String, default: '' },
    gstin: { type: String, default: '' },

    addresses: { type: [addressSchema], default: [] },
    notifications: { type: [notificationSchema], default: [] },

    loyaltyPoints: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },

    // OTP / reset (hashed, transient)
    otpHash: { type: String, select: false, default: null },
    otpExpires: { type: Date, select: false, default: null },
    resetTokenHash: { type: String, select: false, default: null },
    resetTokenExpires: { type: Date, select: false, default: null },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

/* Virtuals linking to normalised cart/wishlist collections */
userSchema.virtual('cart', {
  ref: 'Cart',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
})
userSchema.virtual('wishlist', {
  ref: 'Wishlist',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
})

/* Hash password on change */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

/* Generate a referral code on creation */
userSchema.pre('validate', function genReferral(next) {
  if (!this.referralCode) {
    const base = (this.name || 'YSC').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'YSC'
    this.referralCode = `${base}${uniqueSuffix(5).toUpperCase()}`
  }
  next()
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshTokens
  delete obj.otpHash
  delete obj.otpExpires
  delete obj.resetTokenHash
  delete obj.resetTokenExpires
  return obj
}

export const User = model('User', userSchema)
export default User
