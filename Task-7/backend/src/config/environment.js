import 'dotenv/config';
import { z } from 'zod';

/**
 * Mask credentials in connection strings for safe diagnostics and logging.
 * Replaces :password@ with :****@
 */
export const maskConnectionString = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/:([^:@]{1,})@/, ':****@');
};

/**
 * Mask sensitive tokens or secrets, exposing only the last few characters.
 */
export const maskSecret = (secret, visibleCount = 4) => {
  if (!secret || typeof secret !== 'string' || secret.trim() === '') return '[NOT_CONFIGURED]';
  if (secret.length <= 6) return '****';
  return '****' + secret.slice(-visibleCount);
};

/**
 * Zod validation schema for Task 7 environment variables.
 */
const environmentSchema = z.object({
  PORT: z
    .preprocess((val) => (val ? parseInt(String(val), 10) : 5001), z.number().int().min(1024).max(65535))
    .default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5174'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/forma_task7'),
  JWT_SECRET: z.string().min(16).default('forma_task7_jwt_secret_dev_environment_32chars_min!'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  COOKIE_SECRET: z.string().min(16).default('forma_task7_cookie_secret_dev_32chars_min!'),
  GITHUB_TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(32)
    .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  GITHUB_CALLBACK_URL: z.string().url().default('http://localhost:5001/api/github/callback'),
});

/**
 * Validate and produce an immutable environment configuration.
 * @param {Record<string, string | undefined>} [sourceEnv=process.env]
 */
export const validateEnvironment = (sourceEnv = process.env) => {
  const rawConfig = {
    PORT: sourceEnv.PORT,
    NODE_ENV: sourceEnv.NODE_ENV,
    CLIENT_URL: sourceEnv.CLIENT_URL,
    MONGODB_URI: sourceEnv.MONGODB_URI,
    JWT_SECRET: sourceEnv.JWT_SECRET,
    JWT_EXPIRES_IN: sourceEnv.JWT_EXPIRES_IN,
    COOKIE_SECRET: sourceEnv.COOKIE_SECRET,
    GITHUB_TOKEN_ENCRYPTION_KEY:
      sourceEnv.GITHUB_TOKEN_ENCRYPTION_KEY ||
      sourceEnv.TOKEN_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    GITHUB_CLIENT_ID: sourceEnv.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: sourceEnv.GITHUB_CLIENT_SECRET || '',
    GITHUB_CALLBACK_URL: sourceEnv.GITHUB_CALLBACK_URL,
  };

  const parsed = environmentSchema.safeParse(rawConfig);

  if (!parsed.success) {
    console.error('\n[FATAL] Task-7 Environment Validation Failed:');
    parsed.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    if (sourceEnv.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production mode.');
    }
  }

  const validData = parsed.success ? parsed.data : environmentSchema.parse({});

  // Additional production checks
  if (validData.NODE_ENV === 'production') {
    if (!sourceEnv.JWT_SECRET || sourceEnv.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }
    if (!sourceEnv.COOKIE_SECRET || sourceEnv.COOKIE_SECRET.length < 32) {
      throw new Error('COOKIE_SECRET must be at least 32 characters in production.');
    }
  }

  // Detect whether GitHub OAuth is genuinely configured
  const clientId = validData.GITHUB_CLIENT_ID.trim();
  const clientSecret = validData.GITHUB_CLIENT_SECRET.trim();
  const isPlaceholderId = clientId === '' || clientId.includes('your_github') || clientId.includes('placeholder');
  const isPlaceholderSecret =
    clientSecret === '' || clientSecret.includes('your_github') || clientSecret.includes('placeholder');

  const isOAuthConfigured = !isPlaceholderId && !isPlaceholderSecret;

  const config = {
    ...validData,
    isOAuthConfigured,
    maskedClientId: isOAuthConfigured ? maskSecret(clientId, 4) : '[NOT_CONFIGURED]',
    maskedClientSecret: isOAuthConfigured ? '****' : '[NOT_CONFIGURED]',
  };

  return config;
};

let testOverrides = null;

export const setEnvOverridesForTesting = (overrides) => {
  testOverrides = overrides;
};

export const resetEnvOverridesForTesting = () => {
  testOverrides = null;
};

const baseEnv = validateEnvironment();

export const env = new Proxy(baseEnv, {
  get(target, prop) {
    if (testOverrides && prop in testOverrides) {
      return testOverrides[prop];
    }
    return target[prop];
  },
});

export default env;
