/**
 * Admin Authentication Middleware
 * Protects sensitive operational routes (broadcast, scrape, toggle-auto)
 * from unauthorized public access.
 *
 * Expects the secret key in the request header:
 *   x-admin-key: <ADMIN_SECRET_KEY from .env>
 *
 * All other requests are rejected with 403 Forbidden.
 */

const logger = require('../utils/logger');

const adminAuth = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'];
  const secretKey = process.env.ADMIN_SECRET_KEY;

  // Fail-safe: if no secret key is configured in env, block all access
  if (!secretKey) {
    logger.warn('ADMIN_AUTH', 'ADMIN_SECRET_KEY is not set in .env — blocking all admin route access.');
    return res.status(503).json({
      success: false,
      message: '🔒 Admin routes are currently disabled. ADMIN_SECRET_KEY not configured on server.'
    });
  }

  // Reject if no key was provided in the request
  if (!providedKey) {
    logger.warn('ADMIN_AUTH', `Unauthorized access attempt to [${req.method} ${req.originalUrl}] — no key provided.`);
    return res.status(403).json({
      success: false,
      message: '🔒 Admin access required. This action is restricted to the platform administrator.'
    });
  }

  // Reject if the key doesn't match
  if (providedKey !== secretKey) {
    logger.warn('ADMIN_AUTH', `Invalid admin key attempt on [${req.method} ${req.originalUrl}]`);
    return res.status(403).json({
      success: false,
      message: '🔒 Invalid admin key. Access denied.'
    });
  }

  // Key is valid — allow the request through
  next();
};

module.exports = adminAuth;
