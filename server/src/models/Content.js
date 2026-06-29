import mongoose from 'mongoose'

const { Schema, model } = mongoose

export const Banner = model(
  'Banner',
  new Schema(
    {
      title: { type: String, required: true },
      subtitle: { type: String, default: '' },
      image: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      link: { type: String, default: '' },
      cta: { type: String, default: 'Shop now' },
      placement: { type: String, enum: ['hero', 'promo', 'collection'], default: 'promo', index: true },
      active: { type: Boolean, default: true, index: true },
      order: { type: Number, default: 0 },
      startsAt: { type: Date, default: null },
      endsAt: { type: Date, default: null },
    },
    { timestamps: true },
  ),
)

export const Testimonial = model(
  'Testimonial',
  new Schema(
    {
      name: { type: String, required: true },
      role: { type: String, default: '' },
      quote: { type: String, required: true },
      rating: { type: Number, default: 5, min: 1, max: 5 },
      avatar: { type: String, default: '' },
      active: { type: Boolean, default: true, index: true },
      order: { type: Number, default: 0 },
    },
    { timestamps: true },
  ),
)

export const Faq = model(
  'Faq',
  new Schema(
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
      category: { type: String, default: 'General', index: true },
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true, index: true },
    },
    { timestamps: true },
  ),
)

export default { Banner, Testimonial, Faq }
