import { pgTable, uuid, varchar, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { user, organisation, location } from './core';
import { department } from './department';
import { device } from './device';
import { shift } from './shift';
import { attendancePunchTypeEnum, attendanceSourceEnum, punchConfirmationEnum } from './enums';

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
    location: varchar('location', { length: 255 }), // legacy string label
    locationId: uuid('locationId').references(() => location.id), // where it happened (→ timezone)
    deviceId: uuid('deviceId').references(() => device.id), // machine that produced it (null = self/web)
    flagged: boolean('flagged').notNull().default(false), // e.g. punched outside the allowed window
    flagReason: varchar('flagReason', { length: 255 }),
    receivedAt: timestamp('receivedAt', { precision: 6 }), // server arrival (offline batches arrive late)
    // Plan 40: null = no confirmation required; PENDING_CONFIRMATION = awaiting manager approval.
    confirmationStatus: punchConfirmationEnum('confirmationStatus'),
    confirmedBy: uuid('confirmedBy'), // soft FK → User
    confirmedAt: timestamp('confirmedAt', { precision: 6 }),
    // Plan 46: structured remote context (factory visit / client site / WFH / field).
    // Setting this also forces wfh = true. Absent + wfh=true is legacy "WFH" (no detail).
    remoteContext: jsonb('remoteContext').$type<{
      type: 'WFH' | 'FACTORY_VISIT' | 'CLIENT_SITE' | 'FIELD';
      locationId?: string;
      clientName?: string;
      city?: string;
      country?: string;
    }>(),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_punch_user_ts').on(t.userId, t.ts),
    index('idx_punch_org').on(t.orgId),
    // Device-batch idempotency: an exact retry of the same machine punch is a no-op.
    // Self/web punches have deviceId=null → not constrained (NULLs are distinct).
    uniqueIndex('uq_punch_device_user_ts').on(t.deviceId, t.userId, t.ts),
  ]
);

// Plan 44: scoped authority — a supervisor has operational control over a specific
// shift × location (× department) without being a team manager or org admin.
export const shiftSupervisor = pgTable(
  'ShiftSupervisor',
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
    locationId: uuid('locationId')
      .notNull()
      .references(() => location.id),
    departmentId: uuid('departmentId').references(() => department.id), // null = all departments
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_shift_supervisor').on(t.orgId, t.userId, t.shiftId, t.locationId),
    index('idx_shift_supervisor_org').on(t.orgId),
    index('idx_shift_supervisor_user').on(t.userId),
  ]
);

// Plan 31 (revised): per-level source policy keyed by OrgLevel.id instead of enum.
// If no row for a levelId → all sources allowed (permissive default).
export const attendanceSourcePolicy = pgTable(
  'AttendanceSourcePolicy',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    levelId: uuid('levelId').notNull(), // soft FK → OrgLevel
    allowedSources: attendanceSourceEnum('allowedSources').array().notNull(),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_source_policy_org_level').on(t.orgId, t.levelId),
    index('idx_source_policy_org').on(t.orgId),
  ]
);
