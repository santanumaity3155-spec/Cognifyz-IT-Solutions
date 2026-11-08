import 'dotenv/config';

/**
 * Utility to mask credentials in connection strings for safe logging
 * Replaces :password@ with :****@
 */
export const maskConnectionString = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/:([^:@]{1,})@/, ':****@');
};

/**
 * Validate and export normalized environment configuration
 */
const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  const config = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/forma_task6',
    JWT_SECRET: process.env.JWT_SECRET || 'forma_task6_jwt_secret_dev_only_change_in_production_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    NODE_ENV: process.env.NODE_ENV || 'development',
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'forma_cookie_secret_dev_2026',
  };

  // Critical security checks in production
  if (isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be defined and at least 32 characters long in production');
    }
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is strictly required in production');
    }
    if (!process.env.COOKIE_SECRET) {
      errors.push('COOKIE_SECRET is strictly required in production');
    }
  }

  if (errors.length > 0) {
    console.error('\n[FATAL] Environment Configuration Errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('[FATAL] Aborting server startup due to insecure or invalid environment configuration.\n');
    if (isProduction) {
      process.exit(1);
    }
  }

  return Object.freeze(config);
};

export const env = validateEnvironment();
export default env;

