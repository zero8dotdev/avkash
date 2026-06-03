import { pgTable, uuid, varchar, text, date, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { user, organisation } from './core';
import { employmentTypeEnum, employmentStatusEnum } from './enums';

// The HR record — 1:1 with user, separate from the auth identity so PII gating is
// enforceable at the table boundary. Fields are grouped by their access tier (the
// read/write rules live in @avkash/users, not the schema). See plans/18.
export const employeeProfile = pgTable(
  'EmployeeProfile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .unique()
      .references(() => user.id),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),

    // PUBLIC (any colleague)
    employeeCode: varchar('employeeCode', { length: 64 }),
    designation: varchar('designation', { length: 255 }),

    // MANAGER read / HR write
    employmentType: employmentTypeEnum('employmentType'),
    workLocation: varchar('workLocation', { length: 255 }),
    reportingManagerId: uuid('reportingManagerId').references(() => user.id),
    employmentStatus: employmentStatusEnum('employmentStatus').notNull().default('ACTIVE'),
    probationEndsOn: date('probationEndsOn'),
    confirmedOn: date('confirmedOn'),

    // HR only
    exitDate: date('exitDate'),
    exitReason: varchar('exitReason', { length: 500 }),

    // SELF (the employee + HR)
    dateOfBirth: date('dateOfBirth'),
    gender: varchar('gender', { length: 32 }),
    maritalStatus: varchar('maritalStatus', { length: 32 }),
    nationality: varchar('nationality', { length: 64 }),
    personalEmail: varchar('personalEmail', { length: 255 }),
    personalPhone: varchar('personalPhone', { length: 32 }),
    address: text('address'),
    emergencyContact: jsonb('emergencyContact').$type<{ name?: string; relation?: string; phone?: string }>(),

    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [
    index('idx_employee_org').on(t.orgId),
    index('idx_employee_status').on(t.employmentStatus),
    uniqueIndex('uq_employee_org_code').on(t.orgId, t.employeeCode),
  ]
);
