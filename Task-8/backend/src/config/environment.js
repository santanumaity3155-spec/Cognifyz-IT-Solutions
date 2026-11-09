import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config();

/**
 * Mask credentials in URIs for safe logging and status reporting.
 * @param {string | null | undefined} uri
 * @returns {string}
 */
export const maskConnectionString = (uri) => {
  if (!uri || typeof uri !== 'string') return 'none';
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    // If not a standard URL, mask password patterns
    return uri.replace(/:([^@/]+)@/, ':****@');
  }
};

const envSchema = z.object({
  PORT: z.coerce.number().default(5002),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5175'),

  // Redis configuration
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TLS: z.coerce.boolean().default(false),
  REDIS_URL: z.string().optional(),

  // MongoDB configuration
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/forma_task8'),

  // Cache configuration
  CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().default(60),
  CACHE_NAMESPACE: z.string().default('forma:v1'),

  // Queue configuration
  QUEUE_CONCURRENCY: z.coerce.number().default(3),
  QUEUE_MAX_STALLED_COUNT: z.coerce.number().default(2),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[CONFIG FATAL] Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export default env;

