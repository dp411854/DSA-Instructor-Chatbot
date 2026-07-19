/**
 * app.js
 * Configures the Express application: security middleware, parsers,
 * routes, and error handling. Exported (not started) so it can be
 * imported by tests or by server.js.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/config');
const chatRoutes = require('./routes/chatRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// --- Security & core middleware -------------------------------------------------
// helmet's default Content-Security-Policy is tuned for API-only servers and
// blocks the CDN scripts/styles the frontend loads (fonts, highlight.js,
// marked.js). Since this server now also serves the frontend, disable CSP
// here and rely on the other helmet protections; add a tailored CSP if you
// deploy this publicly.
app.use(helmet({ contentSecurityPolicy: false }));
// CORS Configuration
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

// Limit request body size to prevent abuse / huge payload attacks.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- API routes ---------------------------------------------------------------------
app.use('/api', chatRoutes);

// --- Serve the frontend (client/) from this same server ----------------------------
// This lets the whole app run from a single terminal/port during local dev
// (http://localhost:5000) with zero CORS issues, since frontend + backend
// share the same origin. For production, you can still deploy client/ to
// Vercel/Netlify separately if you prefer — this static serving is optional
// and simply ignored if you do that (just point script.js's API_BASE at
// your backend URL instead).
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDir, 'index.html'));
});

// --- Error handling (must be last) -------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
