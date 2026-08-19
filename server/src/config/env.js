import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

/**
 * Validate and normalise environment variables once at boot.
 * Integration secrets (Cloudinary/Razorpay/Shiprocket) are optional so the
 * server runs without them — features gate on `config.features.*`.
 */
const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be set (min 10 chars)'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be set (min 10 chars)'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),

  CLOUDINARY_NAME: z.string().optional(),
  CLOUDINARY_KEY: z.string().optional(),
  CLOUDINARY_SECRET: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_WEBHOOK_TOKEN: z.string().optional(),
  // Nickname of the pickup address configured in Shiprocket. Optional — when
  // unset, the primary pickup address is auto-detected from the Shiprocket API.
  SHIPROCKET_PICKUP_LOCATION: z.string().optional(),
  SHIPROCKET_CHANNEL_ID: z.string().optional(),
  // Test override for the Shiprocket API host — never set in production.
  SHIPROCKET_API_BASE: z.string().optional(),

  COMPANY_GSTIN: z.string().default('29ABCDE1234F1Z5'),
  COMPANY_NAME: z.string().default('YS Creations'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@yscreations.com'),
  SEED_ADMIN_PASSWORD: z.string().default('Admin@12345'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n')
  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`)
  process.exit(1)
}

const env = parsed.data

const has = (...keys) => keys.every((k) => !!env[k])

// Fail fast: in production, taking live payments without webhook signature
// verification is a silent money-loss mode — a paid order whose browser never
// completes /payments/verify would be auto-cancelled by the recovery job.
// Razorpay itself stays optional, so dev/test still run without any keys.
if (env.NODE_ENV === 'production' && has('RAZORPAY_KEY_ID', 'RAZORPAY_SECRET') && !env.RAZORPAY_WEBHOOK_SECRET) {
  // eslint-disable-next-line no-console
  console.error(
    '\n❌ RAZORPAY_WEBHOOK_SECRET is not set.\n' +
      '   Razorpay keys are configured, so production must verify webhook signatures.\n' +
      '   Set RAZORPAY_WEBHOOK_SECRET to the secret configured on the webhook in the\n' +
      '   Razorpay Dashboard (Render → Environment), then restart.\n',
  )
  process.exit(1)
}

// Same fail-fast for shipping: with Shiprocket enabled in production, an
// unset webhook token would leave /webhooks/shiprocket open to forged status
// updates (anyone could mark orders delivered/cancelled). Dev/test and
// Shiprocket-disabled deployments are unaffected.
if (env.NODE_ENV === 'production' && has('SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD') && !env.SHIPROCKET_WEBHOOK_TOKEN) {
  // eslint-disable-next-line no-console
  console.error(
    '\n❌ SHIPROCKET_WEBHOOK_TOKEN is not set.\n' +
      '   Shiprocket credentials are configured, so production must authenticate\n' +
      '   Shiprocket webhook requests. Set SHIPROCKET_WEBHOOK_TOKEN to the token\n' +
      '   configured on the Shiprocket webhook (Render → Environment), then restart.\n',
  )
  process.exit(1)
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  clientOrigins: env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean),
  features: {
    cloudinary: has('CLOUDINARY_NAME', 'CLOUDINARY_KEY', 'CLOUDINARY_SECRET'),
    razorpay: has('RAZORPAY_KEY_ID', 'RAZORPAY_SECRET'),
    shiprocket: has('SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD'),
  },
}

export default config
