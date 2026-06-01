import {
  pgTable,
  pgView,
  uuid,
  varchar,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organisation, team, user } from './core'
import { leaveDurationEnum, shiftEnum, leaveStatusEnum, accrualFrequencyEnum, accrueOnEnum } from './enums'

// ── LeaveType ───────────────────────────────────────────────────────────────
export const leaveType = pgTable(
  'LeaveType',
  {
    leaveTypeId: uuid('leaveTypeId').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 6 }),
    isActive: boolean('isActive').notNull().default(true),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    setSlackStatus: boolean('setSlackStatus').notNull().default(true),
    emoji: varchar('emoji'),
    statusMsg: varchar('statusMsg', { length: 255 }),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [index('idx_leavetype_org_id').on(t.orgId), index('idx_leavetype_active').on(t.isActive)],
)

// ── Leave (the leave request) ────────────────────────────────────────────────
export const leave = pgTable(
  'Leave',
  {
    leaveId: uuid('leaveId').primaryKey().defaultRandom(),
    leaveTypeId: uuid('leaveTypeId')
      .notNull()
      .references(() => leaveType.leaveTypeId, { onDelete: 'cascade' }),
    startDate: date('startDate').notNull(),
    endDate: date('endDate').notNull(),
    duration: leaveDurationEnum('duration').notNull().default('FULL_DAY'),
    shift: shiftEnum('shift').notNull().default('NONE'),
    isApproved: leaveStatusEnum('isApproved').notNull().default('PENDING'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    teamId: uuid('teamId')
      .notNull()
      .references(() => team.teamId),
    reason: varchar('reason', { length: 255 }),
    managerComment: varchar('managerComment', { length: 255 }),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    workingDays: numeric('workingDays', { precision: 5, scale: 2 }).notNull(),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [
    index('idx_leave_user_id').on(t.userId),
    index('idx_leave_team_id').on(t.teamId),
    index('idx_leave_org_id').on(t.orgId),
    index('idx_leave_user_start_date').on(t.userId, t.startDate),
    index('idx_leave_start_date').on(t.startDate),
    index('idx_leave_end_date').on(t.endDate),
    index('idx_leave_status').on(t.isApproved),
  ],
)

// ── LeavePolicy ──────────────────────────────────────────────────────────────
export const leavePolicy = pgTable(
  'LeavePolicy',
  {
    leavePolicyId: uuid('leavePolicyId').primaryKey().defaultRandom(),
    leaveTypeId: uuid('leaveTypeId')
      .notNull()
      .references(() => leaveType.leaveTypeId),
    unlimited: boolean('unlimited').notNull().default(false),
    maxLeaves: integer('maxLeaves'),
    accruals: boolean('accruals').notNull().default(false),
    accrualFrequency: accrualFrequencyEnum('accrualFrequency'),
    accrueOn: accrueOnEnum('accrueOn'),
    rollOver: boolean('rollOver').notNull().default(false),
    rollOverLimit: integer('rollOverLimit'),
    teamId: uuid('teamId')
      .notNull()
      .references(() => team.teamId),
    rollOverExpiry: varchar('rollOverExpiry', { length: 5 }),
    autoApprove: boolean('autoApprove').notNull().default(false),
    isActive: boolean('isActive').notNull().default(true),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [
    // mirrors DB CHECK: rollOverExpiry must look like MM/DD ("^\d{2}/\d{2}$").
    // Note: `\\d` in source cooks to `\d` in the tagged sql`` template.
    check('leavepolicy_rollover_expiry_format', sql`${t.rollOverExpiry} ~ '^\\d{2}/\\d{2}$'`),
    index('idx_leavepolicy_type_team').on(t.leaveTypeId, t.teamId),
    index('idx_leavepolicy_active').on(t.isActive),
  ],
)

// ── leave_summary (aggregate view) ───────────────────────────────────────────
export const leaveSummary = pgView('leave_summary', {
  userId: uuid('userId'),
  leaveTypeId: uuid('leaveTypeId'),
  taken: numeric('taken'),
  planned: numeric('planned'),
  totalDays: numeric('total_days'),
}).as(
  sql`SELECT "userId", "leaveTypeId",
        SUM(CASE WHEN "isApproved" = 'APPROVED' THEN "workingDays" ELSE 0 END) AS taken,
        SUM(CASE WHEN "isApproved" = 'PENDING' THEN "workingDays" ELSE 0 END) AS planned,
        SUM("workingDays") AS total_days
      FROM "Leave"
      GROUP BY "userId", "leaveTypeId"`,
)
