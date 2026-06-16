import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  date,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organisation } from './core';

// Rotating workweek pattern for alternating Saturdays and similar cycles.
// Each week in the cycle has its own day-set. Resolution is O(1) pure math — no DB per day.
export const workweekPattern = pgTable(
  'WorkweekPattern',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    name: varchar('name', { length: 255 }).notNull(),
    cycleLength: integer('cycleLength').notNull(), // 2 for fortnightly, 4 for monthly cycle
    // days_of_week[][] encoded as jsonb. Length must equal cycleLength.
    weeks: jsonb('weeks').$type<string[][]>().notNull(),
    referenceDate: date('referenceDate').notNull(), // any Monday; determines cycle phase
    isActive: boolean('isActive').notNull().default(true),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_workweek_pattern_org_name').on(t.orgId, t.name),
    index('idx_workweek_pattern_org').on(t.orgId),
  ]
);
