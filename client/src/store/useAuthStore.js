import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth.api.js'
import { userApi } from '../api/user.api.js'
import { tokenStore } from '../api/tokenStore.js'
import { apiError } from '../api/axios.js'

async function resetUserStores() {
  // dynamic import to avoid circular dependency
  const [{ useCartStore }, { useWishlistStore }] = await Promise.all([
    import('./useCartStore.js'),
    import('./useWishlistStore.js'),
  ])
  useCartStore.getState().reset()
  useWishlistStore.getState().reset()
}

async function hydrateUserStores() {
  const [{ useCartStore }, { useWishlistStore }] = await Promise.all([
    import('./useCartStore.js'),
    import('./useWishlistStore.js'),
  ])
  await Promise.all([useCartStore.getState().fetch(), useWishlistStore.getState().fetch()])
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,
      loading: false,

      setSession(user, accessToken) {
        if (accessToken) tokenStore.set(accessToken)
        set({ user, isAuthenticated: true })
      },

      async register(payload) {
        set({ loading: true })
        try {
          const { user, accessToken } = await authApi.register(payload)
          get().setSession(user, accessToken)
          await hydrateUserStores()
          return user
        } catch (err) {
          throw new Error(apiError(err))
        } finally {
          set({ loading: false })
        }
      },

      async login(payload) {
        set({ loading: true })
        try {
          const { user, accessToken } = await authApi.login(payload)
          get().setSession(user, accessToken)
          await hydrateUserStores()
          return user
        } catch (err) {
          throw new Error(apiError(err))
        } finally {
          set({ loading: false })
        }
      },

      async logout() {
        try {
          await authApi.logout()
        } catch {
          /* ignore network errors on logout */
        }
        tokenStore.clear()
        set({ user: null, isAuthenticated: false })
        await resetUserStores()
      },

      async loadProfile() {
        const user = await userApi.getProfile()
        set({ user, isAuthenticated: true })
        return user
      },

      setUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

      verifyOtp: (payload) => authApi.verifyOtp(payload),
      forgotPassword: (payload) => authApi.forgotPassword(payload),
      resetPassword: (payload) => authApi.resetPassword(payload),

      /** Called once on app start to restore the session via the refresh cookie. */
      async bootstrap() {
        if (get().initialized) return
        try {
          await get().loadProfile() // axios refreshes the token via cookie if needed
          await hydrateUserStores()
        } catch {
          tokenStore.clear()
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ initialized: true })
        }
      },
    }),
    {
      name: 'ysc-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
)

/* Wire the axios layer's logout trigger (on refresh failure) to the store. */
tokenStore.setLogoutHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false })
  resetUserStores()
})

export default useAuthStore
