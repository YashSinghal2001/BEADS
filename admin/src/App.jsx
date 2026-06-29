import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ToastHost, Spinner } from './components/ui.jsx'
import { useAuth } from './store/auth.js'

const Login = lazy(() => import('./pages/Login.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const Customers = lazy(() => import('./pages/Customers.jsx'))
const Coupons = lazy(() => import('./pages/Coupons.jsx'))
const Content = lazy(() => import('./pages/Content.jsx'))
const Activity = lazy(() => import('./pages/Activity.jsx'))

function Loader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap)
  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/content" element={<Content />} />
            <Route path="/activity" element={<Activity />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastHost />
    </>
  )
}
