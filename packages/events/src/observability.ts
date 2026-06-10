import { count, isNull, min } from 'drizzle-orm';
import { db, schema } from '@avkash/db';

// ── Lag observability ─────────────────────────────────────────────────────────
// Two lightweight metrics to surface relay health. Both query only the
// partial-index-eligible rows (publishedAt IS NULL), so they stay fast even
// when the table is large.

/**
 * Number of outbox rows that have not yet been relayed (publishedAt IS NULL).
 * A sustained non-zero value with a rising trend indicates a stuck relay.
 */
export async function outboxDepth(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(schema.eventOutbox)
    .where(isNull(schema.eventOutbox.publishedAt));
  return Number(row?.n ?? 0);
}

/**
 * Age in milliseconds of the oldest unrelayed outbox row. Returns 0 if there
 * are no pending rows. A large value (e.g. > 60 s) means the relay is lagging
 * or stopped; alert on this crossing your SLA threshold.
 */
export async function oldestUnpublishedAgeMs(): Promise<number> {
  const [row] = await db
    .select({ oldest: min(schema.eventOutbox.occurredAt) })
    .from(schema.eventOutbox)
    .where(isNull(schema.eventOutbox.publishedAt));
  if (!row?.oldest) return 0;
  return Date.now() - new Date(row.oldest).getTime();
}
