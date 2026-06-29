/**
 * Standard success envelope:
 * { success, message, data, meta }
 */
export class ApiResponse {
  constructor(data = null, message = 'OK', meta = undefined) {
    this.success = true
    this.message = message
    this.data = data
    if (meta) this.meta = meta
  }
}

/** Send a success response. */
export function sendSuccess(res, { statusCode = 200, data = null, message = 'OK', meta } = {}) {
  return res.status(statusCode).json(new ApiResponse(data, message, meta))
}

export default ApiResponse
