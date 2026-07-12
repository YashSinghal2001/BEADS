import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ToastContainer from '../ui/ToastContainer'
import JsonLd from '../JsonLd'
import { BUSINESS_INFO } from '../../lib/siteContent'

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'YS Creations',
  description: 'Premium handmade beads & jewelry-making supplies.',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  email: BUSINESS_INFO.email,
  telephone: BUSINESS_INFO.phone,
  sameAs: [BUSINESS_INFO.instagramLink],
}

export default function Layout() {
  const { pathname } = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={ORGANIZATION_JSON_LD} />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
    </div>
  )
}
