/* Minimal, dependency-free CSV serialise/parse. */

function escapeCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Serialise rows → CSV.
 * columns: [{ key, label }]
 */
export function toCSV(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label || c.key)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

/** Parse CSV text → array of objects keyed by header row. */
export function parseCSV(text) {
  const rows = []
  let field = ''
  let record = []
  let inQuotes = false
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') {
      record.push(field)
      field = ''
    } else if (ch === '\n') {
      record.push(field)
      rows.push(record)
      record = []
      field = ''
    } else field += ch
  }
  if (field.length || record.length) {
    record.push(field)
    rows.push(record)
  }

  const [header, ...dataRows] = rows.filter((r) => r.length && r.some((c) => c !== ''))
  if (!header) return []
  return dataRows.map((r) => header.reduce((obj, key, i) => ({ ...obj, [key.trim()]: r[i]?.trim() }), {}))
}

export default { toCSV, parseCSV }
