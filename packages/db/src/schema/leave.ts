import {
  pgTable,
  pgView,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  numeric,
  date,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organisation, team, user } from './core';
import {
  leaveDurationEnum,
  shiftEnum,
  leaveStatusEnum,
  accrualFrequencyEnum,
  accrueOnEnum,
  leaveTypeKindEnum,
  ledgerKindEnum,
  compOffStatusEnum,
  encashmentStatusEnum,
  commentVisibilityEnum,
} from './enums';

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
    kind: leaveTypeKindEnum('kind').notNull().default('LEAVE'),
    isPaid: boolean('isPaid').notNull().default(true),
    alwaysEscalate: boolean('alwaysEscalate').notNull().default(false), // this type always routes to HR (e.g. unpaid/sabbatical)
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [index('idx_leavetype_org_id').on(t.orgId), index('idx_leavetype_active').on(t.isActive)]
);

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
    // (decision notes folded into LeaveComment — single source of truth)
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    workingDays: numeric('workingDays', { precision: 5, scale: 2 }).notNull(),
    escalatedAt: timestamp('escalatedAt', { precision: 6 }), // when escalated to HR (null = not escalated)
    escalatedTo: uuid('escalatedTo'), // the HR user it was escalated to
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
  ]
);

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
    allowNegativeBalance: boolean('allowNegativeBalance').notNull().default(false),
    encashable: boolean('encashable').notNull().default(false),
    encashmentMaxDays: integer('encashmentMaxDays'),
    compOffExpiryDays: integer('compOffExpiryDays').default(90),
    prorateOnJoin: boolean('prorateOnJoin').notNull().default(true), // mid-year joiners get a partial-year entitlement
    version: integer('version').notNull().default(0), // optimistic-concurrency token (ETag / If-Match)
    escalateOverDays: integer('escalateOverDays'), // leaves longer than N working days escalate on apply (null = off)
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
  ]
);

// ── LeaveLedger (authoritative balance source — signed entries) ──────────────
// balance = Σ amount WHERE effectiveOn ≤ today AND (expiresOn IS NULL OR ≥ today).
// See plans/14 for the entry-kind semantics.
export const leaveLedger = pgTable(
  'LeaveLedger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    leaveTypeId: uuid('leaveTypeId')
      .notNull()
      .references(() => leaveType.leaveTypeId),
    kind: ledgerKindEnum('kind').notNull(),
    amount: numeric('amount', { precision: 6, scale: 2 }).notNull(),
    effectiveOn: date('effectiveOn').notNull(),
    expiresOn: date('expiresOn'),
    leaveId: uuid('leaveId').references(() => leave.leaveId),
    periodKey: text('periodKey'), // job idempotency, e.g. "accrual:2026-06"
    note: varchar('note', { length: 255 }),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_leaveledger_user_type').on(t.userId, t.leaveTypeId),
    index('idx_leaveledger_org').on(t.orgId),
    // Idempotency for scheduled jobs: one ACCRUAL/ROLLOVER per (user, type, periodKey).
    // periodKey is NULL for TAKEN/ADJUSTMENT entries — Postgres treats NULLs as
    // distinct, so those are never blocked.
    uniqueIndex('uq_leaveledger_period').on(t.userId, t.leaveTypeId, t.periodKey),
  ]
);

// ── CompOff (compensatory off earned by working a holiday/weekend) ───────────
// On approval, a COMP_OFF_CREDIT ledger entry is posted (with expiry); redemption
// is just applying a leave of a COMP_OFF-kind type, which debits that balance.
export const compOff = pgTable(
  'CompOff',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    leaveTypeId: uuid('leaveTypeId')
      .notNull()
      .references(() => leaveType.leaveTypeId),
    workedOn: date('workedOn').notNull(),
    days: numeric('days', { precision: 5, scale: 2 }).notNull().default('1'),
    status: compOffStatusEnum('status').notNull().default('PENDING'),
    expiresOn: date('expiresOn'),
    approvedBy: uuid('approvedBy').references(() => user.id),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_compoff_user').on(t.userId), index('idx_compoff_org').on(t.orgId)]
);

// ── Encashment (convert unused leave to cash; payout handled by payroll) ─────
export const encashment = pgTable(
  'Encashment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    leaveTypeId: uuid('leaveTypeId')
      .notNull()
      .references(() => leaveType.leaveTypeId),
    days: numeric('days', { precision: 6, scale: 2 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }),
    status: encashmentStatusEnum('status').notNull().default('PENDING'),
    requestedBy: uuid('requestedBy').references(() => user.id),
    approvedBy: uuid('approvedBy').references(() => user.id),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_encashment_user').on(t.userId), index('idx_encashment_org').on(t.orgId)]
);

// ── ApprovalDelegation (a manager delegates their approvals for a period) ────
export const approvalDelegation = pgTable(
  'ApprovalDelegation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    fromManagerId: uuid('fromManagerId')
      .notNull()
      .references(() => user.id),
    toUserId: uuid('toUserId')
      .notNull()
      .references(() => user.id),
    teamId: uuid('teamId').references(() => team.teamId), // null = all teams the delegator manages
    startsOn: date('startsOn').notNull(),
    endsOn: date('endsOn').notNull(),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_delegation_org').on(t.orgId), index('idx_delegation_to').on(t.toUserId)]
);

// ── LeaveComment (thread on a leave; the manager↔HR conversation lives here) ──
export const leaveComment = pgTable(
  'LeaveComment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    leaveId: uuid('leaveId')
      .notNull()
      .references(() => leave.leaveId, { onDelete: 'cascade' }),
    authorId: uuid('authorId')
      .notNull()
      .references(() => user.id),
    body: text('body').notNull(),
    visibility: commentVisibilityEnum('visibility').notNull().default('SHARED'),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_leavecomment_leave').on(t.leaveId)]
);

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
      GROUP BY "userId", "leaveTypeId"`
);
