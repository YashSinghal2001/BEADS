/**
 * Parse pagination params from a query object.
 * Returns { page, limit, skip }.
 */
export function getPagination(query = {}, { defaultLimit = 12, maxLimit = 60 } = {}) {
  let page = parseInt(query.page, 10)
  let limit = parseInt(query.limit, 10)
  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit
  limit = Math.min(limit, maxLimit)
  return { page, limit, skip: (page - 1) * limit }
}

/** Build a meta block for list responses. */
export function buildMeta({ page, limit, total }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  }
}
