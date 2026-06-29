import axios from 'axios'
import { tokenStore } from './tokenStore.js'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the refresh cookie
  headers: { 'Content-Type': 'application/json' },
})

/* A bare client for the refresh call so it never recurses through interceptors. */
const refreshClient = axios.create({ baseURL, withCredentials: true })

/* ----------------------------- Request ------------------------------- */
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* --------------------------- Refresh queue --------------------------- */
let isRefreshing = false
let waiters = []

const resolveWaiters = (token) => {
  waiters.forEach((cb) => cb(token))
  waiters = []
}

async function refreshAccessToken() {
  const res = await refreshClient.post('/auth/refresh')
  const token = res.data?.data?.accessToken
  if (!token) throw new Error('No access token in refresh response')
  tokenStore.set(token)
  return token
}

/* ---------------------------- Response ------------------------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error
    if (!response || !config) return Promise.reject(error)

    const isAuthRoute = config.url?.includes('/auth/')
    const shouldRefresh = response.status === 401 && !config._retry && !isAuthRoute

    if (!shouldRefresh) return Promise.reject(error)

    config._retry = true

    // queue concurrent 401s behind a single refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(error)
          config.headers.Authorization = `Bearer ${token}`
          resolve(api(config))
        })
      })
    }

    isRefreshing = true
    try {
      const token = await refreshAccessToken()
      resolveWaiters(token)
      config.headers.Authorization = `Bearer ${token}`
      return api(config)
    } catch (refreshErr) {
      resolveWaiters(null)
      tokenStore.clear()
      tokenStore.triggerLogout()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

/* Unwrap the standard { success, message, data, meta } envelope. */
export function unwrap(promise) {
  return promise.then((res) => ({ ...res.data?.data, _meta: res.data?.meta, _message: res.data?.message }))
}

/* Extract a human-readable message from an axios error. */
export function apiError(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0]?.message ||
    err?.message ||
    'Something went wrong'
  )
}

export default api
