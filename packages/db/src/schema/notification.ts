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
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    channel: notificationChannelEnum('channel').notNull(),
    event: varchar('event', { length: 64 }).notNull(), // e.g. "leave.balance.credited"
    dedupeKey: varchar('dedupeKey', { length: 255 }).notNull(),
    payload: jsonb('payload'),
    subject: varchar('subject', { length: 255 }),
    body: text('body'),
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    sentAt: timestamp('sentAt', { precision: 6 }),
  },
  (t) => [
    uniqueIndex('uq_notification_dedupe').on(t.dedupeKey),
    index('idx_notification_user').on(t.userId),
    index('idx_notification_status').on(t.status),
  ]
);
