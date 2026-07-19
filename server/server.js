/**
 * server.js
 * Boots the HTTP server. Kept separate from app.js so app.js can be
 * imported in tests without opening a real network port.
 */

const app = require('./app');
const config = require('./config/config');

const server = app.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 DSA Instructor Chatbot API running on port ${config.PORT} [${config.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', err);
});
