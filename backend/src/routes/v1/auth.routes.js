const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { signupSchema, loginSchema } = require('../../validators');
const authController = require('../../controllers/auth.controller');
const config = require('../../config');

const router = Router();

/**
 * FIX BUG-M03: Rate limiter configuration
 * 
 * PRODUCTION NOTE: This uses in-memory store which works for single-instance
 * deployments. For multi-instance/load-balanced production:
 * 
 * 1. Install Redis: npm install ioredis rate-limit-redis
 * 2. Replace with:
 * 
 * const Redis = require('ioredis');
 * const RedisStore = require('rate-limit-redis');
 * const redisClient = new Redis(process.env.REDIS_URL);
 * 
 * const authLimiter = rateLimit({
 *   windowMs: config.rateLimit.windowMs,
 *   max: 20,
 *   store: new RedisStore({
 *     client: redisClient,
 *     prefix: 'rl:auth:',
 *   }),
 *   standardHeaders: true,
 *   legacyHeaders: false,
 *   message: { success: false, message: 'Too many auth attempts, please try again later' },
 * });
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;