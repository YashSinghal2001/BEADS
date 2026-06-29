import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/shop' },
      { label: 'New Arrivals', to: '/shop?sort=new' },
      { label: 'Best Sellers', to: '/shop?sort=best' },
      { label: 'Jewelry Kits', to: '/category/jewelry-kits' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Story', to: '/about#story' },
      { label: 'Blog', to: '/blog' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & Returns', to: '/shipping' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Track Order', to: '/account/orders' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-10 bg-ink text-cream/80">
      <div className="container-lux py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-white">
                <span className="font-display text-lg font-semibold">Y</span>
              </span>
              <span className="font-display text-xl font-semibold text-cream">
                YS Creations
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              Premium handmade beads & jewelry-making supplies. Curated for
              makers, artists, and dreamers.
            </p>
            <div className="mt-6 flex gap-3">
              {['instagram', 'mail'].map((n) => (
                <a
                  key={n}
                  href="#"
                  aria-label={n}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition-all duration-300 hover:border-gold hover:text-gold"
                >
                  <Icon name={n} size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-button text-xs uppercase tracking-[0.2em] text-cream">
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-cream/60 transition-colors duration-300 hover:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs text-cream/50 md:flex-row">
          <p>© {new Date().getFullYear()} YS Creations. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Crafted with <Icon name="heart" size={13} className="text-gold" /> for makers
          </p>
        </div>
      </div>
    </footer>
  )
}
