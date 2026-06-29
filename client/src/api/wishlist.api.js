import { api } from './axios.js'
import { normalizeProduct } from './mappers.js'

export const wishlistApi = {
  async get() {
    const res = await api.get('/wishlist')
    return (res.data?.data?.products || []).map(normalizeProduct)
  },
  add: (productId) => api.post(`/wishlist/${productId}`).then((r) => r.data?.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data?.data),
  clear: () => api.delete('/wishlist').then((r) => r.data),
}

export default wishlistApi
