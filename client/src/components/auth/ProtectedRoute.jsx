import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'

function FullPageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-gold" />
    </div>
  )
}

/**
 * Guards authenticated routes. Waits for the session bootstrap to finish so a
 * page refresh doesn't bounce a logged-in user to /login.
 */
export default function ProtectedRoute({ children }) {
  const initialized = useAuthStore((s) => s.initialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!initialized) return <FullPageLoader />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children || <Outlet />
}
