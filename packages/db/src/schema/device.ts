import { pgTable, uuid, varchar, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { organisation, location, user } from './core';
import { deviceKindEnum, deviceStatusEnum } from './enums';

// An attendance machine at a location (plan 23). Authenticates to the punch-ingest
// endpoint with a per-device secret (stored hashed; presented as a bearer, verified
// constant-time). Revoking one machine = flipping its status / rotating its secret.
export const device = pgTable(
  'Device',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    locationId: uuid('locationId')
      .notNull()
      .references(() => location.id),
    name: varchar('name', { length: 255 }).notNull(),
    kind: deviceKindEnum('kind').notNull().default('BIOMETRIC'),
    serial: varchar('serial', { length: 255 }),
    secretHash: varchar('secretHash', { length: 64 }).notNull(), // sha256 hex of the device secret
    status: deviceStatusEnum('status').notNull().default('ACTIVE'),
    lastSeenAt: timestamp('lastSeenAt', { precision: 6 }),
    version: integer('version').notNull().default(0), // optimistic concurrency
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [index('idx_device_org').on(t.orgId), index('idx_device_location').on(t.locationId)]
);

// Per-org identity map: a machine knows a person by their badge/biometric id
// (externalId), not our userId. One externalId → one user, across all sites.
export const deviceEnrollment = pgTable(
  'DeviceEnrollment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    externalId: varchar('externalId', { length: 255 }).notNull(),
    label: varchar('label', { length: 255 }),
    createdBy: varchar('createdBy', { length: 255 }),
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_enrollment_org_external').on(t.orgId, t.externalId),
    index('idx_enrollment_user').on(t.userId),
  ]
);
