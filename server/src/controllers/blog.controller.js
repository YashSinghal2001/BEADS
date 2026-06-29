import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Blog } from '../models/Blog.js'
import { getPagination, buildMeta } from '../utils/pagination.js'

/* GET /blogs */
export const listBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 9 })
  const filter = { published: true }
  if (req.query.category) filter.category = req.query.category
  if (req.query.q) filter.$text = { $search: req.query.q }
  if (req.query.tag) filter.tags = req.query.tag

  const [blogs, total] = await Promise.all([
    Blog.find(filter).select('-content').sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ])
  return sendSuccess(res, { data: { blogs }, meta: buildMeta({ page, limit, total }) })
})

/* GET /blogs/:slug */
export const getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, published: true },
    { $inc: { views: 1 } },
    { new: true },
  )
    .populate('author', 'name avatar')
    .lean()
  if (!blog) throw ApiError.notFound('Blog post not found')

  const related = await Blog.find({
    _id: { $ne: blog._id },
    published: true,
    category: blog.category,
  })
    .select('title slug excerpt featuredImage publishedAt')
    .limit(3)
    .lean()

  return sendSuccess(res, { data: { blog, related } })
})

/* ------------------------------ Admin ------------------------------- */
export const listAllBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 }).select('-content').lean()
  return sendSuccess(res, { data: { blogs } })
})

export const createBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.create({ ...req.body, author: req.user._id })
  return sendSuccess(res, { statusCode: 201, message: 'Blog created', data: { blog } })
})

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id)
  if (!blog) throw ApiError.notFound('Blog not found')
  Object.assign(blog, req.body)
  await blog.save()
  return sendSuccess(res, { message: 'Blog updated', data: { blog } })
})

export const deleteBlog = asyncHandler(async (req, res) => {
  const deleted = await Blog.findByIdAndDelete(req.params.id)
  if (!deleted) throw ApiError.notFound('Blog not found')
  return sendSuccess(res, { message: 'Blog deleted' })
})
