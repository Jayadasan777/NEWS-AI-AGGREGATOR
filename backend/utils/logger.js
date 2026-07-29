/**
 * Lightweight Production Logger Utility
 * Purpose: Provides structured logging with timestamps, severity levels,
 * error stack tracing, and automatic secret redaction.
 * Zero external dependencies. Fully backward compatible.
 */

// Keys to redact from logs if present in objects or error messages
const SENSITIVE_PATTERNS = [
  /mongodb(?:\+srv)?:\/\/[^\s"']+/gi,
  /gsk_[a-zA-Z0-9_-]+/g,
  /AIzaSy[a-zA-Z0-9_-]+/g
];

/**
 * Redacts secret credentials from strings to prevent log leakage.
 */
const sanitizeLogMessage = (msg) => {
  if (typeof msg !== 'string') return msg;
  let sanitized = msg;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
  }
  return sanitized;
};

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (moduleName, message, meta = null) => {
    const time = formatTimestamp();
    const cleanMsg = sanitizeLogMessage(message);
    console.log(`[${time}] [INFO] [${moduleName}] ${cleanMsg}`, meta ? meta : '');
  },

  warn: (moduleName, message, meta = null) => {
    const time = formatTimestamp();
    const cleanMsg = sanitizeLogMessage(message);
    console.warn(`[${time}] [WARN] [${moduleName}] ${cleanMsg}`, meta ? meta : '');
  },

  error: (moduleName, message, error = null) => {
    const time = formatTimestamp();
    const cleanMsg = sanitizeLogMessage(message);
    let errorDetails = '';

    if (error) {
      if (error.stack) {
        errorDetails = `\nStack Trace:\n${sanitizeLogMessage(error.stack)}`;
      } else if (error.message) {
        errorDetails = ` - ${sanitizeLogMessage(error.message)}`;
      } else {
        errorDetails = ` - ${JSON.stringify(error)}`;
      }
    }

    console.error(`[${time}] [ERROR] [${moduleName}] ${cleanMsg}${errorDetails}`);
  }
};

module.exports = logger;
