/*
 * Regression: Product Detail "Add to cart" → 400 "Validation failed".
 *
 * For a simple product (no variants) ProductDetail's size/color state is
 * null, and the page used to send `variant: { size: null, color: null }`.
 * The server's addToCartSchema only allows string values or absent keys, so
 * the request 400'd — while Quick Add (which sends `variant: {}`) worked.
 *
 * `cleanVariant` normalizes the selection before the payload is built.
 * These tests assert the payloads against the REAL server schema, so the
 * old construction fails and the cleaned one passes.
 *
 * Run: npm test (node --test, no extra dependencies)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanVariant } from '../src/lib/cartVariant.js'
import { addToCartSchema } from '../../server/src/validators/cart.validator.js'

const PRODUCT_ID = '507f1f77bcf86cd799439011'
const body = (variant) => ({ product: PRODUCT_ID, quantity: 1, variant })
const parses = (variant) => addToCartSchema.body.safeParse(body(variant)).success

test('legacy ProductDetail payload (null axes) is rejected by the server schema', () => {
  // Exactly what ProductDetail sent for a simple product before the fix.
  const legacy = { size: null, color: null }
  const result = addToCartSchema.body.safeParse(body(legacy))
  assert.equal(result.success, false)
  const fields = result.error.issues.map((i) => i.path.join('.')).sort()
  assert.deepEqual(fields, ['variant.color', 'variant.size'])
})

test('simple product: null axes clean to {} — byte-identical to Quick Add', () => {
  const cleaned = cleanVariant({ size: null, color: null })
  assert.deepEqual(cleaned, {})
  assert.equal(JSON.stringify(cleaned), JSON.stringify({})) // Quick Add sends {}
  assert.equal(parses(cleaned), true)
})

test('variant product: selected string axes are preserved and accepted', () => {
  const cleaned = cleanVariant({ size: '8mm', color: 'Red' })
  assert.deepEqual(cleaned, { size: '8mm', color: 'Red' })
  assert.equal(parses(cleaned), true)
})

test('partial selection: only the unselected (null) axis is dropped', () => {
  // A product with colors but no sizes also hit the bug (size stayed null).
  const cleaned = cleanVariant({ size: null, color: 'Gold' })
  assert.deepEqual(cleaned, { color: 'Gold' })
  assert.equal(parses(cleaned), true)
})

test('no/empty input cleans to {}', () => {
  assert.deepEqual(cleanVariant(), {})
  assert.deepEqual(cleanVariant({}), {})
  assert.equal(parses(cleanVariant()), true)
})

test('server merge-key parity: cleaned simple-product variant matches Quick Add key', () => {
  // Mirror of cart.controller.js — lines merge only on same product + same key.
  const key = (v) => `${v.color || ''}|${v.size || ''}|${v.sku || ''}`
  assert.equal(key(cleanVariant({ size: null, color: null })), key({})) // same line → merges
  assert.notEqual(key(cleanVariant({ color: 'Red' })), key({})) // different variant → own line
})
