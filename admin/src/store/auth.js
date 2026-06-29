import { create } from 'zustand'
import { api, tokenStore, setLogoutHandler, apiError } from '../api.js'

const ADMIN_ROLES = ['support', 'warehouse', 'manager', 'admin', 'super_admin']

export const useAuth = create((set, get) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  initialized: false,
  loading: false,

  can: (perm) => {
    const p = get().permissions
    return p.includes('*') || p.includes(perm)
  },

  async login({ email, password }) {
    set({ loading: true })
    try {
      const { user, accessToken } = await api.login({ email, password })
      if (!ADMIN_ROLES.includes(user.role)) {
        throw new Error('This account does not have admin access')
      }
      tokenStore.set(accessToken)
      const { user: full, permissions } = await api.me()
      set({ user: full, permissions, isAuthenticated: true })
      return full
    } catch (err) {
      tokenStore.set(null)
      throw new Error(apiError(err))
    } finally {
      set({ loading: false })
    }
  },

  async bootstrap() {
    if (get().initialized) return
    try {
      const { user, permissions } = await api.me()
      if (ADMIN_ROLES.includes(user.role)) {
        set({ user, permissions, isAuthenticated: true })
      }
    } catch {
      tokenStore.set(null)
    } finally {
      set({ initialized: true })
    }
  },

  async logout() {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    tokenStore.set(null)
    set({ user: null, permissions: [], isAuthenticated: false })
  },
}))

// Wire axios refresh-failure → store logout
setLogoutHandler(() => useAuth.setState({ user: null, permissions: [], isAuthenticated: false }))

export default useAuth
