import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { BUSINESS_INFO } from '../../lib/siteContent'

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/shop' },
      { label: 'New Arrivals', to: '/shop?sort=new' },
      { label: 'Best Sellers', to: '/shop?sort=popular' },
      { label: 'Jewelry Kits', to: '/category/diy-kits' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Story', to: '/about#story' },
      { label: 'Collections', to: '/collections' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & Returns', to: '/shipping' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Track Order', to: '/track-order' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
]

const socials = [
  { name: 'instagram', href: BUSINESS_INFO.instagramLink },
  { name: 'mail', href: `mailto:${BUSINESS_INFO.email}` },
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
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label={s.name}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition-all duration-300 hover:border-gold hover:text-gold"
                >
                  <Icon name={s.name} size={18} />
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
