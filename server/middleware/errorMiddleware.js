/**
 * middleware/errorMiddleware.js
 * All errors thrown/passed via next(err) anywhere in the app end up here.
 * Ensures a single, consistent JSON error shape for the frontend.
 */

const config = require('../config/config');

// 404 handler — must be registered AFTER all routes.
function notFound(req, res, next) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  // Log full error server-side (never leak stack traces to the client).
  // eslint-disable-next-line no-console
  console.error(`[error] ${req.method} ${req.originalUrl} ->`, err.message);
  if (config.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
