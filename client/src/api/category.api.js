import { api } from './axios.js'
import { normalizeCategory } from './mappers.js'

export const categoryApi = {
  async list({ featured } = {}) {
    const res = await api.get('/categories', { params: featured ? { featured: 'true' } : {} })
    return (res.data?.data?.categories || []).map(normalizeCategory)
  },

  async getBySlug(slug) {
    const res = await api.get(`/categories/${slug}`)
    return normalizeCategory(res.data?.data?.category)
  },
}

export default categoryApi
