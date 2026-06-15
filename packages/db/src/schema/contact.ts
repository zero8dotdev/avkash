import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

// ── ContactEmail (marketing-site contact form submissions) ───────────────────
export const contactEmail = pgTable('ContactEmail', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('firstName', { length: 255 }),
  lastName: varchar('lastName', { length: 255 }),
  email: varchar('email', { length: 255 }),
  message: varchar('message', { length: 255 }),
});
