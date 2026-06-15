import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  date,
  integer,
  numeric,
  time,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { visibilityEnum, roleEnum, daysOfWeekEnum, orgStatusEnum, laborRegimeEnum } from './enums';

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
    escalateAfterDays: integer('escalateAfterDays'), // org-wide SLA: PENDING > N days → escalate (null → system default 3)
    version: integer('version').notNull().default(0), // optimistic-concurrency token (ETag / If-Match)
    initialSetup: varchar('initialSetup', { length: 1 }).default('0'),
    isSetupCompleted: boolean('isSetupCompleted').default(false),
    // Ownership-validation lifecycle: PROVISIONAL → VERIFIED via DNS TXT,
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
  ]
);

// ── Location ────────────────────────────────────────────────────────────────
// A first-class site. Owns the timezone (all shift/window/"today" math runs
// in it — never server-local), plus geofence + the allowed punch window for machines.
// Defined here (not its own file) so user/team can FK it without a core⇄location import
// cycle. The legacy string `location` columns stay during transition.
export const location = pgTable(
  'Location',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    name: varchar('name', { length: 255 }).notNull(),
    timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'), // IANA, e.g. Asia/Kolkata
    address: varchar('address', { length: 500 }),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    geofenceRadiusM: integer('geofenceRadiusM'),
    ipAllowlist: varchar('ipAllowlist', { length: 64 }).array(),
    punchWindowStart: time('punchWindowStart'), // local; null = always open
    punchWindowEnd: time('punchWindowEnd'),
    // SEZ / labour regime flag. STANDARD = Factories Act / Shops & Est.
    // SEZ factories get additional compliance rules (night-shift ban, 6-day week, OT threshold).
    laborRegime: laborRegimeEnum('laborRegime').notNull().default('STANDARD'),
    // When set, overrides shift.fullDayHours for OT calculation at this location (e.g. SEZ = 9h).
    overtimeThresholdHours: numeric('overtimeThresholdHours', { precision: 4, scale: 2 }),
    isActive: boolean('isActive').notNull().default(true),
    version: integer('version').notNull().default(0), // optimistic-concurrency token (ETag / If-Match)
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_location_org_name').on(t.orgId, t.name), index('idx_location_org').on(t.orgId)]
);

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
    location: varchar('location', { length: 255 }), // legacy string label (transitioning to locationId)
    locationId: uuid('locationId').references(() => location.id),
    escalateAfterDays: integer('escalateAfterDays'), // overrides the org SLA; 0 = off (e.g. HR-managed core team)
    escalatesTo: uuid('escalatesTo'), // designated HR user for this team's escalations (null → all ADMINs)
    defaultShiftId: uuid('defaultShiftId'), // soft ref to Shift — the roster cascade baseline (null = no shift)
    workweekPatternId: uuid('workweekPatternId'), // soft FK → WorkweekPattern (null = use team.workweek)
    // Org-chart link: which department this team belongs to (null = ungrouped). Approval routing
    // stays on teamId; departmentId here enables Department → Teams → Employees queries.
    departmentId: uuid('departmentId'), // soft FK → Department
    version: integer('version').notNull().default(0), // optimistic-concurrency token (ETag / If-Match)
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
  (t) => [index('idx_team_org_id').on(t.orgId), index('idx_team_manager').on(t.managers)]
);

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
    locationId: uuid('locationId').references(() => location.id), // home location (→ timezone)
    accruedLeave: jsonb('accruedLeave').$type<Record<string, unknown>>().default({}),
    usedLeave: jsonb('usedLeave').$type<Record<string, unknown>>().default({}),
    overrides: jsonb('overrides').$type<Record<string, unknown>>().default({}),
    keyword: varchar('keyword'),
    language: varchar('language', { length: 8 }), // preferred locale (e.g. 'en', 'hi')
    // Per-person working days; overrides the team's workweek when set (else null → team).
    workweek: daysOfWeekEnum('workweek').array(),
    joinedOn: date('joinedOn'), // employment start; drives mid-year proration (falls back to createdAt)
    version: integer('version').notNull().default(0), // optimistic-concurrency token (ETag / If-Match)
    // Structural/org-chart unit. Soft FK → Department — constraint managed by db:push.
    // Approval routing stays on teamId; departmentId is for org-chart / reporting / compliance.
    departmentId: uuid('departmentId'),
    // Soft FK → WorkweekPattern. null = inherit from team; team null = fixed workweek.
    workweekPatternId: uuid('workweekPatternId'),
    // Floating-manager flag. Auto-set when employmentLevel = MANAGEMENT.
    // When true, ingestPunch routes to the punch location's shift supervisor, not the user's team manager.
    isFloating: boolean('isFloating').notNull().default(false),
    // Subsidiary brand overlay (null = use parent org branding).
    businessUnitId: uuid('businessUnitId'), // soft FK → BusinessUnit
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    index('idx_user_org_id').on(t.orgId),
    index('idx_user_team_id').on(t.teamId),
    index('idx_user_email').on(t.email),
    index('idx_user_department_id').on(t.departmentId),
  ]
);

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
  (t) => [index('idx_orgaccessdata_org_id').on(t.orgId)]
);
