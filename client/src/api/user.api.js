import { api } from './axios.js'

const data = (res) => res.data?.data

export const userApi = {
  getProfile: () => api.get('/users/profile').then((r) => data(r).user),
  updateProfile: (payload) => api.patch('/users/profile', payload).then((r) => data(r).user),
  changePassword: (payload) => api.patch('/users/password', payload).then((r) => r.data),

  listAddresses: () => api.get('/users/addresses').then((r) => data(r).addresses),
  addAddress: (payload) => api.post('/users/addresses', payload).then((r) => data(r).addresses),
  updateAddress: (id, payload) => api.patch(`/users/addresses/${id}`, payload).then((r) => data(r).addresses),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`).then((r) => data(r).addresses),

  listNotifications: () => api.get('/users/notifications').then((r) => data(r).notifications),
  markNotificationsRead: () => api.patch('/users/notifications/read').then((r) => r.data),
}

export default userApi
