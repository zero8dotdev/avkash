/**
 * scripts/seed-credentials.ts — Idempotent credential seed for the 5 Meridian personas.
 *
 * Creates Better Auth Account rows (providerId='credential') for the Meridian demo users
 * so they can sign in with email + password. Does NOT create new User rows — it links
 * credentials to EXISTING users seeded by seed-meridian.ts.
 *
 * Password for all personas: AvkashDemo@2026
 *
 * Strategy: direct DB insert with hashPassword from better-auth/crypto.
 * accountId = userId (UUID) — this is the convention used by Better Auth's credential
 * provider, confirmed by inspecting existing Account rows.
 *
 * Usage:
 *   DATABASE_URL=postgres://avkash:avkash@localhost:5432/avkash bun scripts/seed-credentials.ts
 *   or via: pnpm demo:seed:credentials
 */

import { db, schema } from '@avkash/db';
import { eq, and } from 'drizzle-orm';

// Better Auth's hashPassword lives in @avkash/auth's better-auth dependency.
// Scripts run at repo root and don't have their own better-auth dep, so we
// import it via the packages/auth workspace node_modules path.
// Equivalent to: import { hashPassword } from 'better-auth/crypto'
const { hashPassword } = (await import('../packages/auth/node_modules/better-auth/dist/crypto/index.mjs')) as {
  hashPassword: (password: string) => Promise<string>;
};

const DEMO_PASSWORD = 'AvkashDemo@2026';

const MERIDIAN_EMAILS = [
  'priya@meridian-demo.example.com',
  'rohan@meridian-demo.example.com',
  'sara@meridian-demo.example.com',
  'dev@meridian-demo.example.com',
  'anita@meridian-demo.example.com',
];

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  Meridian — Demo Credential Seed             ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  for (const email of MERIDIAN_EMAILS) {
    // 1. Look up the existing User row.
    const [user] = await db
      .select({ id: schema.user.id, name: schema.user.name, emailVerified: schema.user.emailVerified })
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    if (!user) {
      console.warn(`  [SKIP] ${email} — no user row found (run pnpm demo:seed first)`);
      continue;
    }

    // 2. Check for an existing credential Account row.
    const [existing] = await db
      .select({ id: schema.account.id })
      .from(schema.account)
      .where(and(eq(schema.account.userId, user.id), eq(schema.account.providerId, 'credential')))
      .limit(1);

    if (existing) {
      // Update the password in case the demo password changed.
      const hashed = await hashPassword(DEMO_PASSWORD);
      await db
        .update(schema.account)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(schema.account.id, existing.id));
      console.log(`  [UPDATE] ${email} — credential updated (${user.id.slice(0, 8)}…)`);
      continue;
    }

    // 3. Hash the demo password and insert a new Account row.
    const hashed = await hashPassword(DEMO_PASSWORD);
    await db.insert(schema.account).values({
      userId: user.id,
      accountId: user.id, // Better Auth credential provider uses userId as accountId
      providerId: 'credential',
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`  [INSERT] ${email} (${user.id.slice(0, 8)}…) — credential created`);
  }

  console.log('\n  Password for all personas: AvkashDemo@2026');
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  Credential seed complete                    ║');
  console.log('╚══════════════════════════════════════════════╝\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[seed-credentials] FATAL:', err);
    process.exit(1);
  });
