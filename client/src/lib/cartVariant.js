/*
 * Normalize a UI variant selection into the shape POST /cart accepts.
 * Unselected axes live as `null` in component state (e.g. ProductDetail's
 * size/color for a simple product), but the server schema only allows string
 * values or absent keys — so nulls must be dropped, making a simple product's
 * payload `{}`, identical to Quick Add. The server's line-merge key already
 * treats absent and empty-string axes the same.
 */
export function cleanVariant(variant = {}) {
  const out = {}
  for (const [k, v] of Object.entries(variant)) {
    if (typeof v === 'string' && v !== '') out[k] = v
  }
  return out
}

export default cleanVariant
