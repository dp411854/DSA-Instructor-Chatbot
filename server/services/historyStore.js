/**
 * services/historyStore.js
 * --------------------------
 * A simple in-memory conversation history store, keyed by sessionId.
 *
 * NOTE: This is intentionally dependency-free (no DB) so the project runs
 * immediately after `npm install`. Swap this module for a Redis/Mongo
 * backed implementation in production if you need persistence across
 * server restarts or multiple instances — the rest of the app only
 * depends on the functions exported below, so the swap is a drop-in.
 */

const { MAX_HISTORY_MESSAGES } = require('../config/config');

/** @type {Map<string, {role: 'user'|'model', text: string, timestamp: number}[]>} */
const store = new Map();

function getHistory(sessionId) {
  return store.get(sessionId) || [];
}

function appendMessage(sessionId, role, text) {
  const history = store.get(sessionId) || [];
  history.push({ role, text, timestamp: Date.now() });

  // Keep only the most recent N messages to bound memory + token usage.
  const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
  store.set(sessionId, trimmed);
  return trimmed;
}

function clearHistory(sessionId) {
  store.delete(sessionId);
}

function sessionExists(sessionId) {
  return store.has(sessionId);
}

module.exports = { getHistory, appendMessage, clearHistory, sessionExists };
