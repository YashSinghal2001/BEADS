import { create } from 'zustand'

let id = 0

export const useToastStore = create((set, get) => ({
  toasts: [],

  push: ({ message, type = 'success', icon, duration = 2800, action }) => {
    const toastId = ++id
    set((s) => ({ toasts: [...s.toasts, { id: toastId, message, type, icon, action }] }))
    if (duration) setTimeout(() => get().dismiss(toastId), duration)
    return toastId
  },

  dismiss: (toastId) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toastId) })),
}))

/* Convenience helpers */
export const toast = {
  success: (message, opts) => useToastStore.getState().push({ message, type: 'success', ...opts }),
  error: (message, opts) => useToastStore.getState().push({ message, type: 'error', ...opts }),
  info: (message, opts) => useToastStore.getState().push({ message, type: 'info', ...opts }),
}
