import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MOCK_AUTH: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  return {
    ...result.data,
    isDev: result.data.NODE_ENV === 'development',
    isTest: result.data.NODE_ENV === 'test',
    isProd: result.data.NODE_ENV === 'production',
  };
}

export const config = loadConfig();
export type Config = ReturnType<typeof loadConfig>;
