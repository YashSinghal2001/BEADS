import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  ms,
} from '../utils/token.js'
import { config } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const MAX_SESSIONS = 5

function payloadFor(user) {
  return { sub: user._id.toString(), role: user.role }
}

/**
 * Issue a new access + refresh pair and persist the (hashed) refresh token on
 * the user document. Trims old sessions beyond MAX_SESSIONS.
 */
export async function issueTokens(user, { userAgent = '', ip = '' } = {}) {
  const accessToken = signAccessToken(payloadFor(user))
  const refreshToken = signRefreshToken(payloadFor(user))

  const expiresAt = new Date(Date.now() + ms(config.JWT_REFRESH_EXPIRES))
  user.refreshTokens.push({ token: hashToken(refreshToken), userAgent, ip, expiresAt })

  // keep only the most recent sessions
  if (user.refreshTokens.length > MAX_SESSIONS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_SESSIONS)
  }
  await user.save()

  return { accessToken, refreshToken }
}

/**
 * Verify an incoming refresh token, confirm it is a known session, then rotate:
 * remove the old hash and issue a fresh pair. Reuse of an unknown token throws.
 */
export async function rotateRefreshToken(UserModel, oldToken, ctx = {}) {
  if (!oldToken) throw ApiError.unauthorized('Refresh token missing')

  let decoded
  try {
    decoded = verifyRefreshToken(oldToken)
  } catch {
    throw ApiError.unauthorized('Invalid refresh token')
  }

  const user = await UserModel.findById(decoded.sub).select('+refreshTokens')
  if (!user) throw ApiError.unauthorized('User no longer exists')

  const hashed = hashToken(oldToken)
  const existing = user.refreshTokens.find((t) => t.token === hashed)
  if (!existing) {
    // token reuse / theft → revoke all sessions
    user.refreshTokens = []
    await user.save()
    throw ApiError.unauthorized('Refresh token reuse detected. Please sign in again.')
  }

  // remove the used token, then issue a new pair
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashed)
  const tokens = await issueTokens(user, ctx)
  return { user, tokens }
}

export async function revokeRefreshToken(UserModel, refreshToken) {
  if (!refreshToken) return
  try {
    const decoded = verifyRefreshToken(refreshToken)
    const user = await UserModel.findById(decoded.sub).select('+refreshTokens')
    if (user) {
      const hashed = hashToken(refreshToken)
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashed)
      await user.save()
    }
  } catch {
    /* already invalid — nothing to revoke */
  }
}

/* ---------------------------- Cookie helpers ------------------------- */
const baseCookie = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: config.isProd ? 'none' : 'lax',
  ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('accessToken', accessToken, { ...baseCookie, maxAge: ms(config.JWT_ACCESS_EXPIRES) })
  res.cookie('refreshToken', refreshToken, {
    ...baseCookie,
    path: '/api/auth',
    maxAge: ms(config.JWT_REFRESH_EXPIRES),
  })
}

export function clearAuthCookies(res) {
  res.clearCookie('accessToken', baseCookie)
  res.clearCookie('refreshToken', { ...baseCookie, path: '/api/auth' })
}
