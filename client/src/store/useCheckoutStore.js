import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initial = {
  step: 0, // 0:info 1:address 2:shipping 3:review 4:payment 5:confirmation
  addressId: null,
  newAddress: null, // when adding inline
  shippingMethod: 'standard',
  paymentMethod: 'cod',
  notes: '',
  giftMessage: '',
  isGift: false,
  // guest-checkout architecture hook (disabled — auth required for now)
  guest: { enabled: false, email: '' },
  placedOrder: null,
}

export const useCheckoutStore = create(
  persist(
    (set, get) => ({
      ...initial,

      setStep: (step) => set({ step }),
      next: () => set((s) => ({ step: Math.min(5, s.step + 1) })),
      back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),

      set: (patch) => set(patch),

      reset: () => set({ ...initial }),

      // keep address selection valid against the loaded address list
      ensureAddress(addresses = []) {
        const { addressId } = get()
        if (addressId && addresses.some((a) => a._id === addressId)) return
        const def = addresses.find((a) => a.isDefault) || addresses[0]
        if (def) set({ addressId: def._id })
      },
    }),
    {
      name: 'ysc-checkout',
      partialize: (s) => ({
        step: s.step,
        addressId: s.addressId,
        shippingMethod: s.shippingMethod,
        paymentMethod: s.paymentMethod,
        notes: s.notes,
        giftMessage: s.giftMessage,
        isGift: s.isGift,
      }),
    },
  ),
)

export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', detail: '3–6 business days', price: 0, note: 'Free over ₹999' },
  { id: 'express', label: 'Express', detail: '1–2 business days', price: 149 },
]

export default useCheckoutStore
