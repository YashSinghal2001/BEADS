import axios from 'axios'

const TOKEN_KEY = 'ysc-admin-token'
export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

let onLogout = null
export const setLogoutHandler = (fn) => {
  onLogout = fn
}

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})
const refreshClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true })

client.interceptors.request.use((config) => {
  const t = tokenStore.get()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

let refreshing = false
let waiters = []
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error
    if (!response || !config || response.status !== 401 || config._retry || config.url?.includes('/auth/')) {
      return Promise.reject(error)
    }
    config._retry = true
    if (refreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => (token ? resolve(client({ ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } })) : reject(error)))
      })
    }
    refreshing = true
    try {
      const r = await refreshClient.post('/auth/refresh')
      const token = r.data?.data?.accessToken
      tokenStore.set(token)
      waiters.forEach((cb) => cb(token))
      waiters = []
      return client({ ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } })
    } catch (e) {
      waiters.forEach((cb) => cb(null))
      waiters = []
      tokenStore.set(null)
      onLogout?.()
      return Promise.reject(e)
    } finally {
      refreshing = false
    }
  },
)

export const apiError = (err) =>
  err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || err?.message || 'Something went wrong'

const d = (r) => r.data?.data
const dm = (r) => ({ ...r.data?.data, _meta: r.data?.meta })

/* --------------------------- Endpoints ------------------------------- */
export const api = {
  // auth
  login: (payload) => client.post('/auth/login', payload).then(d),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  me: () => client.get('/admin/me').then(d),

  // dashboard / analytics / activity
  dashboard: () => client.get('/admin/dashboard').then(d),
  activity: (params) => client.get('/admin/activity', { params }).then(dm),
  couponAnalytics: () => client.get('/admin/coupons/analytics').then(d),

  // products
  products: (params) => client.get('/products', { params: { includeInactive: 'true', ...params } }).then(dm),
  product: (slug) => client.get(`/products/${slug}`).then(d),
  createProduct: (body) => client.post('/products', body).then(d),
  updateProduct: (id, body) => client.patch(`/products/${id}`, body).then(d),
  deleteProduct: (id) => client.delete(`/products/${id}`).then((r) => r.data),
  duplicateProduct: (id) => client.post(`/admin/products/${id}/duplicate`).then(d),
  bulkProducts: (ids, update) => client.patch('/admin/products/bulk', { ids, update }).then(d),
  importProducts: (csv) => client.post('/admin/products/import', { csv }).then(d),
  async exportProducts() {
    const res = await client.get('/admin/products/export', { responseType: 'blob' })
    downloadBlob(res.data, 'products.csv', 'text/csv')
  },

  // categories
  categories: () => client.get('/categories').then(d),
  createCategory: (body) => client.post('/categories', body).then(d),

  // orders
  orders: (params) => client.get('/orders/admin/all', { params }).then(dm),
  order: (id) => client.get(`/orders/${id}`).then(d).then((x) => x?.order ?? x),
  updateOrderStatus: (id, body) => client.patch(`/orders/${id}/status`, body).then(d),
  acceptOrder: (id) => client.post(`/orders/${id}/accept`).then(d),
  refundOrder: (id, amount) => client.post(`/admin/orders/${id}/refund`, { amount }).then(d),
  shipOrder: (id) => client.post(`/orders/${id}/ship`).then(d),
  async downloadInvoice(id, orderNumber) {
    const res = await client.get(`/orders/${id}/invoice`, { responseType: 'blob' })
    downloadBlob(res.data, `invoice-${orderNumber}.pdf`, 'application/pdf')
  },
  async downloadLabel(id, orderNumber, type = 'label') {
    const res = await client.get(`/orders/${id}/label?type=${type}`, { responseType: 'blob' })
    downloadBlob(res.data, `${type}-${orderNumber}.pdf`, 'application/pdf')
  },

  // customers
  customers: (params) => client.get('/admin/customers', { params }).then(dm),
  customer: (id) => client.get(`/admin/customers/${id}`).then(d),
  updateCustomer: (id, body) => client.patch(`/admin/customers/${id}`, body).then(d),
  segments: () => client.get('/admin/customers/segments/summary').then(d),

  // coupons
  coupons: () => client.get('/coupons').then(d),
  createCoupon: (body) => client.post('/coupons', body).then(d),
  updateCoupon: (id, body) => client.patch(`/coupons/${id}`, body).then(d),
  deleteCoupon: (id) => client.delete(`/coupons/${id}`).then((r) => r.data),

  // content
  content: (resource) => client.get(`/admin/content/${resource}`).then(d),
  createContent: (resource, body) => client.post(`/admin/content/${resource}`, body).then(d),
  updateContent: (resource, id, body) => client.patch(`/admin/content/${resource}/${id}`, body).then(d),
  deleteContent: (resource, id) => client.delete(`/admin/content/${resource}/${id}`).then((r) => r.data),
}

function downloadBlob(data, filename, type) {
  const url = window.URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export default api
