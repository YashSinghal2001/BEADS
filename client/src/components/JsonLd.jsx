import { useEffect } from 'react'

/** Injects a standalone <script type="application/ld+json"> — for schema
 * that lives alongside page-level <Seo>, not instead of it (e.g. sitewide
 * Organization schema mounted once in Layout). */
export default function JsonLd({ data }) {
  useEffect(() => {
    if (!data) return undefined
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [data])

  return null
}
