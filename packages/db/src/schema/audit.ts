import { pgTable, serial, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { organisation, team, user } from './core'

// ── ActivityLog (audit trail, written by DB triggers in v1) ──────────────────
export const activityLog = pgTable('ActivityLog', {
  id: serial('id').primaryKey(),
  orgId: uuid('orgId').references(() => organisation.orgId),
  changedColumns: jsonb('changedColumns'),
  changedOn: timestamp('changedOn', { precision: 6 }).defaultNow(),
  changedBy: varchar('changedBy', { length: 255 }),
  tableName: varchar('tableName'),
  teamId: uuid('teamId').references(() => team.teamId),
  userId: uuid('userId').references(() => user.id),
  keyword: varchar('keyword'),
  createdBy: varchar('createdBy', { length: 255 }),
  createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
  updatedBy: varchar('updatedBy', { length: 255 }),
  updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
})
