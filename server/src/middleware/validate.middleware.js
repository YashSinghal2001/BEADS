/**
 * Validate request parts against a zod schema map: { body, query, params }.
 * Parsed (and coerced) values replace the originals so controllers receive
 * clean, typed data.
 */
export const validate = (schemas = {}) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body)
    if (schemas.params) req.params = schemas.params.parse(req.params)
    if (schemas.query) {
      // req.query is a getter in some setups; assign parsed values onto it
      const parsed = schemas.query.parse(req.query)
      Object.keys(parsed).forEach((k) => {
        req.query[k] = parsed[k]
      })
      req.validatedQuery = parsed
    }
    next()
  } catch (err) {
    next(err)
  }
}

export default validate
