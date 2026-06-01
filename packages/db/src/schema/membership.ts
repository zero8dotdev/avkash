import { pgTable, uuid, text, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { organisation, team, user } from './core'
import { roleEnum, invitationStatusEnum } from './enums'

// ── Invitation ───────────────────────────────────────────────────────────────
// Invite-only signup gate. The user.create.before hook in @avkash/auth looks up
// a PENDING invitation by email; no invitation → no account, on ANY login method.
// Provisioning (role/org/team) is copied from here onto the new user.
export const invitation = pgTable(
  'Invitation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId, { onDelete: 'cascade' }),
    teamId: uuid('teamId').references(() => team.teamId),
    role: roleEnum('role').notNull().default('USER'),
    token: text('token').notNull().unique(),
    status: invitationStatusEnum('status').notNull().default('PENDING'),
    invitedBy: uuid('invitedBy').references(() => user.id),
    expiresAt: timestamp('expiresAt', { precision: 6 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_invitation_email').on(t.email), index('idx_invitation_org').on(t.orgId)],
)

// ── OrgDomain ────────────────────────────────────────────────────────────────
// Allowed Google Workspace hosted domains per org. The hd-restriction is enforced
// server-side: a Google sign-in's email domain must match a verified row here.
export const orgDomain = pgTable(
  'OrgDomain',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId, { onDelete: 'cascade' }),
    domain: varchar('domain', { length: 255 }).notNull().unique(),
    verified: boolean('verified').notNull().default(false),
    verificationToken: text('verificationToken').notNull(),
    lastCheckedAt: timestamp('lastCheckedAt', { precision: 6 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_orgdomain_org').on(t.orgId)],
)
