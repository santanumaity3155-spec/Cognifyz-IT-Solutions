import { env } from '../config/environment.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'clientsecret',
  'client_secret',
  'secret',
  'jwt_secret',
  'cookie_secret',
  'authorization',
  'cookie',
  'set-cookie',
  'forma_token',
  'github_token',
  'encryption_key',
]);

const SENSITIVE_REGEXES = [
  // GitHub access tokens (ghp_, gho_, ghu_, etc.)
  /gh[pousr]_[A-Za-z0-9_]{30,}/g,
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  // Query parameters containing secret or token
  /(client_secret|access_token|code|password)=([^&]+)/gi,
];

/**
 * Deeply redact sensitive fields from strings, objects, or arrays.
 * @param {unknown} data
 * @returns {unknown} Redacted clone of data
 */
export const redactSensitiveData = (data) => {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let sanitized = data;
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
    sanitized = sanitized.replace(/gh[pousr]_[A-Za-z0-9_]{10,}/g, '[REDACTED_GITHUB_TOKEN]');
    sanitized = sanitized.replace(/(client_secret|access_token|code|password)=([^&\s]+)/gi, '$1=[REDACTED]');
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const redactedObj = {};
    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        redactedObj[key] = '[REDACTED]';
      } else {
        redactedObj[key] = redactSensitiveData(val);
      }
    }
    return redactedObj;
  }

  return data;
};

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevelThreshold = () => {
  if (process.env.NODE_ENV === 'test') return LOG_LEVELS.ERROR; // Silence noisy logs during tests
  if (process.env.NODE_ENV === 'production') return LOG_LEVELS.INFO;
  return LOG_LEVELS.DEBUG;
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const safeMessage = redactSensitiveData(message);
  const safeMeta = meta !== undefined ? redactSensitiveData(meta) : '';
  const metaStr = safeMeta ? ` | ${typeof safeMeta === 'object' ? JSON.stringify(safeMeta) : safeMeta}` : '';
  return `[${timestamp}] [${level}] ${safeMessage}${metaStr}`;
};

export const logger = {
  debug: (message, meta) => {
    if (LOG_LEVELS.DEBUG >= currentLevelThreshold()) {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  },
  info: (message, meta) => {
    if (LOG_LEVELS.INFO >= currentLevelThreshold()) {
      console.log(formatMessage('INFO', message, meta));
    }
  },
  warn: (message, meta) => {
    if (LOG_LEVELS.WARN >= currentLevelThreshold()) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  error: (message, meta) => {
    if (LOG_LEVELS.ERROR >= currentLevelThreshold()) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
};

export default logger;

