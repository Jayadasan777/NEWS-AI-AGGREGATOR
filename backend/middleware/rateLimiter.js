/**
 * Production Rate Limiter & Security Header Middleware
 * Purpose: Provides zero-dependency in-memory sliding-window rate limiting
 * and HTTP security header hardening. Fully backward compatible.
 */

const logger = require('../utils/logger');

// Sliding window in-memory hit stores
const generalHitsStore = new Map();
const triggerHitsStore = new Map();

// Periodic cleanup of expired store keys (every 5 minutes)
setInterval(() => {
  const now = Date.now();

  for (const [ip, record] of generalHitsStore.entries()) {
    if (now - record.resetTime > 0) {
      generalHitsStore.delete(ip);
    }
  }

  for (const [ip, record] of triggerHitsStore.entries()) {
    if (now - record.resetTime > 0) {
      triggerHitsStore.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Creates a sliding-window rate limiter middleware.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxHits - Max requests allowed per window
 * @param {Map} options.store - Target hits store map
 * @param {string} options.routeName - Label for logging
 */
const createRateLimiter = ({ windowMs, maxHits, store, routeName }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = store.get(ip);

    if (!record || now >= record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      store.set(ip, record);
    } else {
      record.count += 1;
    }

    // Set standard RateLimit HTTP headers
    res.setHeader('X-RateLimit-Limit', maxHits);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxHits - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxHits) {
      logger.warn('RATE_LIMITER', `Rate limit exceeded on [${routeName}] by IP [${ip}]`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * General route rate limiter: 100 requests per 15 minutes per IP
 */
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxHits: 100,
  store: generalHitsStore,
  routeName: 'General Routes'
});

/**
 * Operational trigger rate limiter: 5 requests per 1 minute per IP
 */
const triggerRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxHits: 5,
  store: triggerHitsStore,
  routeName: 'Trigger Operations'
});

/**
 * Lightweight HTTP Security Headers Middleware
 * Appends standard security headers without modifying CORS behavior.
 */
const securityHeadersMiddleware = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  generalRateLimiter,
  triggerRateLimiter,
  securityHeadersMiddleware
};
