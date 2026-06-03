import { pgTable, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { user, organisation } from './core';
import { attendancePunchTypeEnum, attendanceSourceEnum } from './enums';

// Raw punch events. The daily attendance record is *derived* from these (combined
// with workweek + holidays + leave) — see @avkash/attendance. Keeping punches as an
// event log keeps us ready for multiple punches/day and device ingest later.
export const attendancePunch = pgTable(
  'AttendancePunch',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    ts: timestamp('ts', { precision: 6 }).notNull(), // the punch moment (client/device supplied)
    type: attendancePunchTypeEnum('type').notNull(),
    source: attendanceSourceEnum('source').notNull().default('WEB'),
    wfh: boolean('wfh').notNull().default(false),
    location: varchar('location', { length: 255 }),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_punch_user_ts').on(t.userId, t.ts), index('idx_punch_org').on(t.orgId)]
);
