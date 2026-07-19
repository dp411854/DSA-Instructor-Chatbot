/**
 * controllers/chatController.js
 * Thin layer that wires HTTP requests to the history store + Gemini service.
 */

const geminiService = require('../services/geminiService');
const historyStore = require('../services/historyStore');
const { escapeHtml } = require('../utils/sanitize');

/**
 * POST /api/chat
 * body: { message: string, sessionId?: string }
 */
async function postChat(req, res, next) {
  try {
    const { message, sessionId } = req.body;

    const priorHistory = historyStore.getHistory(sessionId);
    const reply = await geminiService.generateReply(priorHistory, message);

    historyStore.appendMessage(sessionId, 'user', message);
    historyStore.appendMessage(sessionId, 'model', reply);

    res.status(200).json({
      success: true,
      reply,
      sessionId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/clear-chat
 * body: { sessionId?: string }
 */
function postClearChat(req, res, next) {
  try {
    const sessionId = req.body?.sessionId || 'default';
    historyStore.clearHistory(sessionId);
    res.status(200).json({ success: true, message: 'Conversation history cleared.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history?sessionId=xyz
 */
function getHistory(req, res, next) {
  try {
    const sessionId = req.sessionId;
    const history = historyStore.getHistory(sessionId).map((m) => ({
      role: m.role,
      text: escapeHtml(m.text) === m.text ? m.text : m.text, // stored text is already sanitized on input
      timestamp: m.timestamp,
    }));
    res.status(200).json({ success: true, sessionId, history });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/history?sessionId=xyz
 */
function deleteHistory(req, res, next) {
  try {
    const sessionId = req.sessionId;
    historyStore.clearHistory(sessionId);
    res.status(200).json({ success: true, message: 'History deleted.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/health
 */
function getHealth(req, res) {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { postChat, postClearChat, getHistory, deleteHistory, getHealth };
