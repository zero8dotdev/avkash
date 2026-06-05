import { pgTable, uuid, varchar, time, integer, numeric, boolean, date, timestamp, index } from 'drizzle-orm/pg-core';
import { organisation, user } from './core';

// A shift definition (plan 23). Times are local to the assignee's location timezone.
// crossesMidnight marks a night shift (e.g. 22:00–06:00) so the resolver attributes
// and grades punches across the midnight boundary.
export const shift = pgTable(
  'Shift',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    name: varchar('name', { length: 255 }).notNull(),
    startTime: time('startTime').notNull(),
    endTime: time('endTime').notNull(),
    crossesMidnight: boolean('crossesMidnight').notNull().default(false),
    breakMinutes: integer('breakMinutes').notNull().default(0),
    graceMinutes: integer('graceMinutes').notNull().default(0),
    fullDayHours: numeric('fullDayHours', { precision: 4, scale: 2 }).notNull().default('8'),
    halfDayHours: numeric('halfDayHours', { precision: 4, scale: 2 }).notNull().default('4'),
    isFlexible: boolean('isFlexible').notNull().default(false), // no fixed start → no LATE/EARLY marks
    minStaff: integer('minStaff').notNull().default(1), // coverage target — gaps flag below this
    version: integer('version').notNull().default(0), // optimistic concurrency
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_shift_org').on(t.orgId)]
);

// The roster: which shift a user is on, effective-dated. shiftForDate picks the row
// covering a date (latest fromDate wins); falls back to team.defaultShiftId.
export const shiftAssignment = pgTable(
  'ShiftAssignment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    shiftId: uuid('shiftId')
      .notNull()
      .references(() => shift.id),
    fromDate: date('fromDate').notNull(),
    toDate: date('toDate'), // null = open-ended
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_shiftassign_user_from').on(t.userId, t.fromDate)]
);
