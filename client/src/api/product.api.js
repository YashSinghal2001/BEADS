import { api } from './axios.js'
import { normalizeProduct, normalizeProductDetail } from './mappers.js'

export const productApi = {
  /** List/search/filter/sort/paginate. Returns { products, meta }. */
  async list(params = {}) {
    const res = await api.get('/products', { params })
    return {
      products: (res.data?.data?.products || []).map(normalizeProduct),
      meta: res.data?.meta || { page: 1, pages: 1, total: 0 },
    }
  },

  async getBySlug(slug) {
    const res = await api.get(`/products/${slug}`)
    return normalizeProductDetail(res.data?.data?.product)
  },

  async related(slug) {
    const res = await api.get(`/products/${slug}/related`)
    return (res.data?.data?.products || []).map(normalizeProduct)
  },

  async autocomplete(q) {
    const res = await api.get('/products/search/autocomplete', { params: { q } })
    return res.data?.data?.results || []
  },

  async suggestions() {
    const res = await api.get('/products/search/suggestions')
    return res.data?.data?.suggestions || []
  },
}

export default productApi
