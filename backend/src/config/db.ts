import { pool } from '../db';

let connectionVerified = false;

export async function connectDatabase(): Promise<void> {
  if (connectionVerified) return;

  await pool.query('select 1');
  connectionVerified = true;
}
