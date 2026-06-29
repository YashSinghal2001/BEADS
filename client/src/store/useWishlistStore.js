import { create } from 'zustand'
import { wishlistApi } from '../api/wishlist.api.js'
import { tokenStore } from '../api/tokenStore.js'
import { apiError } from '../api/axios.js'
import { toast } from './useToastStore.js'

const isAuthed = () => Boolean(tokenStore.get())

export const useWishlistStore = create((set, get) => ({
  items: [],
  loading: false,

  reset: () => set({ items: [] }),

  async fetch() {
    if (!isAuthed()) return
    set({ loading: true })
    try {
      set({ items: await wishlistApi.get() })
    } catch {
      /* ignore */
    } finally {
      set({ loading: false })
    }
  },

  has: (id) => get().items.some((it) => it.id === id),
  count: () => get().items.length,

  /** Optimistically add/remove; returns true if now wishlisted. */
  async toggle(product) {
    if (!isAuthed()) {
      toast.info('Please sign in to save items')
      throw new Error('AUTH_REQUIRED')
    }
    const snapshot = get().items
    const exists = snapshot.some((it) => it.id === product.id)

    if (exists) {
      set({ items: snapshot.filter((it) => it.id !== product.id) })
      try {
        await wishlistApi.remove(product.id)
      } catch (err) {
        set({ items: snapshot })
        toast.error(apiError(err))
      }
      return false
    }

    set({ items: [product, ...snapshot] })
    try {
      await wishlistApi.add(product.id)
    } catch (err) {
      set({ items: snapshot })
      toast.error(apiError(err))
    }
    return true
  },

  async remove(id) {
    const snapshot = get().items
    set({ items: snapshot.filter((it) => it.id !== id) })
    try {
      await wishlistApi.remove(id)
    } catch (err) {
      set({ items: snapshot })
      toast.error(apiError(err))
    }
  },

  async clear() {
    const snapshot = get().items
    set({ items: [] })
    try {
      await wishlistApi.clear()
    } catch (err) {
      set({ items: snapshot })
      toast.error(apiError(err))
    }
  },
}))

export default useWishlistStore
