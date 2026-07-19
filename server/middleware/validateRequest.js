/**
 * middleware/validateRequest.js
 * Validates and sanitizes the /chat request body before it reaches the controller.
 */

const ApiError = require('../utils/ApiError');
const { sanitizeText } = require('../utils/sanitize');
const config = require('../config/config');

function validateChatRequest(req, res, next) {
  const { message, sessionId } = req.body || {};

  if (message === undefined || message === null) {
    return next(new ApiError(400, 'Field "message" is required.'));
  }
  if (typeof message !== 'string') {
    return next(new ApiError(400, 'Field "message" must be a string.'));
  }

  const cleaned = sanitizeText(message);
  if (cleaned.length === 0) {
    return next(new ApiError(400, 'Message cannot be empty.'));
  }
  if (cleaned.length > config.MAX_MESSAGE_LENGTH) {
    return next(
      new ApiError(413, `Message is too long. Limit is ${config.MAX_MESSAGE_LENGTH} characters.`)
    );
  }

  if (sessionId !== undefined && typeof sessionId !== 'string') {
    return next(new ApiError(400, 'Field "sessionId" must be a string.'));
  }

  req.body.message = cleaned;
  req.body.sessionId = sessionId && sessionId.trim() ? sessionId.trim() : 'default';
  next();
}

function validateSessionQuery(req, res, next) {
  const sessionId = req.query.sessionId || req.body?.sessionId;
  req.sessionId = sessionId && String(sessionId).trim() ? String(sessionId).trim() : 'default';
  next();
}

module.exports = { validateChatRequest, validateSessionQuery };
