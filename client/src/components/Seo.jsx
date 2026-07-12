import { useEffect } from 'react'

const SITE_NAME = 'YS Creations'
const DEFAULT_DESCRIPTION =
  'YS Creations — premium handmade beads & jewelry-making supplies. Acrylic, pearl, glass, flower & bow beads, charms and DIY kits.'
const DEFAULT_IMAGE = 'https://images.pexels.com/photos/14820550/pexels-photo-14820550.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200&h=630'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Per-route document head manager — this SPA has no SSR/prerendering, so
 * every route otherwise shares client/index.html's single static <title>
 * and meta tags. No new dependency (react-helmet etc.) needed for what's
 * just a handful of DOM writes on route change.
 */
export default function Seo({ title, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, path, noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Premium Beads & Jewelry Supplies`
    const url = `${window.location.origin}${path ?? window.location.pathname}`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setCanonical(url)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:url', url)

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)
  }, [title, description, image, path, noindex])

  return null
}
