import { Pool } from 'pg';

export function createPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5_000,
    application_name: 'navard-envelope',
    allowExitOnIdle: true,
  });
  // An idle connection failure must not crash the host or expose driver details.
  pool.on('error', () => undefined);
  return pool;
}
