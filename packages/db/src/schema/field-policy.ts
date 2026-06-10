import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { organisation } from './core';

// Field-policy: per-org overrides for the field-group visibility matrix (Plan 51 Piece 3).
// Resolution: row here → module-manifest default (ResourceFieldGroups.defaults).
// Cached per (orgId, resource) with a short TTL; invalidated on write.
//
// relation matches FGA relation names ('hr_admin', 'manager', 'subject') or Role names;
// access 'write' implies 'read'; 'none' hides the group entirely.
export const fieldPolicy = pgTable(
  'FieldPolicy',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    resource: varchar('resource', { length: 128 }).notNull(), // e.g. 'employee'
    fieldGroup: varchar('fieldGroup', { length: 128 }).notNull(), // e.g. 'compensation'
    relation: varchar('relation', { length: 128 }).notNull(), // e.g. 'hr_admin' | 'manager' | 'subject'
    access: varchar('access', { length: 16 }).notNull(), // 'read' | 'write' | 'none'

    version: integer('version').notNull().default(0), // optimistic-concurrency token (ETag / If-Match)
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_field_policy').on(t.orgId, t.resource, t.fieldGroup, t.relation),
    index('idx_field_policy_org_resource').on(t.orgId, t.resource),
  ]
);
