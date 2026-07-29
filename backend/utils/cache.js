/**
 * Production In-Memory TTL Cache Utility
 * Purpose: Reduces MongoDB read load by caching GET responses with a 30-second TTL.
 * Automatically invalidated upon ingestion completion. Never caches non-2xx responses.
 */

const logger = require('./logger');

const store = new Map();
const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds

// Periodic cleanup of expired cache entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now >= record.expiresAt) {
      store.delete(key);
    }
  }
}, 60 * 1000).unref();

/**
 * Gets cached data if valid and non-expired.
 */
const getCache = (key) => {
  const record = store.get(key);
  if (!record) return null;

  if (Date.now() >= record.expiresAt) {
    store.delete(key);
    return null;
  }

  return record.data;
};

/**
 * Sets data into cache with expiration.
 */
const setCache = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now()
  });
};

/**
 * Clears all cache entries or entries matching a key prefix.
 */
const invalidateCache = (prefix = null) => {
  if (!prefix) {
    store.clear();
    logger.info('CACHE', 'Flushed all cache entries');
    return;
  }

  let count = 0;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      count++;
    }
  }
  logger.info('CACHE', `Flushed ${count} cache entries matching prefix [${prefix}]`);
};

/**
 * Express Middleware for transparent 30s GET response caching.
 */
const cacheMiddleware = (ttlSeconds = 30) => {
  const ttlMs = ttlSeconds * 1000;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedData = getCache(key);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store valid 2xx responses
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlMs);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache statistics telemetry getter
 */
const getCacheStats = () => {
  const now = Date.now();
  let validCount = 0;
  for (const record of store.values()) {
    if (now < record.expiresAt) validCount++;
  }

  return {
    totalKeysInStore: store.size,
    validActiveKeys: validCount,
    defaultTtlSeconds: DEFAULT_TTL_MS / 1000
  };
};

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  cacheMiddleware,
  getCacheStats
};
