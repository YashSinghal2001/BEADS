import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/layout/Layout'
import DashboardLayout from './components/account/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import { useAuthStore } from './store/useAuthStore'

// Lazy-loaded routes (code splitting)
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Placeholder = lazy(() => import('./pages/Placeholder'))

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

const Overview = lazy(() => import('./pages/account/Overview'))
const Orders = lazy(() => import('./pages/account/Orders'))
const OrderDetail = lazy(() => import('./pages/account/OrderDetail'))
const Profile = lazy(() => import('./pages/account/Profile'))
const Addresses = lazy(() => import('./pages/account/Addresses'))
const Notifications = lazy(() => import('./pages/account/Notifications'))
const Settings = lazy(() => import('./pages/account/Settings'))
const Returns = lazy(() => import('./pages/account/Returns'))

const page = (node) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
    {node}
  </motion.div>
)

function Loader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-gold" />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const bootstrap = useAuthStore((s) => s.bootstrap)

  // Restore the session (via refresh cookie) once on app start.
  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return (
    <Suspense fallback={<Loader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Standalone auth (no chrome) */}
          <Route path="/login" element={page(<Login />)} />
          <Route path="/register" element={page(<Register />)} />
          <Route path="/forgot-password" element={page(<ForgotPassword />)} />
          <Route path="/verify-otp" element={page(<VerifyOtp />)} />
          <Route path="/reset-password" element={page(<ResetPassword />)} />

          {/* Main site */}
          <Route element={<Layout />}>
            <Route index element={page(<Home />)} />
            <Route path="/shop" element={page(<Shop />)} />
            <Route path="/category/:slug" element={page(<Shop />)} />
            <Route path="/categories" element={page(<Placeholder title="Categories" />)} />
            <Route path="/product/:slug" element={page(<ProductDetail />)} />

            {/* Protected storefront */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={page(<Cart />)} />
              <Route path="/wishlist" element={page(<Wishlist />)} />
              <Route path="/checkout" element={page(<Checkout />)} />

              {/* Dashboard */}
              <Route path="/account" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="wishlist" element={<Wishlist embedded />} />
                <Route path="profile" element={<Profile />} />
                <Route path="addresses" element={<Addresses />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="returns" element={<Returns />} />
              </Route>
            </Route>

            <Route path="/about" element={page(<Placeholder title="About YS Creations" />)} />
            <Route path="/blog" element={page(<Placeholder title="Blog" />)} />
            <Route path="/contact" element={page(<Placeholder title="Contact" />)} />
            <Route path="*" element={page(<Placeholder title="Page not found" note="The page you're looking for doesn't exist yet." />)} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
