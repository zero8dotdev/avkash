import { pgTable, uuid, varchar, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './core';

// One row per (user, idempotency-key). The unique index IS the lock: the first
// request to insert a key claims it; concurrent/retried requests collide on it.
// fingerprint = sha256(method+path+body) catches a key reused for a different call.
// A completed row caches the response so a retry replays it instead of re-running.
export const idempotencyKey = pgTable(
  'IdempotencyKey',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    key: varchar('key', { length: 255 }).notNull(),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    status: varchar('status', { length: 16 }).notNull(), // 'processing' | 'completed'
    responseStatus: integer('responseStatus'),
    responseBody: text('responseBody'),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_idempotency_user_key').on(t.userId, t.key)]
);
