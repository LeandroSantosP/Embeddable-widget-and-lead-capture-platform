require('dotenv').config();

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  SUBMISSION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  SUBMISSION_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  GEO_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(2500)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

module.exports = parsedEnv.data;