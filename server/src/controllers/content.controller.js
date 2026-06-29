import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Banner, Testimonial, Faq } from '../models/Content.js'

const MODELS = { banners: Banner, testimonials: Testimonial, faqs: Faq }
const KEY = { banners: 'banners', testimonials: 'testimonials', faqs: 'faqs' }

function modelFor(resource) {
  const Model = MODELS[resource]
  if (!Model) throw ApiError.notFound('Unknown content type')
  return Model
}

/* GET /:resource (public — active only) */
export const listPublic = (resource) =>
  asyncHandler(async (req, res) => {
    const Model = modelFor(resource)
    const filter = { active: true }
    if (resource === 'banners' && req.query.placement) filter.placement = req.query.placement
    const items = await Model.find(filter).sort({ order: 1, createdAt: -1 }).lean()
    return sendSuccess(res, { data: { [KEY[resource]]: items } })
  })

/* GET admin/content/:resource (all) */
export const listAll = (resource) =>
  asyncHandler(async (req, res) => {
    const items = await modelFor(resource).find().sort({ order: 1, createdAt: -1 }).lean()
    return sendSuccess(res, { data: { [KEY[resource]]: items } })
  })

export const create = (resource) =>
  asyncHandler(async (req, res) => {
    const item = await modelFor(resource).create(req.body)
    return sendSuccess(res, { statusCode: 201, message: 'Created', data: { item } })
  })

export const update = (resource) =>
  asyncHandler(async (req, res) => {
    const item = await modelFor(resource).findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) throw ApiError.notFound('Not found')
    return sendSuccess(res, { message: 'Updated', data: { item } })
  })

export const remove = (resource) =>
  asyncHandler(async (req, res) => {
    const item = await modelFor(resource).findByIdAndDelete(req.params.id)
    if (!item) throw ApiError.notFound('Not found')
    return sendSuccess(res, { message: 'Deleted' })
  })

/* --- dynamic (resource taken from :resource param) for admin routes --- */
export const listAllAny = asyncHandler(async (req, res) => {
  const r = req.params.resource
  const items = await modelFor(r).find().sort({ order: 1, createdAt: -1 }).lean()
  return sendSuccess(res, { data: { [KEY[r]]: items } })
})

export const createAny = asyncHandler(async (req, res) => {
  const item = await modelFor(req.params.resource).create(req.body)
  return sendSuccess(res, { statusCode: 201, message: 'Created', data: { item } })
})

export const updateAny = asyncHandler(async (req, res) => {
  const item = await modelFor(req.params.resource).findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!item) throw ApiError.notFound('Not found')
  return sendSuccess(res, { message: 'Updated', data: { item } })
})

export const removeAny = asyncHandler(async (req, res) => {
  const item = await modelFor(req.params.resource).findByIdAndDelete(req.params.id)
  if (!item) throw ApiError.notFound('Not found')
  return sendSuccess(res, { message: 'Deleted' })
})
