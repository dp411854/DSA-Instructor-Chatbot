/**
 * routes/chatRoutes.js
 * Maps HTTP endpoints to controller functions, applying middleware in order:
 * validate -> injection guard -> rate limit -> controller
 */

const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');
const { validateChatRequest, validateSessionQuery } = require('../middleware/validateRequest');
const injectionGuard = require('../middleware/injectionGuard');
const { chatRateLimiter } = require('../middleware/rateLimiter');

router.post('/chat', chatRateLimiter, validateChatRequest, injectionGuard, chatController.postChat);
router.post('/clear-chat', chatController.postClearChat);
router.get('/history', validateSessionQuery, chatController.getHistory);
router.delete('/history', validateSessionQuery, chatController.deleteHistory);
router.get('/health', chatController.getHealth);

module.exports = router;
