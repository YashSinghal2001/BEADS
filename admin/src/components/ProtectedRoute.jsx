import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth.js'
import { Spinner } from './ui.jsx'

export default function ProtectedRoute({ children }) {
  const initialized = useAuth((s) => s.initialized)
  const isAuthenticated = useAuth((s) => s.isAuthenticated)

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
