import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { visibilityEnum, roleEnum, daysOfWeekEnum, orgStatusEnum } from './enums'

// ── Organisation ──────────────────────────────────────────────────────────
export const organisation = pgTable(
  'Organisation',
  {
    orgId: uuid('orgId').primaryKey().defaultRandom(),
    subscriptionId: varchar('subscriptionId', { length: 255 }),
    dateformat: varchar('dateformat', { length: 255 }).notNull().default('dd/mm/yyyy'),
    timeformat: varchar('timeformat', { length: 255 }).notNull().default('12-hour'),
    location: varchar('location', { length: 255 }).array(),
    visibility: visibilityEnum('visibility').notNull().default('SELF'),
    ownerId: uuid('ownerId'),
    halfDayLeave: boolean('halfDayLeave').notNull().default(false),
    initialSetup: varchar('initialSetup', { length: 1 }).default('0'),
    isSetupCompleted: boolean('isSetupCompleted').default(false),
    // Ownership-validation lifecycle (plans/13): PROVISIONAL → VERIFIED via DNS TXT,
    // or → RESTRICTED if the 14-day grace window lapses unverified.
    status: orgStatusEnum('status').notNull().default('PROVISIONAL'),
    verifyBy: timestamp('verifyBy', { precision: 6 }),
    verifiedAt: timestamp('verifiedAt', { precision: 6 }),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
    name: varchar('name', { length: 255 }),
  },
  (t) => [
    index('idx_organisation_subscription_id').on(t.subscriptionId),
    index('idx_organisation_owner_id').on(t.ownerId),
  ],
)

// ── Team ──────────────────────────────────────────────────────────────────
export const team = pgTable(
  'Team',
  {
    teamId: uuid('teamId').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    isActive: boolean('isActive').notNull().default(true),
    managers: uuid('managers').array(),
    location: varchar('location', { length: 255 }),
    startOfWorkWeek: daysOfWeekEnum('startOfWorkWeek').default('MONDAY'),
    workweek: daysOfWeekEnum('workweek')
      .array()
      .default(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    timeZone: varchar('timeZone', { length: 255 }),
    notificationLeaveChanged: boolean('notificationLeaveChanged').notNull().default(false),
    notificationDailySummary: boolean('notificationDailySummary').notNull().default(false),
    notificationDailySummarySendOnTime: text('notificationDailySummarySendOnTime'),
    notificationWeeklySummary: boolean('notificationWeeklySummary').notNull().default(false),
    notificationWeeklySummaryTime: text('notificationWeeklySummaryTime'),
    notificationWeeklySummarySendOnDay: daysOfWeekEnum('notificationWeeklySummarySendOnDay'),
    notificationToWhom: roleEnum('notificationToWhom').array().notNull().default(['MANAGER']),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [index('idx_team_org_id').on(t.orgId), index('idx_team_manager').on(t.managers)],
)

// ── User ──────────────────────────────────────────────────────────────────
// Reconciled with Better Auth (Option A: one table). The first block is Better
// Auth's required user shape; the second block is Avkash domain data, exposed to
// Better Auth via `additionalFields` in @avkash/auth. Identity links (slack,
// google, email) now live in the Account table — NOT as columns here.
export const user = pgTable(
  'User',
  {
    // ── Better Auth core ──
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    // phoneNumber plugin (Better Auth) — OTP login.
    phoneNumber: varchar('phoneNumber', { length: 32 }).unique(),
    phoneNumberVerified: boolean('phoneNumberVerified').notNull().default(false),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    // ── Avkash domain (single-org-per-user) ──
    role: roleEnum('role').notNull().default('USER'),
    orgId: uuid('orgId').references(() => organisation.orgId),
    teamId: uuid('teamId').references(() => team.teamId, { onDelete: 'restrict' }),
    accruedLeave: jsonb('accruedLeave').$type<Record<string, unknown>>().default({}),
    usedLeave: jsonb('usedLeave').$type<Record<string, unknown>>().default({}),
    overrides: jsonb('overrides').$type<Record<string, unknown>>().default({}),
    keyword: varchar('keyword'),
    language: varchar('language', { length: 8 }), // preferred locale (e.g. 'en', 'hi')
    // Per-person working days; overrides the team's workweek when set (else null → team).
    workweek: daysOfWeekEnum('workweek').array(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    index('idx_user_org_id').on(t.orgId),
    index('idx_user_team_id').on(t.teamId),
    index('idx_user_email').on(t.email),
  ],
)

// ── OrgAccessData (OAuth tokens per org) ────────────────────────────────────
export const orgAccessData = pgTable(
  'OrgAccessData',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId').references(() => organisation.orgId),
    slackAccessToken: text('slackAccessToken'),
    slackRefreshToken: text('slackRefreshToken'),
    googleAccessToken: text('googleAccessToken'),
    googleRefreshToken: text('googleRefreshToken'),
    ownerSlackId: text('ownerSlackId'),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [index('idx_orgaccessdata_org_id').on(t.orgId)],
)
