import { pgTable, uuid, varchar, char, integer, boolean, date, timestamp, index } from 'drizzle-orm/pg-core';
import { organisation } from './core';

// ── Holiday (org-specific) ───────────────────────────────────────────────────
export const holiday = pgTable(
  'Holiday',
  {
    holidayId: uuid('holidayId').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    date: timestamp('date', { precision: 6 }).notNull(),
    location: varchar('location', { length: 255 }),
    isRecurring: boolean('isRecurring').notNull().default(true),
    isCustom: boolean('isCustom').notNull().default(true),
    orgId: uuid('orgId')
      .notNull()
      .references(() => organisation.orgId),
    createdBy: varchar('createdBy', { length: 255 }),
    createdOn: timestamp('createdOn', { precision: 6 }).defaultNow(),
    updatedBy: varchar('updatedBy', { length: 255 }),
    updatedOn: timestamp('updatedOn', { precision: 6 }).defaultNow(),
  },
  (t) => [
    index('idx_holiday_org_id').on(t.orgId),
    index('idx_holiday_date').on(t.date),
    index('idx_holiday_recurring').on(t.isRecurring),
  ]
);

// ── PublicHolidays (global reference data) ───────────────────────────────────
export const publicHolidays = pgTable('PublicHolidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  country: varchar('country', { length: 50 }),
  iso: char('iso', { length: 2 }),
  year: integer('year'),
  date: date('date'),
  day: varchar('day', { length: 15 }),
  name: varchar('name', { length: 100 }),
  type: varchar('type', { length: 50 }),
});
