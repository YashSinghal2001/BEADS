/* Lightweight dependency-free SVG charts. */

export function BarChart({ data = [], height = 180, valueKey = 'revenue', labelKey = 'month', format = (v) => v }) {
  if (!data.length) return <div className="grid h-44 place-items-center text-sm text-graphite/40">No data yet</div>
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  const barW = 100 / data.length
  return (
    <div>
      <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d[valueKey] / max) * (height / 2 - 6)
          return (
            <g key={i}>
              <rect
                x={i * barW + barW * 0.2}
                y={height / 2 - h}
                width={barW * 0.6}
                height={h}
                rx="1.2"
                fill="#D4A373"
              >
                <title>{`${d[labelKey]}: ${format(d[valueKey])}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-graphite/45">
        <span>{data[0]?.[labelKey]}</span>
        <span>{data[data.length - 1]?.[labelKey]}</span>
      </div>
    </div>
  )
}

export function Donut({ segments = [], size = 140 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const r = 16
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 42 42" className="shrink-0">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#EADBC8" strokeWidth="6" />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c
          const el = (
            <circle
              key={i}
              cx="21"
              cy="21"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="6"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 21 21)"
            />
          )
          offset += len
          return el
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-graphite/70">{seg.label}</span>
            <span className="ml-auto font-medium text-ink">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
