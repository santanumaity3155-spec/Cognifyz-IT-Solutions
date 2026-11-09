/**
 * High-precision structured logger with automatic sensitive field masking.
 * Formats logs with ISO timestamps, log level, and structured metadata.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'accesstoken',
  'refreshtoken',
  'session',
  'jwt',
]);

/**
 * Recursively redacts sensitive keys from objects before serialization/logging.
 * @param {any} value
 * @param {number} depth
 * @returns {any}
 */
export const sanitizeData = (value, depth = 0) => {
  if (depth > 6 || value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // Redact JWT or Bearer pattern strings if found directly
    if (/^Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/i.test(value)) {
      return '[REDACTED_BEARER_TOKEN]';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(val, depth + 1);
      }
    }
    return sanitized;
  }

  return value;
};

const formatMessage = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(sanitizeData(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};

export default logger;

