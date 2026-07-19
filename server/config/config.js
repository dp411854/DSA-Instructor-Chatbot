/**
 * config/config.js
 * -----------------
 * Centralized environment configuration.
 * All environment variables are read once here and exported,
 * so the rest of the app never touches `process.env` directly.
 */

require('dotenv').config();

const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 20, // 20 requests / window / IP

  // Chat
  MAX_MESSAGE_LENGTH: Number(process.env.MAX_MESSAGE_LENGTH) || 4000,
  MAX_HISTORY_MESSAGES: Number(process.env.MAX_HISTORY_MESSAGES) || 40, // messages kept per session
};

// Fail fast (but don't crash dev experience) if the API key is missing.
if (!config.GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] WARNING: GEMINI_API_KEY is not set. Add it to your .env file before sending chat requests.'
  );
}

module.exports = config;
