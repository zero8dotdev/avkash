import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
export type DB = typeof db;

// Readiness probe: a cheap round-trip confirming the DB is reachable. Bounded by a
// timeout so an unreachable/frozen DB fails fast (rejects) instead of hanging the
// request — a probe that blocks is useless to an orchestrator.
export async function ping(timeoutMs = 2000): Promise<void> {
  await Promise.race([
    db.execute(sql`select 1`),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('db ping timeout')), timeoutMs).unref?.();
    }),
  ]);
}
