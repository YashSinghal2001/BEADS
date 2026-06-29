import { api } from './axios.js'

const data = (res) => res.data?.data

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(data),
  login: (payload) => api.post('/auth/login', payload).then(data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  refresh: () => api.post('/auth/refresh').then(data),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload).then((r) => r.data),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then((r) => r.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),
}

export default authApi
