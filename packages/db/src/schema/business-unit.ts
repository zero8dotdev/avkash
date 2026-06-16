import { pgTable, uuid, varchar, boolean, integer, char, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organisation } from './core';

// Business unit / subsidiary brand entity.
// A branding overlay for a subset of employees (e.g. a sales subsidiary that operates
// under a different brand name but belongs to the same org). Employees in a unit have
// their name/logo substituted on documents and communications.
export const businessUnit = pgTable(
  'BusinessUnit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    name: varchar('name', { length: 255 }).notNull(), // brand/display name
    legalName: varchar('legalName', { length: 255 }), // null = same as org's legal name
    logoUrl: varchar('logoUrl', { length: 1000 }),
    brandColor: char('brandColor', { length: 6 }), // hex without #
    isActive: boolean('isActive').notNull().default(true),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [uniqueIndex('uq_business_unit_org_name').on(t.orgId, t.name), index('idx_business_unit_org').on(t.orgId)]
);
