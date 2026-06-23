const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return v;
}

const env = process.env.NODE_ENV || 'development';

const PLACEHOLDER_SECRETS = new Set([
  'replace_with_a_long_random_secret',
  'change-me-in-production',
  'secret',
  'test_jwt_secret_for_unit_tests',
  'test_jwt_secret_for_unit_tests_must_be_at_least_32_chars',
  '4xT9#kP2!mQ8@vL7$zR1^nB5&wH3_render_prod',
]);

function assertJwtSecret(secret, envName) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT_SECRET is missing');
  }
  if (envName === 'production' && PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET is set to a known placeholder — refusing to start. ' +
      'Generate a strong secret (e.g. `openssl rand -base64 48`) and set it via secrets manager.'
    );
  }
  // Enforce minimum entropy in production to defend against weak secrets.
  if (envName === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
}

const jwtSecret = requireEnv('JWT_SECRET');
assertJwtSecret(jwtSecret, env);

const config = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: requireEnv('MONGO_URI'),
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Test-only helpers are attached to the same export object BEFORE freezing,
// so `require('../src/config').assertJwtSecret` works in unit tests.
config.assertJwtSecret = assertJwtSecret;
config.PLACEHOLDER_SECRETS = PLACEHOLDER_SECRETS;

module.exports = Object.freeze(config);