import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import { config } from './config/env.js'
import { isDBConnected } from './config/db.js'
import { logger } from './utils/logger.js'
import { sanitize } from './middleware/sanitize.middleware.js'
import { apiLimiter } from './middleware/rateLimit.middleware.js'
import { notFound, errorHandler } from './middleware/error.middleware.js'
import apiRouter from './routes/index.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  // CORS whitelist with credentials (cookies)
  app.use(
    cors({
      origin(origin, cb) {
        // allow same-origin / curl / server-to-server (no origin)
        if (!origin || config.clientOrigins.includes(origin)) return cb(null, true)
        return cb(new Error(`Not allowed by CORS: ${origin}`))
      },
      credentials: true,
    }),
  )

  // Body parsing + cookies (capture raw body for webhook signature verification)
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, res, buf) => {
        req.rawBody = buf
      },
    }),
  )
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(cookieParser())

  // Performance + logging
  app.use(compression())
  if (!config.isTest) app.use(morgan('tiny', { stream: logger.stream }))

  // Input sanitization (NoSQL injection + basic XSS)
  app.use(sanitize)

  // Health check
  app.get('/health', (req, res) => {
    const dbConnected = isDBConnected()
    // Non-200 when the DB is down so PaaS/load-balancer health checks (which
    // key off status code, not payload) correctly pull this instance out of
    // rotation instead of treating it as healthy.
    res.status(dbConnected ? 200 : 503).json({
      success: dbConnected,
      message: dbConnected ? 'OK' : 'Database unavailable',
      data: {
        status: dbConnected ? 'up' : 'degraded',
        env: config.NODE_ENV,
        db: dbConnected ? 'connected' : 'disconnected',
        features: config.features,
        uptime: Math.round(process.uptime()),
      },
    })
  })

  // Rate limiting + API
  app.use('/api', apiLimiter, apiRouter)

  // 404 + error handler
  app.use(notFound)
  app.use(errorHandler)

  return app
}

export default createApp
