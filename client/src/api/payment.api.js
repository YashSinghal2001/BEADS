import { api } from './axios.js'

export const paymentApi = {
  verify: (payload) => api.post('/payments/verify', payload).then((r) => r.data?.data),
  retry: (orderId) => api.post(`/payments/${orderId}/retry`).then((r) => r.data?.data?.payment),
  history: () => api.get('/payments').then((r) => r.data?.data?.payments || []),
}

/* Lazily inject the Razorpay Checkout script (once). */
let scriptPromise = null
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
  return scriptPromise
}

/**
 * Open the Razorpay checkout modal. Resolves with the gateway response on
 * success, rejects on dismissal/failure. `payment` is the object the backend
 * returns from createOrder/retry.
 */
export async function openRazorpayCheckout({ payment, user, onSuccess, onDismiss }) {
  const ok = await loadRazorpay()
  if (!ok || !window.Razorpay) throw new Error('Unable to load payment gateway')

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency || 'INR',
      name: 'YS Creations',
      description: `Order ${payment.orderNumber}`,
      order_id: payment.gatewayOrderId,
      prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      theme: { color: '#D4A373' },
      handler: (response) => {
        onSuccess?.(response)
        resolve(response)
      },
      modal: {
        ondismiss: () => {
          onDismiss?.()
          reject(new Error('Payment cancelled'))
        },
      },
    })
    rzp.open()
  })
}

export default paymentApi
