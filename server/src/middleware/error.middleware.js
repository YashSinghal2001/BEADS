import { ZodError } from 'zod'
import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError.js'
import { config } from '../config/env.js'
import { logger } from '../utils/logger.js'

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'
  let details = err.details

  // Zod validation
  if (err instanceof ZodError) {
    statusCode = 400
    message = 'Validation failed'
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
  }

  // Mongoose: bad ObjectId
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // Mongoose: schema validation
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = 'Validation failed'
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
  }

  // Mongo: duplicate key
  else if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `${field} already exists`
    details = err.keyValue
  }

  // JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${err.stack || err.message}`)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(config.isProd ? {} : { stack: err.stack }),
  })
}
