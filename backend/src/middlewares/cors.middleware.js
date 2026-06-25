const cors = require('cors');
const config = require('../config');

const DEV_PORT_PATTERN = /:(5173|5174|5175|4173)$/;
const LOCALHOST = /^http:\/\/localhost(?::\d+)?$/;
const LOOPBACK = /^http:\/\/127\.0\.0\.1(?::\d+)?$/;
const VERCEL = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;

function isPrivateLanWithDevPort(origin) {
  const match = origin.match(/^http:\/\/([^/:]+)(?::(\d+))?/);
  if (!match) return false;
  const host = match[1];
  const port = match[2];
  if (!DEV_PORT_PATTERN.test(`:${port}`)) return false;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m) {
    const second = parseInt(m[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function isDevOrigin(origin) {
  if (!origin) return true;
  if (LOCALHOST.test(origin) || LOOPBACK.test(origin)) return true;
  if (config.isProduction) return false;
  if (DEV_PORT_PATTERN.test(origin)) {
    if (isPrivateLanWithDevPort(origin)) return true;
    if (/^http:\/\/localhost(?::\d+)?$/.test(origin)) return true;
  }
  if (origin === config.clientOrigin) return true;
  return false;
}

/**
 * FIX BUG-M12: production allow-list is explicit, not a wildcard.
 *
 * Behavior by environment:
 *  - Production: only the configured `CLIENT_ORIGIN` and a hard-coded allow-list
 *    of trusted Vercel deployments are allowed. Wildcards for vercel.app were
 *    removed because a takeover of any other project on the same platform could
 *    lead to cross-site token theft.
 *  - Development: localhost + 127.0.0.1 + LAN IPs on common dev ports are
 *    allowed. This is unsafe on public WiFi — disable with NODE_ENV=production.
 */
module.exports = function corsMiddleware() {
  const PROD_ALLOWED = new Set(
    [config.clientOrigin, 'https://task-management-frontend-orcin-eta.vercel.app'].filter(
      Boolean
    )
  );

  return cors({
    origin: (origin, cb) => {
      // No-origin (curl, server-to-server, Postman) — allow.
      if (!origin) return cb(null, true);
      // Localhost / loopback always allowed.
      if (LOCALHOST.test(origin) || LOOPBACK.test(origin)) return cb(null, true);
      // In production, only the explicit allow-list.
      if (config.isProduction) {
        return PROD_ALLOWED.has(origin)
          ? cb(null, true)
          : cb(new Error(`CORS: origin not allowed in production: ${origin}`));
      }
      // Development: localhost, LAN, or the configured client origin.
      if (isDevOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin not allowed: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: false,
    maxAge: 600,
  });
};

module.exports.isDevOrigin = isDevOrigin;