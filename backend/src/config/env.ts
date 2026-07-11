import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1d'),
  ENCRYPTION_KEY: z.string().min(32),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000')
});

export const env = envSchema.parse(process.env);
