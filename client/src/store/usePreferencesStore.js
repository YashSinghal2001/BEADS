import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePreferencesStore = create(
  persist(
    (set) => ({
      viewMode: 'grid', // 'grid' | 'list'
      pageSize: 9,
      currency: 'INR',

      setViewMode: (viewMode) => set({ viewMode }),
      setPageSize: (pageSize) => set({ pageSize }),
    }),
    { name: 'ysc-preferences' },
  ),
)
