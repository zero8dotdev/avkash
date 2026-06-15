import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organisation } from './core';

// Which OrgLevels are permitted to work a given shift.
// When the table has NO rows for a shiftId → shift is open to all levels (permissive default).
// Soft FKs on shiftId and levelId to avoid circular schema imports.
export const shiftLevelRestriction = pgTable(
  'ShiftLevelRestriction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    shiftId: uuid('shiftId').notNull(), // soft FK → Shift
    levelId: uuid('levelId').notNull(), // soft FK → OrgLevel
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_shift_level').on(t.shiftId, t.levelId),
    index('idx_shift_level_shift').on(t.shiftId),
    index('idx_shift_level_org').on(t.orgId),
  ]
);
