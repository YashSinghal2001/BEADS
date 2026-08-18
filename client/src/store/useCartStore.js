import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cartApi } from '../api/cart.api.js'
import { tokenStore } from '../api/tokenStore.js'
import { apiError } from '../api/axios.js'
import { toast } from './useToastStore.js'
import { FREE_SHIPPING_THRESHOLD } from '../lib/constants.js'
import { cleanVariant } from '../lib/cartVariant.js'

const EMPTY_TOTALS = { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 }
const isAuthed = () => Boolean(tokenStore.get())

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      totals: { ...EMPTY_TOTALS },
      savedForLater: [], // local-only (no server concept)
      loading: false,

      _apply(cart) {
        set({ items: cart.items, coupon: cart.coupon, totals: cart.totals })
      },

      reset() {
        set({ items: [], coupon: null, totals: { ...EMPTY_TOTALS } })
      },

      async fetch() {
        if (!isAuthed()) return
        set({ loading: true })
        try {
          get()._apply(await cartApi.get())
        } catch {
          /* leave existing state */
        } finally {
          set({ loading: false })
        }
      },

      async addItem(product, { variant = {}, qty = 1 } = {}) {
        if (!isAuthed()) {
          toast.info('Please sign in to add items to your cart')
          throw new Error('AUTH_REQUIRED')
        }
        variant = cleanVariant(variant)
        const snapshot = get().items
        // optimistic
        const tempKey = `tmp-${product.id}-${Date.now()}`
        set({
          items: [
            ...snapshot,
            {
              key: tempKey,
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.image,
              price: product.price,
              compareAt: product.compareAt ?? null,
              variant,
              qty,
              inStock: true,
            },
          ],
        })
        try {
          get()._apply(await cartApi.add({ product: product.id, quantity: qty, variant }))
          toast.success('Added to cart', { icon: 'cart' })
        } catch (err) {
          set({ items: snapshot }) // rollback
          toast.error(apiError(err))
          throw err
        }
      },

      async setQty(key, qty) {
        const snapshot = get().items
        set({ items: snapshot.map((it) => (it.key === key ? { ...it, qty: Math.max(1, qty) } : it)) })
        try {
          get()._apply(await cartApi.updateItem(key, Math.max(1, qty)))
        } catch (err) {
          set({ items: snapshot })
          toast.error(apiError(err))
        }
      },
      increment: (key) => get().setQty(key, (get().items.find((i) => i.key === key)?.qty || 1) + 1),
      decrement: (key) => get().setQty(key, (get().items.find((i) => i.key === key)?.qty || 1) - 1),

      async removeItem(key) {
        const snapshot = get().items
        set({ items: snapshot.filter((it) => it.key !== key) })
        try {
          get()._apply(await cartApi.removeItem(key))
        } catch (err) {
          set({ items: snapshot })
          toast.error(apiError(err))
        }
      },

      async clearCart() {
        try {
          get()._apply(await cartApi.clear())
        } catch (err) {
          toast.error(apiError(err))
        }
      },

      async applyCoupon(code) {
        try {
          const cart = await cartApi.applyCoupon(code)
          get()._apply(cart)
          return { ok: true, message: `Coupon ${code.toUpperCase()} applied` }
        } catch (err) {
          return { ok: false, message: apiError(err) }
        }
      },

      async removeCoupon() {
        try {
          get()._apply(await cartApi.removeCoupon())
        } catch (err) {
          toast.error(apiError(err))
        }
      },

      /* ---- save for later (local) ---- */
      async saveForLater(key) {
        const item = get().items.find((it) => it.key === key)
        if (!item) return
        set((s) => ({ savedForLater: [...s.savedForLater.filter((x) => x.id !== item.id), item] }))
        await get().removeItem(key)
      },
      async moveToCart(savedId) {
        const item = get().savedForLater.find((it) => it.id === savedId)
        if (!item) return
        set((s) => ({ savedForLater: s.savedForLater.filter((x) => x.id !== savedId) }))
        try {
          get()._apply(await cartApi.add({ product: item.id, quantity: item.qty, variant: item.variant }))
        } catch (err) {
          toast.error(apiError(err))
        }
      },
      removeSaved: (savedId) =>
        set((s) => ({ savedForLater: s.savedForLater.filter((x) => x.id !== savedId) })),

      /* ---- selectors (server totals are authoritative) ---- */
      count: () => get().items.reduce((n, it) => n + it.qty, 0),
      subtotal: () => get().totals.subtotal,
      savings: () =>
        get().items.reduce((s, it) => s + (it.compareAt ? (it.compareAt - it.price) * it.qty : 0), 0),
      discount: () => get().totals.discount,
      shipping: () => get().totals.shipping,
      tax: () => get().totals.tax,
      total: () => get().totals.total,
      freeShippingRemaining: () => Math.max(0, FREE_SHIPPING_THRESHOLD - get().totals.subtotal),
    }),
    {
      name: 'ysc-cart',
      partialize: (s) => ({ savedForLater: s.savedForLater }),
    },
  ),
)

export default useCartStore
