const { StatusCodes } = require('http-status-codes');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function notFoundHandler(req, _res, next) {
  return next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  let { statusCode, message, details } = err;

  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Payload too large';
    details = { limit: err.limit };
  } else if (err.type === 'entity.parse.failed') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Malformed JSON body';
  } else if (err instanceof ApiError) {
  } else if (err && err.name === 'CastError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Invalid identifier';
  } else if (typeof statusCode !== 'number') {
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    message = err.message || 'Internal server error';
    details = null;
  }

  // FIX BUG-H03: Properly handle case when headers are already sent
  if (res.headersSent) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode} after headers sent: ${err.message}`);
    // Don't try to send another response - just end the response gracefully
    try {
      res.end();
    } catch (endError) {
      logger.error('Failed to end response after headers sent:', endError.message);
    }
    return; // Don't pass to next, just return
  }

  const includeStack = statusCode >= 500 && !config.isProduction;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}: ${err.stack || message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  }

  const body = {
    success: false,
    statusCode,
    message,
    ...(details ? { details } : {}),
    ...(includeStack ? { stack: err.stack } : {}),
  };

  if (req.id) body.requestId = req.id;

  res.statusCode = statusCode;
  res.json(body);
}

module.exports = { notFoundHandler, errorHandler };