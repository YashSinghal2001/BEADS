import { api } from './axios.js'
import { normalizeOrder } from './mappers.js'

export const orderApi = {
  async create(payload) {
    const res = await api.post('/orders', payload)
    return { order: normalizeOrder(res.data?.data?.order), payment: res.data?.data?.payment }
  },
  async list(params = {}) {
    const res = await api.get('/orders', { params })
    return {
      orders: (res.data?.data?.orders || []).map(normalizeOrder),
      meta: res.data?.meta,
    }
  },
  async get(id) {
    const res = await api.get(`/orders/${id}`)
    return normalizeOrder(res.data?.data?.order)
  },
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }).then((r) => normalizeOrder(r.data?.data?.order)),
  return: (id, reason) => api.patch(`/orders/${id}/return`, { reason }).then((r) => normalizeOrder(r.data?.data?.order)),
  reorder: (id) => api.post(`/orders/${id}/reorder`).then((r) => r.data?.data),

  async downloadInvoice(id, orderNumber = 'invoice') {
    const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${orderNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
}

export default orderApi
