# 09 — Migration from Supabase

Complete step-by-step technical migration plan. No code can break in production during this.

---

## Migration Summary

| What             | From                           | To                              | Effort                 |
| ---------------- | ------------------------------ | ------------------------------- | ---------------------- |
| Database         | Supabase PostgreSQL            | Self-hosted / Neon PostgreSQL   | Low — SQL is portable  |
| Auth             | Supabase Auth                  | Better Auth                     | Medium                 |
| DB client        | `@supabase/supabase-js`        | Drizzle ORM + `postgres` driver | High (131 query calls) |
| Session handling | `@supabase/ssr` cookie pattern | Better Auth session cookies     | Medium                 |
| RLS policies     | PostgreSQL RLS                 | Application-level org scoping   | Medium                 |
| File storage     | Not used                       | New (Cloudflare R2)             | N/A                    |
| Realtime         | Not used                       | N/A                             | N/A                    |

---

## Pre-Migration Checklist

- [ ] Set up new PostgreSQL instance (Neon or Docker)
- [ ] Export all data from Supabase: `pg_dump --no-owner --no-acl`
- [ ] Export all users from Supabase Auth (via Admin API → CSV)
- [ ] Set up new project structure (monorepo with `apps/web` + `apps/api`)
- [ ] Create a feature branch: `feat/supabase-migration`
- [ ] Do NOT touch main branch until all tests pass

---

## Step 1: Set Up New PostgreSQL

```bash
# Option A: Neon (recommended for cloud)
# Create project at neon.tech → get connection string

# Option B: Docker (for local dev + self-hosted)
docker run -d \
  --name avkash-postgres \
  -e POSTGRES_DB=avkash \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  postgres:16-alpine

# Run existing schema
psql $DATABASE_URL < db/tables/tables.sql
psql $DATABASE_URL < db/functions/*.sql
psql $DATABASE_URL < db/triggers/*.sql
# Note: Skip db/policies/ — RLS not needed, replaced by app-level checks
```

**RLS Note:** Do NOT migrate RLS policies. They served Supabase's role.
Application-level `orgId` scoping in service layer replaces them.
This simplifies the codebase significantly.

---

## Step 2: Set Up Bun + Hono API

```bash
# Create apps/api directory
mkdir -p apps/api/src
cd apps/api

# Initialize with Bun
bun init

# Install dependencies
bun add hono better-auth drizzle-orm postgres
bun add -d drizzle-kit @types/bun
```

### Better Auth Configuration

```typescript
// apps/api/src/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    slack: {
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // send via Resend
    },
  },
});
```

### Drizzle Setup

```typescript
// apps/api/src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

---

## Step 3: Migrate Auth Users

### Export from Supabase

```bash
# Supabase dashboard → Authentication → Users → Export CSV
# OR via Admin API:
curl https://[project].supabase.co/auth/v1/admin/users \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  > users_export.json
```

### Import into Better Auth

```typescript
// scripts/migrate-users.ts
import { users_export } from './users_export.json';
import { db } from '../apps/api/src/db';
import { user as userTable } from '../apps/api/src/db/schema/auth';

for (const supabaseUser of users_export) {
  await db.insert(userTable).values({
    id: supabaseUser.id, // keep same UUIDs (critical for FK integrity)
    email: supabaseUser.email,
    name: supabaseUser.user_metadata?.name ?? supabaseUser.email,
    emailVerified: supabaseUser.email_confirmed_at !== null,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(supabaseUser.updated_at),
  });
}
```

**Key:** Keep the same UUIDs from Supabase. All FK references in User table use these.
Users will need to re-authenticate (magic link sent to their email on first login attempt).

---

## Step 4: Replace Supabase Clients

### Delete

```
src/app/_utils/supabase/client.ts
src/app/_utils/supabase/server.ts
src/app/_utils/supabase/admin.ts
```

### Replace with API Client

```typescript
// apps/web/src/lib/api.ts
import type { AppType } from '@avkash/api';
import { hc } from 'hono/client';

export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);
```

```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
});
```

---

## Step 5: Migrate Middleware

### Current (Supabase)

```typescript
// middleware.ts (current)
import { updateSession } from '@/utils/supabase/middleware';
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

### New (Better Auth)

```typescript
// middleware.ts (new)
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/initialsetup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  if (!isProtected) return NextResponse.next();

  // Better Auth uses cookie-based session
  const sessionCookie = request.cookies.get('better-auth.session_token');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify session via API (or use Better Auth server helper)
  const session = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/get-session`, {
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  }).then((r) => r.json());

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

---

## Step 6: Migrate Server Actions (131 query calls)

This is the bulk of the work. Approach: **file by file, module by module**.

### Current Pattern (Supabase)

```typescript
// Old: src/app/_actions/index.ts
import { createClient } from '@/utils/supabase/server';

export async function getLeaves(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Leave')
    .select('*, User(*), LeaveType(*)')
    .eq('orgId', orgId)
    .order('createdAt', { ascending: false });
  return data;
}
```

### New Pattern (API call from Next.js)

```typescript
// New: apps/web/src/app/_actions/leaves.ts
import { api } from '@/lib/api';
import { getSession } from '@/lib/auth-server';

export async function getLeaves() {
  const session = await getSession();
  const res = await api.leaves.$get({
    query: { orgId: session.user.orgId },
  });
  return res.json();
}
```

### New Pattern (Drizzle in API route)

```typescript
// New: apps/api/src/routes/leaves.ts
import { Hono } from 'hono';
import { db } from '../db';
import { leave, user, leaveType } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const leaves = new Hono();

leaves.get('/', authMiddleware, async (c) => {
  const { orgId } = c.get('session');
  const data = await db
    .select()
    .from(leave)
    .leftJoin(user, eq(leave.userId, user.userId))
    .leftJoin(leaveType, eq(leave.leaveTypeId, leaveType.leaveTypeId))
    .where(eq(leave.orgId, orgId))
    .orderBy(desc(leave.createdAt));
  return c.json(data);
});

export { leaves };
```

### Migration Order for Actions

Migrate in this order (least to most complex):

1. Read-only queries (select) — safe, no side effects
2. Simple inserts/updates (create leave, update user)
3. Complex workflows (payroll run, leave approval chain)
4. Auth-related (signup, session, Slack OAuth)

---

## Step 7: Update AppContext

```typescript
// Current: gets user from Supabase auth
const {
  data: { user },
} = await supabase.auth.getUser();

// New: gets from Better Auth session
const session = await authClient.useSession();
const user = session.data?.user;
```

AppContext state (orgId, userId, teamId, role) still comes from DB lookups,
same as before — just the initial auth user source changes.

---

## Step 8: Remove Supabase Dependencies

```bash
bun remove @supabase/supabase-js @supabase/ssr

# Remove from package.json, update imports
# Remove supabase/ directory (local Supabase config)
```

---

## Step 9: Data Integrity Verification

After migration:

```sql
-- Check user count matches
SELECT COUNT(*) FROM "User";
-- Compare with Supabase Users count

-- Check all FKs are intact
SELECT COUNT(*) FROM "Leave" l
LEFT JOIN "User" u ON l."userId" = u."userId"
WHERE u."userId" IS NULL;
-- Should return 0

-- Check org data
SELECT COUNT(*) FROM "Organisation";
SELECT COUNT(*) FROM "Team";
```

---

## Rollback Plan

If migration fails:

1. Keep Supabase running during migration (don't delete)
2. Feature flag in middleware: `USE_NEW_AUTH=true/false`
3. If new auth breaks, set `USE_NEW_AUTH=false` → routes through Supabase
4. Fix issue, re-deploy, flip flag again

---

## Timeline

| Week   | Tasks                                                      |
| ------ | ---------------------------------------------------------- |
| Week 1 | Monorepo setup, Bun API scaffolding, Better Auth + Drizzle |
| Week 2 | DB migration (schema + data), user import script           |
| Week 3 | Migrate read actions (all selects)                         |
| Week 4 | Migrate write actions (inserts + updates)                  |
| Week 5 | Middleware + session handling, auth flows                  |
| Week 6 | QA full flow end-to-end, fix bugs                          |
| Week 7 | Staging deploy, smoke test with real data                  |
| Week 8 | Production cutover (maintenance window: 30 min)            |
