import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

const shouldUseSsl =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('sslmode=require') ||
  env.DATABASE_URL.includes('neon.tech');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
});

export const db = drizzle(pool, { schema });
export { schema };
