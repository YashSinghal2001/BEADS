import { api } from './axios.js'

export const couponApi = {
  validate: (code, subtotal) =>
    api.post('/coupons/validate', { code, subtotal }).then((r) => r.data?.data),
}

export default couponApi
