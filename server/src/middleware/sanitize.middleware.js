/**
 * Dependency-free request sanitizer:
 *  - strips keys starting with '$' or containing '.' (NoSQL operator injection)
 *  - neutralises angle brackets in string values (basic stored-XSS guard)
 * Mutates body/params and the individual query keys in place (Express-4 safe).
 */
function cleanString(value) {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key]
      continue
    }
    const val = obj[key]
    if (typeof val === 'string') {
      obj[key] = cleanString(val)
    } else if (val && typeof val === 'object') {
      sanitizeObject(val)
    }
  }
  return obj
}

export function sanitize(req, res, next) {
  if (req.body) sanitizeObject(req.body)
  if (req.params) sanitizeObject(req.params)
  if (req.query) {
    // req.query keys are mutable even when the object reference is not
    for (const key of Object.keys(req.query)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key]
      } else if (typeof req.query[key] === 'string') {
        req.query[key] = cleanString(req.query[key])
      } else if (req.query[key] && typeof req.query[key] === 'object') {
        sanitizeObject(req.query[key])
      }
    }
  }
  next()
}

export default sanitize
