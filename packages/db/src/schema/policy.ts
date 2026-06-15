import { pgTable, uuid, varchar, text, boolean, integer, date, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organisation, user } from './core';
import { policyStatusEnum } from './enums';

// HR document management — standing orders, codes of conduct, factory rules.
// Scoped by location / department / org-level; employees acknowledge they have read each policy.

export const policy = pgTable(
  'Policy',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    title: varchar('title', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(), // url-safe, unique per org
    body: text('body'),
    // Policy version (content revision counter) — distinct from dbVersion (concurrency token).
    policyVersion: integer('policyVersion').notNull().default(1),
    status: policyStatusEnum('status').notNull().default('DRAFT'),
    effectiveFrom: date('effectiveFrom'),

    // Applicability scope — null means "applies to all" for that dimension.
    locationIds: uuid('locationIds').array(), // soft FKs → Location
    departmentIds: uuid('departmentIds').array(), // soft FKs → Department
    levelIds: uuid('levelIds').array(), // soft FKs → OrgLevel

    requiresAck: boolean('requiresAck').notNull().default(true),
    ackDeadlineDays: integer('ackDeadlineDays'),

    publishedAt: timestamp('publishedAt', { precision: 6 }),
    publishedBy: uuid('publishedBy').references(() => user.id),
    archivedAt: timestamp('archivedAt', { precision: 6 }),
    archivedBy: uuid('archivedBy').references(() => user.id),

    dbVersion: integer('dbVersion').notNull().default(0), // optimistic concurrency (ETag / If-Match)
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_policy_org_slug').on(t.orgId, t.slug),
    index('idx_policy_org').on(t.orgId),
    index('idx_policy_status').on(t.status),
  ]
);

// Immutable snapshot of each policy body at publish time. Allows employees to
// read what they actually acknowledged even after the policy body is updated.
export const policyVersionHistory = pgTable(
  'PolicyVersionHistory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    policyId: uuid('policyId')
      .notNull()
      .references(() => policy.id, { onDelete: 'cascade' }),
    policyVersion: integer('policyVersion').notNull(),
    body: text('body'),
    publishedAt: timestamp('publishedAt', { precision: 6 }).notNull(),
    publishedBy: uuid('publishedBy')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_policy_version_policy').on(t.policyId),
    uniqueIndex('uq_policy_version').on(t.policyId, t.policyVersion),
  ]
);

// Employee acknowledgement — one row per (policy, employee, version).
// Unique constraint makes acknowledge idempotent.
export const policyAcknowledgement = pgTable(
  'PolicyAcknowledgement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    policyId: uuid('policyId')
      .notNull()
      .references(() => policy.id, { onDelete: 'cascade' }),
    policyVersion: integer('policyVersion').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    acknowledgedAt: timestamp('acknowledgedAt', { precision: 6 }).notNull().defaultNow(),
    ipAddress: varchar('ipAddress', { length: 45 }),
  },
  (t) => [
    uniqueIndex('uq_policy_ack').on(t.policyId, t.userId, t.policyVersion),
    index('idx_policy_ack_org').on(t.orgId),
    index('idx_policy_ack_user').on(t.userId),
  ]
);
