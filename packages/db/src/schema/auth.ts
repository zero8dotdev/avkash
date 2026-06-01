import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './core'

// Better Auth managed tables. Owned (schema) by @avkash/db for one migration
// history; populated/read by Better Auth via the Drizzle adapter in @avkash/auth.
// IDs are uuid + gen_random_uuid() so they line up with the domain's uuid FKs
// (Better Auth is told `generateId: false` to let Postgres own them).

// ── Session (cookie sessions; one row per active login) ──────────────────────
export const session = pgTable('Session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt', { precision: 6 }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
})

// ── Account (identity links — slack, google, email/credential) ───────────────
// This is the linking model: one human (user) → many Account rows. A Slack
// resolver finds the user via (providerId='slack', accountId=<slack user id>).
export const account = pgTable('Account', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { precision: 6 }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { precision: 6 }),
  scope: text('scope'),
  idToken: text('idToken'),
  password: text('password'),
  createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
})

// ── Verification (magic-link / email-verification tokens) ────────────────────
export const verification = pgTable('Verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { precision: 6 }).notNull(),
  createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
})
