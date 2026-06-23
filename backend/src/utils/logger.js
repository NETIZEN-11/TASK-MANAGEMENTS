const winston = require('winston');
const config = require('../config');
const path = require('path');
const fs = require('fs');

const { combine, timestamp, printf, colorize, errors, splat, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `[${ts}] ${level}: ${stack || message}`;
});

// FIX BUG-M05: Add file transport with rotation for production
// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), consoleFormat),
  }),
];

// Add file transports in production
if (config.isProduction) {
  // Error log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: combine(timestamp(), json()),
    })
  );
  
  // Combined log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: combine(timestamp(), json()),
    })
  );
}

const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(errors({ stack: true }), splat(), timestamp('YYYY-MM-DD HH:mm:ss')),
  transports,
});

module.exports = logger;