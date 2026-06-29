import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import { config } from '../config/env.js'

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`
const GOLD = '#D4A373'
const INK = '#2C2C2C'

/** Render a PDFDocument to a Buffer. */
function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

function header(doc, title) {
  doc.fillColor(GOLD).fontSize(22).font('Helvetica-Bold').text(config.COMPANY_NAME, 50, 50)
  doc.fillColor('#777').fontSize(9).font('Helvetica').text('Premium handmade beads & jewelry supplies', 50, 76)
  doc.fillColor(INK).fontSize(18).font('Helvetica-Bold').text(title, 0, 50, { align: 'right' })
  doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#E5E5E5').stroke()
}

/**
 * Tax invoice PDF with GST, customer, order & payment details and a QR code.
 */
export async function generateInvoice(order, { user, payment } = {}) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  header(doc, 'TAX INVOICE')

  // QR encodes the order number for quick lookup
  const qr = await QRCode.toDataURL(`YSC:${order.orderNumber}`, { margin: 0, width: 90 })
  doc.image(Buffer.from(qr.split(',')[1], 'base64'), 470, 110, { width: 75 })

  let y = 120
  doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(`Invoice: ${order.orderNumber}`, 50, y)
  doc.font('Helvetica').fillColor('#555')
  doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 50, y + 16)
  doc.text(`GSTIN: ${config.COMPANY_GSTIN}`, 50, y + 32)
  doc.text(`Payment: ${order.paymentMethod?.toUpperCase()} · ${order.paymentStatus}`, 50, y + 48)

  // Bill to
  y = 200
  const addr = order.shippingAddress || {}
  doc.fillColor(INK).font('Helvetica-Bold').text('Bill To', 50, y)
  doc.font('Helvetica').fillColor('#555')
  doc.text(addr.fullName || user?.name || '', 50, y + 16)
  doc.text([addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '), 50, y + 30, { width: 250 })
  doc.text(`${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`, 50, y + 56)
  doc.text(`Phone: ${addr.phone || ''}`, 50, y + 70)

  // Items table
  y = 300
  doc.fillColor('#fff').rect(50, y, 495, 24).fill(GOLD)
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10)
  doc.text('Item', 58, y + 7)
  doc.text('Qty', 360, y + 7)
  doc.text('Price', 410, y + 7)
  doc.text('Amount', 480, y + 7)

  y += 30
  doc.font('Helvetica').fillColor(INK)
  ;(order.items || []).forEach((it) => {
    doc.text(it.title, 58, y, { width: 290 })
    doc.text(String(it.quantity), 360, y)
    doc.text(inr(it.price), 410, y)
    doc.text(inr(it.price * it.quantity), 480, y)
    y += 22
  })

  // Totals
  y += 10
  doc.moveTo(330, y).lineTo(545, y).strokeColor('#E5E5E5').stroke()
  y += 10
  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? INK : '#555')
    doc.text(label, 330, y)
    doc.text(value, 480, y)
    y += 18
  }
  row('Subtotal', inr(order.subtotal))
  if (order.discount) row('Discount', `- ${inr(order.discount)}`)
  row('Shipping', order.shipping ? inr(order.shipping) : 'Free')
  row('Tax (GST)', inr(order.tax))
  row('Total', inr(order.total), true)

  doc.fontSize(8).fillColor('#999').text('This is a computer-generated invoice and does not require a signature.', 50, 760, { align: 'center', width: 495 })

  return toBuffer(doc)
}

/** Shipping label PDF. */
export async function generateLabel(order) {
  const doc = new PDFDocument({ size: [288, 432], margin: 16 }) // 4x6"
  doc.fontSize(14).font('Helvetica-Bold').fillColor(INK).text(config.COMPANY_NAME, { align: 'center' })
  doc.moveDown(0.3)
  const awb = order.shipmentTracking?.awb || 'PENDING'
  const qr = await QRCode.toDataURL(awb, { margin: 0, width: 120 })
  doc.image(Buffer.from(qr.split(',')[1], 'base64'), 84, 50, { width: 120 })
  doc.fontSize(10).font('Helvetica').text(`AWB: ${awb}`, 16, 185, { align: 'center' })
  doc.fontSize(9).text(`Courier: ${order.shipmentTracking?.courier || '—'}`, { align: 'center' })
  doc.moveDown(0.5)
  const addr = order.shippingAddress || {}
  doc.font('Helvetica-Bold').text('Ship To:')
  doc.font('Helvetica').text(addr.fullName || '')
  doc.text([addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '))
  doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`)
  doc.text(`Phone: ${addr.phone || ''}`)
  doc.moveDown(0.5)
  doc.text(`Order: ${order.orderNumber}`)
  doc.text(`Payment: ${order.paymentMethod?.toUpperCase()}`)
  return toBuffer(doc)
}

/** Packing slip PDF (no prices). */
export async function generatePackingSlip(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  header(doc, 'PACKING SLIP')
  let y = 130
  doc.fillColor(INK).fontSize(10).font('Helvetica-Bold').text(`Order: ${order.orderNumber}`, 50, y)
  doc.font('Helvetica').fillColor('#555').text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 50, y + 16)
  y = 190
  doc.fillColor('#fff').rect(50, y, 495, 24).fill(GOLD)
  doc.fillColor('#fff').font('Helvetica-Bold').text('Item', 58, y + 7)
  doc.text('SKU', 320, y + 7)
  doc.text('Qty', 480, y + 7)
  y += 30
  doc.font('Helvetica').fillColor(INK)
  ;(order.items || []).forEach((it) => {
    doc.text(it.title, 58, y, { width: 250 })
    doc.text(it.sku || '—', 320, y)
    doc.text(String(it.quantity), 480, y)
    y += 22
  })
  return toBuffer(doc)
}

export default { generateInvoice, generateLabel, generatePackingSlip }
