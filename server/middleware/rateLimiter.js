/**
 * middleware/rateLimiter.js
 * Protects the /chat endpoint (and therefore the Gemini API quota)
 * from being hammered by a single client.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const chatRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again in a moment.',
  },
});

module.exports = { chatRateLimiter };
