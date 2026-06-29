import { api } from './axios.js'
import { normalizeCart } from './mappers.js'

const cart = (res) => normalizeCart(res.data?.data)

export const cartApi = {
  get: () => api.get('/cart').then(cart),
  add: (payload) => api.post('/cart', payload).then(cart),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }).then(cart),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`).then(cart),
  clear: () => api.delete('/cart').then(cart),
  applyCoupon: (code) => api.post('/cart/coupon', { code }).then(cart),
  removeCoupon: () => api.delete('/cart/coupon').then(cart),
}

export default cartApi
