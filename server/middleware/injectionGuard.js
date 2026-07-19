/**
 * middleware/injectionGuard.js
 * ------------------------------
 * Fast, cheap pre-filter that short-circuits obvious prompt-injection /
 * jailbreak attempts BEFORE spending a Gemini API call on them.
 *
 * This is defense-in-depth only — the real, authoritative defense is the
 * SYSTEM_PROMPT instructions sent to Gemini on every request. Even if a
 * crafted message slips past this filter, Gemini itself is instructed to
 * refuse. If it matches here, we skip the API call entirely and reply
 * instantly (also saves cost/latency).
 */

const { INJECTION_PATTERNS } = require('../config/systemPrompt');

function injectionGuard(req, res, next) {
  const message = req.body?.message || '';

  const isInjection = INJECTION_PATTERNS.some((pattern) => pattern.test(message));

  if (isInjection) {
    return res.status(200).json({
      success: true,
      reply: 'I am designed exclusively as a DSA Instructor.',
      blocked: true,
      reason: 'policy_guard',
    });
  }

  next();
}

module.exports = injectionGuard;
