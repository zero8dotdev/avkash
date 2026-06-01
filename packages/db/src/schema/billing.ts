import { pgTable, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core'

// ── Subscription (mirrors Razorpay subscription entity) ──────────────────────
export const subscription = pgTable('Subscription', {
  id: varchar('id', { length: 255 }).primaryKey(),
  entity: varchar('entity', { length: 50 }),
  planId: varchar('planId', { length: 255 }),
  customerId: varchar('customerId', { length: 255 }),
  status: varchar('status', { length: 50 }),
  currentStart: integer('currentStart'),
  currentEnd: integer('currentEnd'),
  endedAt: integer('endedAt'),
  quantity: integer('quantity'),
  note: varchar('note', { length: 255 }),
  chargeAt: integer('chargeAt'),
  offerId: varchar('offerId', { length: 255 }),
  startAt: integer('startAt'),
  endAt: integer('endAt'),
  authAttempts: integer('authAttempts'),
  totalCount: integer('totalCount'),
  paidCount: integer('paidCount'),
  customerNotify: boolean('customerNotify'),
  createdAt: integer('createdAt'),
  expireBy: integer('expireBy'),
  shortUrl: varchar('shortUrl', { length: 255 }),
  hasScheduledChanges: boolean('hasScheduledChanges'),
  scheduleChangeAt: integer('scheduleChangeAt'),
  remainingCount: integer('remainingCount'),
})

// ── PaySubMap (Razorpay payment ↔ subscription mapping) ──────────────────────
export const paySubMap = pgTable('PaySubMap', {
  id: uuid('id').primaryKey().defaultRandom(),
  razorpayPaymentId: varchar('razorpayPaymentId', { length: 255 }),
  razorpaySignature: varchar('razorpaySignature', { length: 255 }),
  razorpaySubscriptionId: varchar('razorpaySubscriptionId', { length: 255 }),
})
