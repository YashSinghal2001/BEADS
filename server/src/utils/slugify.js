export function slugify(text = '') {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[—–&]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Append a short suffix to guarantee uniqueness when needed. */
export function uniqueSuffix(len = 4) {
  return Math.random().toString(36).slice(2, 2 + len)
}

export default slugify
