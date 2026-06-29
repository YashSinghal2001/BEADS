import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { config } from '../config/env.js'

export function signAccessToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_ACCESS_EXPIRES })
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRES })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET)
}

/** 6-digit numeric OTP. */
export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000))
}

/** Random opaque token (for password reset links etc.). */
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

/** One-way hash for storing OTPs / reset tokens at rest. */
export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

/** Parse a duration string like '30d' / '15m' into milliseconds. */
export function ms(duration) {
  const m = /^(\d+)(s|m|h|d)$/.exec(String(duration).trim())
  if (!m) return 0
  const n = Number(m[1])
  return { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]] * n
}
