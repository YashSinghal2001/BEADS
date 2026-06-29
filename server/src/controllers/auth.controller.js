import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.js'
import { generateOtp, randomToken, hashToken } from '../utils/token.js'
import {
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../services/token.service.js'
import { sendOtpEmail, sendPasswordResetEmail } from '../services/email.service.js'

const ctx = (req) => ({ userAgent: req.headers['user-agent'] || '', ip: req.ip })

/* POST /auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, referralCode } = req.body

  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists')

  let referredBy = null
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() })
    if (referrer) {
      referredBy = referrer._id
      referrer.loyaltyPoints += 100
      await referrer.save()
    }
  }

  const user = await User.create({ name, email, phone, password, referredBy })

  // verification OTP
  const otp = generateOtp()
  user.otpHash = hashToken(otp)
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()
  await sendOtpEmail(email, otp)

  const tokens = await issueTokens(user, ctx(req))
  setAuthCookies(res, tokens)

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created. Please verify your email.',
    data: { user: user.toSafeJSON(), accessToken: tokens.accessToken },
  })
})

/* POST /auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password +refreshTokens')
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password')
  }
  if (user.isBlocked) throw ApiError.forbidden('Your account has been suspended')

  user.lastLoginAt = new Date()
  const tokens = await issueTokens(user, ctx(req))
  setAuthCookies(res, tokens)

  return sendSuccess(res, {
    message: 'Signed in successfully',
    data: { user: user.toSafeJSON(), accessToken: tokens.accessToken },
  })
})

/* POST /auth/logout */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
  await revokeRefreshToken(User, refreshToken)
  clearAuthCookies(res)
  return sendSuccess(res, { message: 'Signed out' })
})

/* POST /auth/refresh */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken
  const { user, tokens } = await rotateRefreshToken(User, token, ctx(req))
  setAuthCookies(res, tokens)
  return sendSuccess(res, {
    message: 'Token refreshed',
    data: { accessToken: tokens.accessToken, user: user.toSafeJSON() },
  })
})

/* POST /auth/verify-otp */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body
  const user = await User.findOne({ email }).select('+otpHash +otpExpires')
  if (!user) throw ApiError.notFound('Account not found')
  if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
    throw ApiError.badRequest('OTP expired. Please request a new one.')
  }
  if (user.otpHash !== hashToken(otp)) throw ApiError.badRequest('Incorrect verification code')

  user.isVerified = true
  user.otpHash = null
  user.otpExpires = null
  await user.save()

  return sendSuccess(res, { message: 'Email verified successfully', data: { isVerified: true } })
})

/* POST /auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  // Always respond success to avoid leaking which emails exist
  if (user) {
    const otp = generateOtp()
    const token = randomToken()
    user.otpHash = hashToken(otp)
    user.resetTokenHash = hashToken(token)
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000)
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()
    await sendPasswordResetEmail(email, { otp, token })
  }

  return sendSuccess(res, {
    message: 'If an account exists, reset instructions have been sent.',
  })
})

/* POST /auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body
  const user = await User.findOne({ email }).select('+resetTokenHash +resetTokenExpires +refreshTokens')
  if (!user || !user.resetTokenHash || user.resetTokenExpires < new Date()) {
    throw ApiError.badRequest('Reset link is invalid or has expired')
  }
  if (user.resetTokenHash !== hashToken(token)) throw ApiError.badRequest('Invalid reset token')

  user.password = password
  user.resetTokenHash = null
  user.resetTokenExpires = null
  user.refreshTokens = [] // revoke all sessions on password change
  await user.save()

  clearAuthCookies(res)
  return sendSuccess(res, { message: 'Password reset successfully. Please sign in.' })
})
