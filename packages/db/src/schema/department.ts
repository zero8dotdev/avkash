import { pgTable, uuid, varchar, boolean, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organisation, user, location } from './core';

// A structural org-chart unit. Distinct from Team (which drives leave approval).
// A department can exist across multiple locations with a different headcount at each.
export const department = pgTable(
  'Department',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 32 }).notNull(), // short mnemonic, e.g. "PROD", "MAINT"
    description: varchar('description', { length: 500 }),
    isActive: boolean('isActive').notNull().default(true),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_department_org_code').on(t.orgId, t.code),
    uniqueIndex('uq_department_org_name').on(t.orgId, t.name),
    index('idx_department_org').on(t.orgId),
  ]
);

// Which departments exist in which locations, and who leads them at each site.
export const departmentLocation = pgTable(
  'DepartmentLocation',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId').notNull(),
    departmentId: uuid('departmentId')
      .notNull()
      .references(() => department.id, { onDelete: 'cascade' }),
    locationId: uuid('locationId')
      .notNull()
      .references(() => location.id, { onDelete: 'cascade' }),
    headUserId: uuid('headUserId').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
  },
  (t) => [
    uniqueIndex('uq_dept_location').on(t.departmentId, t.locationId),
    index('idx_dept_location_org').on(t.orgId),
    index('idx_dept_location_dept').on(t.departmentId),
    index('idx_dept_location_loc').on(t.locationId),
  ]
);
