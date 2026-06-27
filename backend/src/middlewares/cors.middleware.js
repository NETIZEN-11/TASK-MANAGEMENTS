const cors = require('cors');
const config = require('../config');
const logger = require('../utils/logger');

const DEV_PORT_PATTERN = /:(5173|5174|5175|4173)$/;
const LOCALHOST = /^http:\/\/localhost(?::\d+)?$/;
const LOOPBACK = /^http:\/\/127\.0\.0\.1(?::\d+)?$/;
const VERCEL = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;

/**
 * Canonical trusted origins. These are added to the production allow-list
 * UNCONDITIONALLY so a misconfigured env var (or a missing one) cannot
 * lock out the live frontend.
 *
 * Add new deployment URLs here. The set is small on purpose — every entry
 * is opt-in.
 */
const HARD_CODED_TRUSTED_ORIGINS = [
  'https://task-managements-frontend-khaki.vercel.app',
  'https://task-management-frontend-orcin-eta.vercel.app',
];

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
 *
 * FIX: Extra trusted origins can be added at runtime via the
 * `ALLOWED_ORIGINS` env var (comma-separated). This avoids redeploying the
 * backend every time Vercel rotates the preview URL. The canonical Vercel
 * deployments are still hard-coded as defaults so a fresh deploy works
 * out of the box.
 */
function buildProdAllowList() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => sanitizeOrigin(s.trim()))
    .filter(Boolean);

  // Log the inputs so a misconfigured env var is visible at startup.
  const envRaw = process.env.ALLOWED_ORIGINS || '';
  if (envRaw) {
    logger.info(
      `CORS: ALLOWED_ORIGINS env var parsed ${fromEnv.length} entr${
        fromEnv.length === 1 ? 'y' : 'ies'
      } from "${envRaw}"`
    );
  }

  // Sanitize the configured client origin defensively. An empty/garbage
  // value is dropped (it isn't added in a way that breaks the lookup),
  // while the hard-coded list below guarantees the canonical deployments
  // are always present.
  const clientOriginSanitized = sanitizeOrigin(config.clientOrigin);
  if (config.clientOrigin && !clientOriginSanitized) {
    logger.warn(
      `CORS: CLIENT_ORIGIN="${config.clientOrigin}" failed sanitization and was dropped from the allow-list`
    );
  }

  const allowList = new Set([
    ...HARD_CODED_TRUSTED_ORIGINS,
    ...(clientOriginSanitized ? [clientOriginSanitized] : []),
    ...fromEnv,
  ]);

  // Log the final allow-list at startup so a missing entry is visible in
  // Render logs without having to trigger a real request.
  if (config.isProduction) {
    logger.info(
      `CORS: production allow-list (${allowList.size}): ${[...allowList].join(', ')}`
    );
  }

  return allowList;
}

/**
 * Validate that a string looks like a plausible origin URL before trusting it
 * in an env var. Catches typos like a trailing slash, a path, or whitespace.
 * Reject anything that doesn't look like `scheme://host[:port]` so a stray
 * `ALLOWED_ORIGINS=https://evil.com<script>` can't slip through.
 */
function sanitizeOrigin(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname) return null;
    if (u.pathname && u.pathname !== '/') return null;
    if (u.search || u.hash) return null;
    return u.origin;
  } catch {
    return null;
  }
}

module.exports = function corsMiddleware() {
  const PROD_ALLOWED = buildProdAllowList();

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
module.exports.buildProdAllowList = buildProdAllowList;
module.exports.sanitizeOrigin = sanitizeOrigin;
module.exports.HARD_CODED_TRUSTED_ORIGINS = HARD_CODED_TRUSTED_ORIGINS;