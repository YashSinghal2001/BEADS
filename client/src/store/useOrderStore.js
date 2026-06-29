import { create } from 'zustand'
import { orderApi } from '../api/order.api.js'
import { apiError } from '../api/axios.js'
import { toast } from './useToastStore.js'

export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  loaded: false,

  reset: () => set({ orders: [], loaded: false }),

  async fetch(params = {}) {
    set({ loading: true, error: null })
    try {
      const { orders } = await orderApi.list(params)
      set({ orders, loaded: true })
      return orders
    } catch (err) {
      set({ error: apiError(err) })
      return []
    } finally {
      set({ loading: false })
    }
  },

  getById: (id) => get().orders.find((o) => o._id === id || o.id === id),

  async createOrder(payload) {
    const { order, payment } = await orderApi.create(payload)
    set((s) => ({ orders: [order, ...s.orders] }))
    return { order, payment }
  },

  async cancel(id, reason) {
    try {
      const updated = await orderApi.cancel(id, reason)
      set((s) => ({ orders: s.orders.map((o) => (o._id === id ? updated : o)) }))
      toast.success('Order cancelled')
    } catch (err) {
      toast.error(apiError(err))
    }
  },

  async requestReturn(id, reason) {
    try {
      const updated = await orderApi.return(id, reason)
      set((s) => ({ orders: s.orders.map((o) => (o._id === id ? updated : o)) }))
      toast.success('Return requested')
    } catch (err) {
      toast.error(apiError(err))
    }
  },
}))

export default useOrderStore
