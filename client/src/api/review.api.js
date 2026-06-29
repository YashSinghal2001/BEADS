import { api } from './axios.js'
import { normalizeReview } from './mappers.js'

export const reviewApi = {
  async forProduct(productId, params = {}) {
    const res = await api.get(`/reviews/product/${productId}`, { params })
    return {
      reviews: (res.data?.data?.reviews || []).map(normalizeReview),
      meta: res.data?.meta,
    }
  },
  create: (payload) => api.post('/reviews', payload).then((r) => normalizeReview(r.data?.data?.review)),
  update: (id, payload) => api.patch(`/reviews/${id}`, payload).then((r) => normalizeReview(r.data?.data?.review)),
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
  helpful: (id) => api.post(`/reviews/${id}/helpful`).then((r) => r.data?.data),
}

export default reviewApi
