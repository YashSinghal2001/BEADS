import { logger } from '../utils/logger.js'
import { config } from '../config/env.js'

/**
 * Email engine — responsive HTML templates + an in-memory queue with retry.
 * The transport `deliver()` logs in dev; swap for Nodemailer/Resend/SES in prod.
 * In production wire the queue to a durable broker (BullMQ/SQS).
 */
const brand = { name: config.COMPANY_NAME, accent: '#D4A373', ink: '#2C2C2C', cream: '#F8F4EF' }
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:${brand.cream};font-family:Inter,Arial,sans-serif;color:${brand.ink}">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="display:inline-block;background:${brand.accent};color:#fff;width:40px;height:40px;line-height:40px;border-radius:50%;font-weight:700;font-size:20px">Y</span>
      <div style="font-family:Georgia,serif;font-size:20px;margin-top:8px">${brand.name}</div>
    </div>
    <div style="background:#fff;border-radius:20px;padding:28px;box-shadow:0 10px 30px -12px rgba(44,44,44,.2)">
      <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 12px">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#9b9b9b;font-size:12px;margin-top:20px">© ${new Date().getFullYear()} ${brand.name}. Crafted with love for makers.</p>
  </div></body></html>`
}

const p = (text) => `<p style="line-height:1.6;color:#3A3A3A;margin:0 0 12px">${text}</p>`

export const templates = {
  welcome: (d) => ({
    subject: `Welcome to ${brand.name}!`,
    text: `Welcome ${d.name || ''}! Explore premium beads & supplies.`,
    html: layout('Welcome to the studio', p(`Hi ${d.name || 'there'}, welcome to ${brand.name} — your home for premium handmade beads & jewelry supplies.`)),
  }),
  verification: (d) => ({
    subject: 'Verify your email',
    text: `Your verification code is ${d.otp}. It expires in 10 minutes.`,
    html: layout('Verify your email', p(`Your verification code is:`) + `<div style="font-size:30px;font-weight:700;letter-spacing:6px;text-align:center;margin:16px 0">${d.otp}</div>` + p('This code expires in 10 minutes.')),
  }),
  password_reset: (d) => ({
    subject: 'Reset your password',
    text: `Use code ${d.otp} or open ${d.link} to reset your password.`,
    html: layout('Reset your password', p(`Use the code below or the button to reset your password:`) + `<div style="font-size:30px;font-weight:700;letter-spacing:6px;text-align:center;margin:16px 0">${d.otp}</div>`),
  }),
  order_confirmation: (d) => ({
    subject: `Order ${d.orderNumber} confirmed`,
    text: `Your order ${d.orderNumber} (${inr(d.total)}) is confirmed.`,
    html: layout('Order confirmed 🎉', p(`Hi ${d.name || 'there'}, thanks for your order!`) + p(`<b>${d.orderNumber}</b> — total <b>${inr(d.total)}</b>.`) + p('We will notify you when it ships.')),
  }),
  payment_success: (d) => ({
    subject: `Payment received for ${d.orderNumber}`,
    text: `We received your payment of ${inr(d.total)} for ${d.orderNumber}.`,
    html: layout('Payment successful', p(`We've received your payment of <b>${inr(d.total)}</b> for order <b>${d.orderNumber}</b>.`)),
  }),
  payment_failure: (d) => ({
    subject: `Payment failed for ${d.orderNumber}`,
    text: `Your payment for ${d.orderNumber} failed. You can retry from your orders.`,
    html: layout('Payment failed', p(`Unfortunately your payment for <b>${d.orderNumber}</b> didn't go through. You can retry from your account.`)),
  }),
  shipped: (d) => ({
    subject: `Your order ${d.orderNumber} has shipped`,
    text: `Your order ${d.orderNumber} is on its way.${d.tracking?.trackingUrl ? ` Track: ${d.tracking.trackingUrl}` : ''}`,
    html: layout('On its way! 📦', p(`Great news — order <b>${d.orderNumber}</b> has shipped.`) + (d.tracking?.awb ? p(`AWB: <b>${d.tracking.awb}</b> (${d.tracking.courier || 'courier'})`) : '')),
  }),
  delivered: (d) => ({
    subject: `Order ${d.orderNumber} delivered`,
    text: `Your order ${d.orderNumber} was delivered. Enjoy!`,
    html: layout('Delivered ✨', p(`Order <b>${d.orderNumber}</b> has been delivered. We'd love a review!`)),
  }),
  cancelled: (d) => ({
    subject: `Order ${d.orderNumber} cancelled`,
    text: `Your order ${d.orderNumber} has been cancelled.`,
    html: layout('Order cancelled', p(`Order <b>${d.orderNumber}</b> has been cancelled. Any payment will be refunded per our policy.`)),
  }),
  refund_issued: (d) => ({
    subject: `Refund issued for ${d.orderNumber}`,
    text: `A refund for ${d.orderNumber} has been issued.`,
    html: layout('Refund issued', p(`A refund for order <b>${d.orderNumber}</b> has been processed to your original payment method.`)),
  }),
}

async function deliver({ to, subject, text }) {
  if (!to) return { delivered: false, reason: 'no-recipient' }
  if (!config.isProd) logger.info(`✉️  [email] to=${to} | ${subject}\n      ${text}`)
  // production: integrate transport here
  return { delivered: true, channel: 'log' }
}

/* ----------------------------- Queue --------------------------------- */
const MAX_ATTEMPTS = 3

class EmailQueue {
  constructor() {
    this.items = []
    this.processing = false
  }

  enqueue({ type, to, data = {} }) {
    if (!templates[type]) {
      logger.warn(`Unknown email template: ${type}`)
      return
    }
    this.items.push({ type, to, data, attempts: 0 })
    this._kick()
  }

  _kick() {
    if (this.processing) return
    this.processing = true
    setImmediate(() => this._drain())
  }

  async _drain() {
    while (this.items.length) {
      const item = this.items.shift()
      try {
        const tpl = templates[item.type](item.data)
        // eslint-disable-next-line no-await-in-loop
        await deliver({ to: item.to, ...tpl })
      } catch (err) {
        item.attempts += 1
        if (item.attempts < MAX_ATTEMPTS) {
          logger.warn(`Email retry ${item.attempts}/${MAX_ATTEMPTS} for ${item.type}`)
          this.items.push(item)
        } else {
          logger.error(`Email permanently failed (${item.type}): ${err.message}`)
        }
      }
    }
    this.processing = false
  }
}

export const emailQueue = new EmailQueue()

/* ------------------- Backward-compatible direct senders -------------- */
export function sendOtpEmail(to, otp) {
  const tpl = templates.verification({ otp })
  return deliver({ to, ...tpl })
}
export function sendPasswordResetEmail(to, { otp, token }) {
  const link = `${config.clientOrigins[0]}/reset-password?token=${token}&email=${encodeURIComponent(to)}`
  const tpl = templates.password_reset({ otp, link })
  return deliver({ to, ...tpl })
}
export function sendOrderConfirmationEmail(to, order) {
  const tpl = templates.order_confirmation({ orderNumber: order.orderNumber, total: order.total, name: order.shippingAddress?.fullName })
  return deliver({ to, ...tpl })
}
