import { pgTable, uuid, varchar, text, jsonb, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { user, organisation } from './core';
import { notificationChannelEnum, notificationStatusEnum } from './enums';

// The notification outbox. One row per (recipient, channel, event-instance). The
// unique dedupeKey makes delivery idempotent — a retried cron tick that re-emits
// "balance.credited" finds the row already present and never double-sends. Doubles
// as the audit trail and the data behind a notifications dashboard.
export const notification = pgTable(
  'Notification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    // Nullable: some notifications target an email with no account yet (invitations).
    // The `to` column is always the real destination.
    userId: uuid('userId').references(() => user.id),
    channel: notificationChannelEnum('channel').notNull(),
    event: varchar('event', { length: 64 }).notNull(), // e.g. "leave.balance.credited"
    dedupeKey: varchar('dedupeKey', { length: 255 }).notNull(),
    to: varchar('to', { length: 255 }).notNull(), // resolved destination — keeps the row self-contained for retry
    payload: jsonb('payload'),
    subject: varchar('subject', { length: 255 }),
    body: text('body'),
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('nextAttemptAt', { precision: 6 }), // when the retry sweep may try again (backoff)
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    sentAt: timestamp('sentAt', { precision: 6 }),
  },
  (t) => [
    uniqueIndex('uq_notification_dedupe').on(t.dedupeKey),
    index('idx_notification_user').on(t.userId),
    // The retry sweep scans by (status, nextAttemptAt) — index it.
    index('idx_notification_retry').on(t.status, t.nextAttemptAt),
  ]
);
