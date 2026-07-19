# 🧠 DSA Mentor — AI-Powered DSA Instructor Chatbot

A production-ready, full-stack chatbot that teaches **only Data Structures &
Algorithms**, powered by Google's **Gemini API**. Built with vanilla
HTML/CSS/JS on the frontend and Node.js/Express on the backend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Run Locally](#run-locally)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Security](#security)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Project Overview

DSA Mentor is a ChatGPT-style chat interface dedicated exclusively to
teaching Data Structures & Algorithms. The AI is constrained by a strict
system prompt and a defense-in-depth injection guard so it **refuses any
question outside DSA** and resists prompt-injection / jailbreak attempts
("ignore previous instructions", "reveal your system prompt", "pretend to be
ChatGPT", etc.).

For every DSA topic it covers:
- Clear conceptual explanation
- Brute Force vs Optimized approach comparison
- Clean, commented, optimized code
- Time & Space Complexity analysis
- Dry runs / traces where useful
- Context-aware follow-ups ("optimize this", "explain line 10", "now
  iterative", "dry run it")

---

## Features

### Chat Interface
- ChatGPT-style layout with sidebar, topic shortcuts, and composer
- Distinct user/AI message bubbles with avatars
- Animated typing indicator while the AI is responding
- Auto-scroll to the latest message
- Enter to send, Shift+Enter for a new line
- Full Markdown rendering (headings, lists, bold, links, tables)
- Syntax-highlighted code blocks (via highlight.js) with a **Copy Code**
  button per block
- Fully responsive (mobile-first breakpoints, collapsible sidebar)
- Dark Mode / Light Mode toggle (persisted in `localStorage`)

### AI Behavior
- Strict DSA-only system prompt (see `server/config/systemPrompt.js`)
- Refuses non-DSA questions with a fixed, on-brand message
- Two-layer prompt-injection protection:
  1. Fast regex pre-filter middleware (`injectionGuard.js`) that blocks
     obvious jailbreak attempts before calling the API at all
  2. Hard behavioral instructions inside the Gemini system prompt itself
- Maintains per-session conversation history for contextual follow-ups
- 30-second timeout guard on Gemini calls

### Backend
- Modular **MVC-style architecture**: routes → controllers → services
- REST API: `/chat`, `/clear-chat`, `/history`, `/health`
- Centralized error-handling middleware with consistent JSON error shape
- Input validation & sanitization middleware
- Rate limiting (`express-rate-limit`) to protect the Gemini quota
- `helmet` for HTTP security headers, `cors` for cross-origin control
- Environment-variable-based configuration (`.env`)

---

## Tech Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript (ES6)         |
| Backend    | Node.js, Express.js                           |
| AI         | Google Gemini API (`@google/generative-ai`)   |
| Security   | helmet, cors, express-rate-limit              |
| Markdown   | marked.js                                     |
| Highlighting | highlight.js                                |
| Version Control | Git & GitHub                             |
| Deployment | Render (backend), Vercel/Netlify (frontend)   |

---

## Folder Structure

```
DSA-Instructor-Chatbot/
│
├── client/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── assets/
│   └── components/
│
├── server/
│   ├── routes/
│   │   └── chatRoutes.js
│   ├── controllers/
│   │   └── chatController.js
│   ├── middleware/
│   │   ├── validateRequest.js
│   │   ├── injectionGuard.js
│   │   ├── rateLimiter.js
│   │   └── errorMiddleware.js
│   ├── services/
│   │   ├── geminiService.js
│   │   └── historyStore.js
│   ├── config/
│   │   ├── config.js
│   │   └── systemPrompt.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   └── sanitize.js
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Screenshots

> _Add your own screenshots here after running the app locally._

| Chat (Dark Mode) | Chat (Light Mode) | Mobile View |
|---|---|---|
| `docs/screenshot-dark.png` | `docs/screenshot-light.png` | `docs/screenshot-mobile.png` |

---

## Installation

### Prerequisites
- Node.js **v18+**
- npm
- A Gemini API key — get one free at
  [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Clone the repo

```bash
git clone https://github.com/<your-username>/DSA-Instructor-Chatbot.git
cd DSA-Instructor-Chatbot
```

### Install backend dependencies

```bash
cd server
npm install
```

The frontend has **no build step** — it's plain HTML/CSS/JS, so there's
nothing to install in `client/`.

---

## Environment Variables

Copy the example file and fill in your key:

```bash
cd server
cp .env.example .env
```

`server/.env`:

| Variable                | Description                                              | Default |
|--------------------------|-----------------------------------------------------------|---------|
| `PORT`                  | Port the backend listens on                                | `5000` |
| `NODE_ENV`               | `development` or `production`                              | `development` |
| `GEMINI_API_KEY`         | **Required.** Your Gemini API key                          | — |
| `GEMINI_MODEL`           | Gemini model name                                           | `gemini-2.0-flash` |
| `CLIENT_ORIGIN`          | Comma-separated allowed CORS origins, or `*`                | `*` |
| `RATE_LIMIT_WINDOW_MS`   | Rate-limit window in ms                                     | `60000` |
| `RATE_LIMIT_MAX`         | Max requests per window per IP                              | `20` |
| `MAX_MESSAGE_LENGTH`     | Max characters per user message                             | `4000` |
| `MAX_HISTORY_MESSAGES`   | Max messages kept per session (for context + memory bound)  | `40` |

---

## Run Locally

Everything runs from **a single terminal on a single port** — the Express
backend also serves the frontend files directly, so there's no separate
static server and no CORS setup needed for local dev.

```bash
cd server
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```

Once you see `🚀 DSA Instructor Chatbot API running on port 5000`, open:

```
http://localhost:5000
```

in your browser. That's it — the chat UI and the API are both served from
that one address.

> **Deploying frontend and backend separately?** (e.g. frontend on
> Vercel/Netlify, backend on Render) — the static-serving in `app.js` is
> optional and simply won't be used. In that case, set `API_BASE` at the
> top of `client/script.js` to your deployed backend's full URL, and set
> `CLIENT_ORIGIN` in the backend's `.env` to your deployed frontend's URL
> so CORS allows it. See [Deployment](#deployment) below.

---

## API Documentation

Base URL: `http://localhost:5000/api`

### `POST /chat`
Send a user message and get the AI's reply.

**Request body:**
```json
{
  "message": "Explain binary search with time complexity",
  "sessionId": "sess_abc123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "reply": "## Binary Search\n...",
  "sessionId": "sess_abc123"
}
```

**Error responses:** `400` (invalid input), `413` (message too long), `429`
(rate limited), `502`/`504` (Gemini API failure/timeout), `500` (server
misconfiguration, e.g. missing API key).

---

### `POST /clear-chat`
Clears the server-side conversation history for a session.

**Request body:** `{ "sessionId": "sess_abc123" }`
**Response:** `{ "success": true, "message": "Conversation history cleared." }`

---

### `GET /history?sessionId=sess_abc123`
Returns the stored conversation history for a session.

**Response:**
```json
{
  "success": true,
  "sessionId": "sess_abc123",
  "history": [
    { "role": "user", "text": "...", "timestamp": 1719999999999 },
    { "role": "model", "text": "...", "timestamp": 1719999999999 }
  ]
}
```

---

### `DELETE /history?sessionId=sess_abc123`
Deletes the stored history for a session (same effect as `/clear-chat`).

---

### `GET /health`
Health check endpoint for uptime monitors / Render health checks.

```json
{ "success": true, "status": "ok", "uptimeSeconds": 123.4, "timestamp": "..." }
```

---

## Deployment

You have two options: deploy the backend and frontend together as one
service (simplest), or split them across two platforms (more scalable).

### Option A — Single service (recommended, matches local dev)

Since `server/app.js` already serves `client/` as static files, you can
deploy the whole `server/` folder to Render as one Web Service and it will
serve both the UI and the API from one URL — no separate frontend
deployment or CORS config needed. Just follow the Render steps below.

### Option B — Backend and frontend on separate platforms

### Backend → Render

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **New Web Service**, connect
   your repo, and set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add environment variables from your `.env` in Render's dashboard
   (`GEMINI_API_KEY` is required).
4. Deploy — Render will give you a URL like
   `https://dsa-instructor-chatbot.onrender.com`.

### Frontend → Vercel or Netlify

1. Set the **root directory** to `client`.
2. No build command needed (static site).
3. Before deploying, update `API_BASE` in `client/script.js` to your Render
   backend URL, e.g.:
   ```js
   const API_BASE = 'https://dsa-instructor-chatbot.onrender.com/api';
   ```
4. Update `CLIENT_ORIGIN` in your Render backend's environment variables to
   your deployed frontend URL, so CORS allows it.

---

## Security

- Gemini API key is never exposed to the client — all AI calls happen
  server-side.
- Input is validated (type/length) and sanitized (control characters
  stripped) before it touches the AI or storage.
- `helmet` sets secure HTTP headers; request body size is capped at
  `100kb` to prevent payload-based abuse.
- Prompt-injection defense-in-depth: regex pre-filter + hardened system
  prompt instructions.
- Rate limiting protects both the server and your Gemini quota from abuse.
- The frontend always renders AI/user content through `textContent` or a
  Markdown parser (no raw `innerHTML` of user input), preventing stored/DOM
  XSS.

---

## Future Improvements

- [ ] Persistent database (MongoDB/Postgres) for conversation history
      instead of in-memory storage
- [ ] Full JWT authentication (login/signup, password hashing) for
      per-user chat history across devices
- [ ] Streaming responses (token-by-token) for a faster perceived reply
- [ ] Voice input / text-to-speech for explanations
- [ ] Export conversation as PDF/Markdown
- [ ] Multi-language code generation toggle in the UI
- [ ] Unit/integration test suite (Jest + Supertest)

---

## License

MIT — free to use, modify, and deploy.
