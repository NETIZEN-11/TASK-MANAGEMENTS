const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const corsMiddleware = require('./middlewares/cors.middleware');
const requestId = require('./middlewares/requestId.middleware');
const logger = require('./utils/logger');

function buildApp() {
  const app = express();

  app.use(requestId);

  app.disable('x-powered-by');

  // FIX: Set CSP via HTTP header (NOT meta tag) so 'frame-ancestors' is honored.
  // Per the CSP spec (https://www.w3.org/TR/CSP3/#meta-element), the
  // 'frame-ancestors' directive is ignored when delivered via a <meta> element;
  // it is only honored when delivered as an HTTP header. helmet's
  // contentSecurityPolicy uses the HTTP header, which is what we want.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // 'unsafe-inline' is required for Vite-emitted production styles
          // (style attributes are not affected by 'unsafe-inline' on style-src).
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          // 'http:' covers dev-time http://localhost:5001 calls.
          connectSrc: ["'self'", 'http:', 'https:', 'ws:', 'wss:'],
          fontSrc: ["'self'", 'data:', 'https:'],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          // Only honored via HTTP header — meta-element CSP ignores this.
          frameAncestors: ["'none'"],
        },
      },
    })
  );
  app.use(
    compression({
      filter: (req, res) => {
        if (res.statusCode >= 400) return false;
        return compression.filter(req, res);
      },
    })
  );
  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (!config.isTest) {
    app.use(
      morgan(config.isProduction ? 'combined' : 'dev', {
        stream: { write: (msg) => logger.info(msg.trim()) },
      })
    );
  }

  app.get('/', (_req, res) =>
    res.json({
      success: true,
      message: 'Task Management API',
      version: '1.0.0',
    })
  );

  app.use('/api/v1', v1Routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { buildApp, logger };