import { AdminActivity } from '../models/AdminActivity.js'
import { logger } from '../utils/logger.js'

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

/**
 * Records admin mutations to the AdminActivity audit log. Attaches on the
 * response 'finish' event so it never blocks the request and captures the
 * final status code. Read-only requests are skipped.
 */
export function activityLog(req, res, next) {
  if (!MUTATING.has(req.method)) return next()

  res.on('finish', () => {
    // only log successful-ish mutations by an admin actor
    if (!req.user || res.statusCode >= 400) return
    const action = `${req.baseUrl}${req.route?.path || ''}`.replace(/^\/api\/?/, '') || req.path
    AdminActivity.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `${req.method} ${action}`,
      method: req.method,
      path: req.originalUrl,
      entityId: req.params?.id || '',
      statusCode: res.statusCode,
      ip: req.ip,
    }).catch((err) => logger.warn(`Activity log failed: ${err.message}`))
  })

  next()
}

export default activityLog
