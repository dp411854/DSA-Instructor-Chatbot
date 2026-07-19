/**
 * utils/sanitize.js
 * Strips/escapes potentially dangerous HTML so stored + echoed
 * user content can never execute as script (defense against stored/DOM XSS),
 * while leaving normal text and Markdown code fences intact.
 */

/**
 * Escapes the 5 HTML-significant characters.
 * We intentionally do NOT strip Markdown code fences (```), since the
 * frontend renders Markdown safely (see client/script.js -> escapeHtml
 * inside the markdown renderer) and needs the raw fences to work.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Removes null bytes / control characters and trims excessive whitespace.
 * Used on every incoming user message before it touches the AI or storage.
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\u0000/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

module.exports = { escapeHtml, sanitizeText };
