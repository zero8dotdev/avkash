import { pgEnum } from 'drizzle-orm/pg-core';

// PG enum type names are snake_case. (The legacy DB used PascalCase like
// "DaysOfWeek", but that breaks drizzle-kit `push` for enum *arrays* — the diff
// emits an unquoted `daysofweek[]` that Postgres case-folds and can't match.
// Fresh DB, no data migration, so we modernize the type names; enum VALUES and
// the TS variable names are unchanged.)
export const visibilityEnum = pgEnum('visibility', ['ORG', 'TEAM', 'SELF']);

export const daysOfWeekEnum = pgEnum('days_of_week', [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);

export const accrualFrequencyEnum = pgEnum('accrual_frequency', ['MONTHLY', 'QUARTERLY']);

export const accrueOnEnum = pgEnum('accrue_on', ['BEGINNING', 'END']);

export const leaveDurationEnum = pgEnum('leave_duration', ['FULL_DAY', 'HALF_DAY']);

export const shiftEnum = pgEnum('shift', ['MORNING', 'AFTERNOON', 'NONE']);

export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'APPROVED', 'REJECTED', 'DELETED']);

export const roleEnum = pgEnum('role', ['OWNER', 'MANAGER', 'USER', 'ANON', 'ADMIN']);

export const invitationStatusEnum = pgEnum('invitation_status', ['PENDING', 'ACCEPTED', 'REVOKED']);

export const orgStatusEnum = pgEnum('org_status', ['PROVISIONAL', 'VERIFIED', 'RESTRICTED']);

// WFH is an ATTENDANCE status, not a leave type — it lives in @avkash/attendance.
export const leaveTypeKindEnum = pgEnum('leave_type_kind', ['LEAVE', 'COMP_OFF']);

export const ledgerKindEnum = pgEnum('ledger_kind', [
  'OPENING',
  'ACCRUAL',
  'ROLLOVER',
  'COMP_OFF_CREDIT',
  'TAKEN',
  'ENCASHMENT',
  'ADJUSTMENT',
  'EXPIRY',
]);

export const compOffStatusEnum = pgEnum('comp_off_status', ['PENDING', 'APPROVED', 'REJECTED', 'REDEEMED', 'EXPIRED']);

export const encashmentStatusEnum = pgEnum('encashment_status', ['PENDING', 'APPROVED', 'REJECTED', 'PAID']);

// INTERNAL = approvers only (manager ↔ HR); SHARED = visible to the applicant too.
export const commentVisibilityEnum = pgEnum('comment_visibility', ['INTERNAL', 'SHARED']);

export const employmentTypeEnum = pgEnum('employment_type', ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
// Employment status — distinct from auth role; drives leave eligibility + offboarding.
export const employmentStatusEnum = pgEnum('employment_status', [
  'ACTIVE',
  'PROBATION',
  'NOTICE_PERIOD',
  'RESIGNED',
  'TERMINATED',
  'ON_LONG_LEAVE',
]);
