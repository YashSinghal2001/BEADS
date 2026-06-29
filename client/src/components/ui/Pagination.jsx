import { Icon } from './Icon'

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null

  const pages = []
  const add = (p) => pages.push(p)
  add(1)
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 1 && p < pageCount) add(p)
  }
  if (pageCount > 1) add(pageCount)
  const unique = [...new Set(pages)].sort((a, b) => a - b)

  const withGaps = []
  unique.forEach((p, i) => {
    if (i > 0 && p - unique[i - 1] > 1) withGaps.push('…')
    withGaps.push(p)
  })

  const btn = 'grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium transition-colors'

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={`${btn} border border-ink/12 bg-white text-ink hover:border-gold/50 disabled:opacity-30`}
      >
        <Icon name="chevronLeft" size={18} />
      </button>

      {withGaps.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-graphite/40">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page}
            className={`${btn} ${
              p === page
                ? 'bg-ink text-cream shadow-soft'
                : 'border border-ink/12 bg-white text-ink hover:border-gold/50'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className={`${btn} border border-ink/12 bg-white text-ink hover:border-gold/50 disabled:opacity-30`}
      >
        <Icon name="chevronRight" size={18} />
      </button>
    </nav>
  )
}
