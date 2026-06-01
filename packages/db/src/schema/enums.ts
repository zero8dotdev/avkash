import { pgEnum } from 'drizzle-orm/pg-core'

// PG enum type names are snake_case. (The legacy DB used PascalCase like
// "DaysOfWeek", but that breaks drizzle-kit `push` for enum *arrays* — the diff
// emits an unquoted `daysofweek[]` that Postgres case-folds and can't match.
// Fresh DB, no data migration, so we modernize the type names; enum VALUES and
// the TS variable names are unchanged.)
export const visibilityEnum = pgEnum('visibility', ['ORG', 'TEAM', 'SELF'])

export const daysOfWeekEnum = pgEnum('days_of_week', [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
])

export const accrualFrequencyEnum = pgEnum('accrual_frequency', ['MONTHLY', 'QUARTERLY'])

export const accrueOnEnum = pgEnum('accrue_on', ['BEGINNING', 'END'])

export const leaveDurationEnum = pgEnum('leave_duration', ['FULL_DAY', 'HALF_DAY'])

export const shiftEnum = pgEnum('shift', ['MORNING', 'AFTERNOON', 'NONE'])

export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'APPROVED', 'REJECTED', 'DELETED'])

export const roleEnum = pgEnum('role', ['OWNER', 'MANAGER', 'USER', 'ANON', 'ADMIN'])

export const invitationStatusEnum = pgEnum('invitation_status', ['PENDING', 'ACCEPTED', 'REVOKED'])

export const orgStatusEnum = pgEnum('org_status', ['PROVISIONAL', 'VERIFIED', 'RESTRICTED'])
