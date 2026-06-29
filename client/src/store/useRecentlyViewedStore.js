import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX = 12

export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      items: [], // product id list, most-recent first

      add: (product) =>
        set((s) => {
          const snap = {
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            price: product.price,
            compareAt: product.compareAt ?? null,
            rating: product.rating,
            reviews: product.reviews,
            colors: product.colors,
            inStock: product.inStock !== false,
            badge: product.badge ?? null,
          }
          const filtered = s.items.filter((it) => it.id !== product.id)
          return { items: [snap, ...filtered].slice(0, MAX) }
        }),

      clear: () => set({ items: [] }),
      list: (excludeId) => get().items.filter((it) => it.id !== excludeId),
    }),
    { name: 'ysc-recently-viewed' },
  ),
)
