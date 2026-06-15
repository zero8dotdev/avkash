import { pgTable, uuid, varchar, jsonb, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Event outbox (transactional outbox) ──────────────────────────────────────
// Every call to publish() inserts a row here IN the caller's transaction, so the
// event is guaranteed to exist if and only if the domain mutation committed.
// A relay in apps/worker drains unpublished rows and fans out to in-process
// subscribers. Delivery is at-least-once — subscribers MUST be idempotent,
// keyed on event_outbox.id.
export const eventOutbox = pgTable(
  'EventOutbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId').notNull(),
    /** '<entity>.<sub-entity>.<verb>' — e.g. 'leave.request.approved' */
    name: varchar('name', { length: 128 }).notNull(),
    /** Zod-validated payload for this event definition. */
    payload: jsonb('payload').notNull(),
    /** From AuthContext.userId; null for system/cron actors. */
    actorId: uuid('actorId'),
    /** 'user' | 'service' | 'system' — mirrors AuthContext.actorType. */
    actorType: varchar('actorType', { length: 16 }).notNull(),
    /** Correlation id from the originating HTTP request; null for background work. */
    requestId: varchar('requestId', { length: 64 }),
    /** When the domain event happened (set by the caller, never by the relay). */
    occurredAt: timestamp('occurredAt', { precision: 6 }).notNull(),
    /** Set by the relay after all subscribers received the event. null = not yet relayed. */
    publishedAt: timestamp('publishedAt', { precision: 6 }),
    /** How many times the relay has attempted delivery (incremented on each pass). */
    attempts: integer('attempts').notNull().default(0),
    /** The last error message from a failed relay attempt; cleared on success. */
    lastError: text('lastError'),
  },
  (t) => [
    // The relay's main scan: unpublished rows only, oldest-first for fair ordering.
    index('idx_event_outbox_unpublished')
      .on(t.occurredAt)
      .where(sql`${t.publishedAt} is null`),
    // Cross-org queries: subscription filtering, module-scoped event streams.
    index('idx_event_outbox_org_name_occurred').on(t.orgId, t.name, t.occurredAt),
  ]
);
