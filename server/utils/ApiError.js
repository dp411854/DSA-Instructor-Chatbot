/**
 * utils/ApiError.js
 * A small typed error class so controllers can throw meaningful,
 * HTTP-status-aware errors that the error middleware understands.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isApiError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
