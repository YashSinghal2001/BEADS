import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyAccessToken } from '../utils/token.js'
import { User } from '../models/User.js'

// Bearer-only by design: both client apps send Authorization headers, never
// cookies, for authenticated requests. Accepting req.cookies.accessToken here
// would let any cross-site request ride an authenticated session with no
// CSRF protection — the only cookie the API relies on is the httpOnly
// refreshToken, which /auth/refresh reads directly, not through this path.
function extractToken(req) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) return header.slice(7)
  return null
}

/** Require a valid access token; attaches req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized('Authentication required')

  const decoded = verifyAccessToken(token)
  const user = await User.findById(decoded.sub).select('-password -refreshTokens')
  if (!user) throw ApiError.unauthorized('User no longer exists')
  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended')

  req.user = user
  next()
})

/** Attach req.user if a token is present, but never block. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) return next()
  try {
    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.sub).select('-password -refreshTokens')
    if (user && !user.isBlocked) req.user = user
  } catch {
    /* ignore invalid token for optional routes */
  }
  next()
})

/** Restrict to one or more roles (e.g. authorize('admin')). */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'))
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'))
  }
  next()
}

export const isAdmin = authorize('admin', 'super_admin', 'manager')
