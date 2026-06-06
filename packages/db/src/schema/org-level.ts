import { pgTable, uuid, varchar, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organisation } from './core';

// Plan 29 (revised) — org-defined employment hierarchy. Each organisation creates
// its own named levels (e.g. "Grade A / B / C" or "L1–L6") instead of the
// old hardcoded WORKER/EXECUTIVE/MANAGEMENT/FIELD enum.
//
// `rank` is an integer the org assigns — lower = more junior.
// Used for range comparisons (e.g. "shift requires rank >= 3").
//
// `isFloating` replaces the hardcoded "MANAGEMENT → floating" rule.
// When true, employees at this level are treated as floating managers:
// their punch is routed to the shift supervisor of the location they're at.
export const orgLevel = pgTable(
  'OrgLevel',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }).notNull(), // short slug, e.g. "GRADE_A" — used in API filters
    description: varchar('description', { length: 500 }),
    rank: integer('rank').notNull().default(0), // org-controlled ordinal; ties broken by name
    isFloating: boolean('isFloating').notNull().default(false),
    isActive: boolean('isActive').notNull().default(true),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_org_level_code').on(t.orgId, t.code),
    uniqueIndex('uq_org_level_name').on(t.orgId, t.name),
    index('idx_org_level_org').on(t.orgId),
    index('idx_org_level_rank').on(t.orgId, t.rank),
  ]
);
