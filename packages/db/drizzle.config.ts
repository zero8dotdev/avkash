import { defineConfig } from 'drizzle-kit';

// Schema-first workflow: `drizzle-kit push` syncs this schema directly to the
// database — no versioned migration files. The project starts on a fresh DB with
// no legacy data to migrate. (Switch to generate/migrate once there's a
// production DB you can't safely push to.)
export default defineConfig({
  schema: './src/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/avkash',
  },
});
