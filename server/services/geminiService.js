/**
 * services/geminiService.js
 * ---------------------------
 * All direct communication with Google's Gemini API lives here.
 * Controllers never call the SDK directly — they call this service.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');
const { SYSTEM_PROMPT } = require('../config/systemPrompt');
const ApiError = require('../utils/ApiError');

let genAI = null;
function getClient() {
  if (!config.GEMINI_API_KEY) {
    throw new ApiError(
      500,
      'Server is missing GEMINI_API_KEY. Add it to server/.env and restart the server.'
    );
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Converts our internal history format into Gemini's `contents` format.
 * @param {{role: 'user'|'model', text: string}[]} history
 */
function toGeminiContents(history) {
  return history.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

/**
 * Sends the full conversation (system prompt + history + new message) to
 * Gemini and returns the model's text reply.
 *
 * @param {{role:'user'|'model', text:string}[]} history - prior turns (NOT including the new message)
 * @param {string} userMessage - the new user message (already sanitized)
 * @returns {Promise<string>} the AI's reply text
 */
async function generateReply(history, userMessage) {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: config.GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  });

  try {
    const chat = model.startChat({ history: toGeminiContents(history) });

    // Basic timeout wrapper so a hung request doesn't hang the API forever.
    const TIMEOUT_MS = 30000;
    const result = await Promise.race([
      chat.sendMessage(userMessage),
      new Promise((_, reject) =>
        setTimeout(() => reject(new ApiError(504, 'The AI took too long to respond. Please try again.')), TIMEOUT_MS)
      ),
    ]);

    const text = result.response.text();
    if (!text || !text.trim()) {
      throw new ApiError(502, 'The AI returned an empty response. Please try again.');
    }
    return text.trim();
  } catch (err) {
    if (err.isApiError) throw err;

    // Translate common Gemini SDK / HTTP errors into clean ApiErrors.
    const status = err?.status || err?.response?.status;
    if (status === 429) {
      throw new ApiError(429, 'Gemini API rate limit reached. Please wait a moment and try again.');
    }
    if (status === 401 || status === 403) {
      throw new ApiError(500, 'Gemini API authentication failed. Check your GEMINI_API_KEY.');
    }
    if (status >= 500) {
      throw new ApiError(502, 'Gemini API is currently unavailable. Please try again shortly.');
    }
    // eslint-disable-next-line no-console
    console.error('[geminiService] Unexpected error:', err);
    throw new ApiError(500, 'Failed to get a response from the AI service.');
  }
}

module.exports = { generateReply };
