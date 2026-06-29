import { create } from 'zustand'

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN') : '—')

let id = 0
export const useToast = create((set, get) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const tid = ++id
    set((s) => ({ toasts: [...s.toasts, { id: tid, message, type }] }))
    setTimeout(() => get().dismiss(tid), 3000)
  },
  dismiss: (tid) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== tid) })),
}))

export const toast = {
  success: (m) => useToast.getState().push(m, 'success'),
  error: (m) => useToast.getState().push(m, 'error'),
  info: (m) => useToast.getState().push(m, 'info'),
}
