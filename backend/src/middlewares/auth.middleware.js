const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');

/**
 * FIX BUG-H02: In-process LRU cache for user lookups.
 *
 * The original middleware fetched the user on EVERY request, which:
 *   - Negated the perf benefit of stateless JWT
 *   - Saturated the Mongo connection pool under load
 *   - Caused latency spikes on every authenticated call
 *
 * We now cache the projection we actually need (`_id`, `email`, `role`, `tokenVersion`)
 * for a short TTL. The TTL bounds the window where tokenVersion changes are not
 * observed — fresh enough for normal token-version invalidation.
 *
 * Cache is per-process (fine for single-instance + small fleet). For multi-instance
 * with strict invalidation, swap to Redis with `tv` as the cache key version.
 */
const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 1000;
const cache = new Map(); // id -> { user, expiresAt }

const cacheGet = (id) => {
  const hit = cache.get(id);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(id);
    return null;
  }
  return hit.user;
};

const cacheSet = (id, user) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Drop the oldest entry — Map preserves insertion order.
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(id, { user, expiresAt: Date.now() + CACHE_TTL_MS });
};

/**
 * SECURITY NOTE (BUG-H02 race window):
 * Token version checking has a small race window between password change and
 * token verification. For systems handling highly sensitive data, consider:
 *   1. Redis-based token blacklist for immediate revocation
 *   2. Shorter JWT expiry with refresh tokens
 *   3. WebSocket broadcast for cross-device logout
 *
 * Current implementation provides reasonable security for most use cases
 * with the cache TTL bounded at 30 s.
 */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing or malformed Authorization header');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const userId = String(decoded.sub);
    let user = cacheGet(userId);

    if (!user) {
      user = await userRepository.findById(userId);
      if (!user) throw ApiError.unauthorized('User no longer exists');
      cacheSet(userId, user);
    }

    const tokenVersion = typeof decoded.tv === 'number' ? decoded.tv : 0;
    if (tokenVersion !== (user.tokenVersion || 0)) {
      // Invalidate the cached entry — token revoked.
      cache.delete(userId);
      throw ApiError.unauthorized('Token has been revoked');
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Invalidate a user's cached entry — call when the underlying user document
 * changes (password update, tokenVersion bump, deletion, role change).
 */
function invalidateAuthCache(userId) {
  if (userId) cache.delete(String(userId));
}

/**
 * Test hook — clear the in-memory cache. Not used in production paths.
 */
function _resetAuthCache() {
  cache.clear();
}

module.exports = { authenticate, invalidateAuthCache, _resetAuthCache };