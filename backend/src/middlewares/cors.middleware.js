const cors = require('cors');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = function corsMiddleware() {
  // Build the list of allowed origins in production
  const allowedOrigins = new Set([
    'https://task-managements-frontend-khaki.vercel.app',
    'https://task-management-frontend-orcin-eta.vercel.app'
  ]);

  if (config.clientOrigin) {
    allowedOrigins.add(config.clientOrigin.trim().replace(/\/$/, ''));
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
      const trimmed = origin.trim().replace(/\/$/, '');
      if (trimmed) {
        allowedOrigins.add(trimmed);
      }
    });
  }

  if (config.isProduction) {
    logger.info(`CORS: production allow-list (${allowedOrigins.size}): ${[...allowedOrigins].join(', ')}`);
  }

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) {
        return callback(null, true);
      }

      // In development, allow localhost and any dev ports
      if (!config.isProduction) {
        return callback(null, true);
      }

      // In production, check against whitelist
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Origin not allowed: return false instead of throwing Error to prevent 500 response
      logger.warn(`CORS: origin not allowed in production: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
    optionsSuccessStatus: 200
  });
};

module.exports.isDevOrigin = (origin) => !config.isProduction;