import { and, eq } from 'drizzle-orm';
import { db } from './client';
import { idempotencyKey } from './schema';

export interface IdempotencyRecord {
  id: string;
  fingerprint: string;
  status: string;
  responseStatus: number | null;
  responseBody: string | null;
}

// Atomically claim a key: insert, relying on the unique (userId, key) index. Returns
// the new row id if we claimed it, or null if the key already exists (a retry/race).
export async function claimIdempotencyKey(userId: string, key: string, fingerprint: string): Promise<string | null> {
  const [row] = await db
    .insert(idempotencyKey)
    .values({ userId, key, fingerprint, status: 'processing' })
    .onConflictDoNothing({ target: [idempotencyKey.userId, idempotencyKey.key] })
    .returning({ id: idempotencyKey.id });
  return row?.id ?? null;
}

export async function loadIdempotencyKey(userId: string, key: string): Promise<IdempotencyRecord | null> {
  const [row] = await db
    .select({
      id: idempotencyKey.id,
      fingerprint: idempotencyKey.fingerprint,
      status: idempotencyKey.status,
      responseStatus: idempotencyKey.responseStatus,
      responseBody: idempotencyKey.responseBody,
    })
    .from(idempotencyKey)
    .where(and(eq(idempotencyKey.userId, userId), eq(idempotencyKey.key, key)))
    .limit(1);
  return row ?? null;
}

export async function completeIdempotencyKey(id: string, responseStatus: number, responseBody: string): Promise<void> {
  await db
    .update(idempotencyKey)
    .set({ status: 'completed', responseStatus, responseBody })
    .where(eq(idempotencyKey.id, id));
}

export async function releaseIdempotencyKey(id: string): Promise<void> {
  await db.delete(idempotencyKey).where(eq(idempotencyKey.id, id));
}
