import { createApp } from './app.js'
import { config } from './config/env.js'
import { connectDB, disconnectDB } from './config/db.js'
import { logger } from './utils/logger.js'
import { runRecovery } from './jobs/recovery.js'

const RECOVERY_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

async function start() {
  const app = createApp()

  // Connect to MongoDB. The server still boots if the DB is down so that
  // /health stays observable; data routes will surface errors until it's up.
  let dbConnected = false
  try {
    await connectDB()
    dbConnected = true
  } catch {
    logger.warn('Starting without a database connection — data routes will fail until MongoDB is reachable.')
  }

  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 YS Creations API running on http://localhost:${config.PORT} (${config.NODE_ENV})`)
  })

  // Periodically release inventory reserved by abandoned/expired checkouts
  // and flag stuck payments for reconciliation. Guarded so a transient DB
  // error on one tick never crashes the process.
  let recoveryTimer = null
  if (dbConnected) {
    const tick = () => runRecovery().catch((err) => logger.error('Recovery job failed:', err))
    tick()
    recoveryTimer = setInterval(tick, RECOVERY_INTERVAL_MS)
    recoveryTimer.unref()
  }

  const shutdown = async (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`)
    if (recoveryTimer) clearInterval(recoveryTimer)
    server.close(async () => {
      await disconnectDB()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason))
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err)
    process.exit(1)
  })
}

start()
