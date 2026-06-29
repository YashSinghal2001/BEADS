import { create } from 'zustand'
import { userApi } from '../api/user.api.js'
import { apiError } from '../api/axios.js'
import { toast } from './useToastStore.js'
import { useAuthStore } from './useAuthStore.js'

export const useProfileStore = create((set, get) => ({
  addresses: [],
  notifications: [],
  loadingAddresses: false,
  loadingNotifications: false,

  /* ----------------------------- Profile ---------------------------- */
  async updateProfile(payload) {
    try {
      const user = await userApi.updateProfile(payload)
      useAuthStore.getState().setUser(user)
      toast.success('Profile updated')
      return user
    } catch (err) {
      toast.error(apiError(err))
      throw err
    }
  },

  async changePassword(payload) {
    try {
      await userApi.changePassword(payload)
      toast.success('Password changed')
    } catch (err) {
      toast.error(apiError(err))
      throw err
    }
  },

  /* ---------------------------- Addresses --------------------------- */
  async fetchAddresses() {
    set({ loadingAddresses: true })
    try {
      set({ addresses: await userApi.listAddresses() })
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      set({ loadingAddresses: false })
    }
  },

  async addAddress(payload) {
    try {
      set({ addresses: await userApi.addAddress(payload) })
      toast.success('Address added')
    } catch (err) {
      toast.error(apiError(err))
      throw err
    }
  },

  async updateAddress(id, payload) {
    try {
      set({ addresses: await userApi.updateAddress(id, payload) })
      toast.success('Address updated')
    } catch (err) {
      toast.error(apiError(err))
      throw err
    }
  },

  async deleteAddress(id) {
    const snapshot = get().addresses
    set({ addresses: snapshot.filter((a) => a._id !== id) })
    try {
      set({ addresses: await userApi.deleteAddress(id) })
      toast.info('Address removed')
    } catch (err) {
      set({ addresses: snapshot })
      toast.error(apiError(err))
    }
  },

  /* -------------------------- Notifications ------------------------- */
  async fetchNotifications() {
    set({ loadingNotifications: true })
    try {
      set({ notifications: await userApi.listNotifications() })
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      set({ loadingNotifications: false })
    }
  },

  async markAllRead() {
    const snapshot = get().notifications
    set({ notifications: snapshot.map((n) => ({ ...n, read: true })) })
    try {
      await userApi.markNotificationsRead()
    } catch (err) {
      set({ notifications: snapshot })
      toast.error(apiError(err))
    }
  },

  reset: () => set({ addresses: [], notifications: [] }),
}))

export default useProfileStore
