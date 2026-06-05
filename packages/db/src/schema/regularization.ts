import { pgTable, uuid, varchar, date, timestamp, index } from 'drizzle-orm/pg-core';
import { organisation, user } from './core';
import { regularizationStatusEnum } from './enums';

// A request to fix a day's attendance — forgot to punch in/out, device missed it.
// On approval the proposed in/out are written as REGULARIZATION-source punches, which
// the resolver then picks up (computed-on-read). Approval is the manager's call,
// mirroring the leave approval flow.
export const attendanceRegularization = pgTable(
  'AttendanceRegularization',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id), // whose attendance is being fixed
    teamId: uuid('teamId'), // denormalized at request time, for approval routing
    date: date('date').notNull(), // the day being corrected
    requestedIn: timestamp('requestedIn', { precision: 6 }), // proposed IN (null = no change)
    requestedOut: timestamp('requestedOut', { precision: 6 }), // proposed OUT
    reason: varchar('reason', { length: 500 }).notNull(),
    status: regularizationStatusEnum('status').notNull().default('PENDING'),
    decisionNote: varchar('decisionNote', { length: 500 }),
    decidedBy: uuid('decidedBy'),
    decidedAt: timestamp('decidedAt', { precision: 6 }),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_reg_user').on(t.userId), index('idx_reg_status').on(t.status)]
);
