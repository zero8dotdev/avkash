import { pgTable, uuid, varchar, integer, date, timestamp, index } from 'drizzle-orm/pg-core';
import { organisation, user, location } from './core';
import { transferTypeEnum, transferStatusEnum } from './enums';

// Plan 34: effective-dated employee transfers between factories.
// Soft FKs on fromDepartmentId/toDepartmentId (department is in a different file).
export const transfer = pgTable(
  'Transfer',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    fromLocationId: uuid('fromLocationId')
      .notNull()
      .references(() => location.id),
    toLocationId: uuid('toLocationId')
      .notNull()
      .references(() => location.id),
    // Soft FKs to department — avoids circular schema import.
    fromDepartmentId: uuid('fromDepartmentId'),
    toDepartmentId: uuid('toDepartmentId'),
    type: transferTypeEnum('type').notNull(),
    startDate: date('startDate').notNull(),
    endDate: date('endDate'), // null = permanent / open-ended temp
    status: transferStatusEnum('status').notNull().default('PENDING'),
    authorizedBy: uuid('authorizedBy').references(() => user.id),
    notes: varchar('notes', { length: 1000 }),
    letterUrl: varchar('letterUrl', { length: 2048 }),
    version: integer('version').default(0),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [
    index('idx_transfer_user_start').on(t.userId, t.startDate),
    index('idx_transfer_user_status').on(t.userId, t.status),
    index('idx_transfer_org').on(t.orgId),
  ]
);
