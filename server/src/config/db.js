import mongoose from 'mongoose'
import { config } from './env.js'
import { logger } from '../utils/logger.js'

mongoose.set('strictQuery', true)

let connected = false

export async function connectDB(uri = config.MONGODB_URI) {
  if (connected) return mongoose.connection
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    })
    connected = true
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)

    mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`))
    mongoose.connection.on('disconnected', () => {
      connected = false
      logger.warn('MongoDB disconnected')
    })

    return conn.connection
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`)
    throw err
  }
}

export async function disconnectDB() {
  if (!connected) return
  await mongoose.disconnect()
  connected = false
}

export const isDBConnected = () => mongoose.connection.readyState === 1
