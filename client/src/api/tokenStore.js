/*
 * Lightweight access-token holder shared by the axios layer and the auth store.
 * Kept separate to avoid a circular dependency (axios ↔ authStore).
 * The durable session lives in an httpOnly refresh cookie; this is just the
 * short-lived access token used for the Authorization header.
 */
const STORAGE_KEY = 'ysc-access-token'

let accessToken = null
try {
  accessToken = localStorage.getItem(STORAGE_KEY)
} catch {
  /* SSR / privacy mode */
}

// Callback invoked when the session can no longer be refreshed.
let onLogout = null

export const tokenStore = {
  get: () => accessToken,
  set(token) {
    accessToken = token || null
    try {
      if (token) localStorage.setItem(STORAGE_KEY, token)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore storage errors */
    }
  },
  clear() {
    this.set(null)
  },
  setLogoutHandler(fn) {
    onLogout = fn
  },
  triggerLogout() {
    if (onLogout) onLogout()
  },
}

export default tokenStore
