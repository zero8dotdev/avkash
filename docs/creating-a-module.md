# Creating a module

A developer guide for building a new module on the Avkash open core — using a **Learning Management System
(LMS)** as the worked example. By the end you'll have a self-contained `@avkash/lms` package that adds
courses, enrollments, and completions, reacts to core events (auto-enroll new hires), exposes a versioned
HTTP API, and is switched on per organisation.

> **Status.** The _domain conventions_ in this guide (schema, ctx-first services, DTOs, validation, errors,
> RBAC, optimistic concurrency, tests) are how Avkash works **today** — copy them verbatim. The _platform
> seams_ that make a module truly plug-and-play (the **manifest/registry**, the **event bus**, and
> **entitlements**) are defined in [Plan 49](../plans/49-modular-core-platform.md) and
> [Plan 50](../plans/50-repository-open-core-strategy.md) and are being implemented. Sections that depend on
> an unbuilt seam are tagged **[Platform: Phase N]**, with the current interim wiring shown inline.

---

## 1. What a module is

A module is a package that adds a capability **without modifying core**. It depends only _downward_ on the
core, and core never imports it back.

```
   ┌── CORE (open, always present) ─────────────────────────────┐
   │  shared · config · db · i18n · auth · org · users          │
   │  events · registry · entitlements · platform middleware    │
   └───────────────▲───────────────────────▲───────────────────┘
                   │ imports (down only)    │ publish / subscribe
        ┌──────────┴──────────┐    your module talks to others
        │  @avkash/lms        │    ONLY through events, never by
        │  (this guide)       │    importing their internals.
        └─────────────────────┘
```

A well-formed module **owns**: its database tables, its domain logic, its HTTP routes, its response DTOs, its
error/message strings, its background jobs, the events it emits, and a single **entitlement key** that gates
it per tenant. It may **import** foundation packages (`@avkash/shared`, `@avkash/db`, `@avkash/i18n`),
identity (`@avkash/auth`), core domains for reads (`@avkash/users`, `@avkash/org`), and the platform packages
(`@avkash/events`, `@avkash/entitlements`).

The three independent levers (see [Plan 50](../plans/50-repository-open-core-strategy.md)) decide a module's
reach: **source** (open repo vs your private repo), **build** (in this binary's module list or not), and
**runtime** (the per-org entitlement flag). This guide builds an LMS you could contribute to the open core
_or_ keep as a private module in your own deployment — the code is identical; only registration differs
(§13).

---

## 2. Anatomy of a module

```
packages/lms/
  package.json            # just-in-time package, exports ./src/index.ts
  tsconfig.json           # extends @avkash/tsconfig/base.json
  src/
    schema.ts             # the module's own Drizzle tables (it OWNS these)
    courses.ts            # ctx-first domain logic (create/publish/list)
    enrollments.ts        # ctx-first domain logic (enroll/complete)
    events.ts             # event definitions it emits + subscribers it registers
    i18n.ts               # error/message catalog (namespaced by module key)
    jobs.ts               # background jobs (optional)
    module.ts             # the AvkashModule manifest — ties it all together
    index.ts              # public exports
    lms.test.ts           # scenario test against a real DB
```

Everything the module needs lives here. Adding it to a deployment is **one line** (§13) — no edits scattered
across core files.

---

## 3. Step 1 — Scaffold the package

`package.json` — mirror an existing domain package. Note `exports` points straight at source (no build step)
and all internal deps are `workspace:*`.

```json
{
  "name": "@avkash/lms",
  "version": "0.0.0",
  "private": true,
  "description": "Module: learning management (courses, enrollments, completions).",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "lint": "eslint .",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo node_modules dist"
  },
  "dependencies": {
    "@avkash/db": "workspace:*",
    "@avkash/shared": "workspace:*",
    "@avkash/auth": "workspace:*",
    "@avkash/users": "workspace:*",
    "@avkash/events": "workspace:*",
    "@avkash/entitlements": "workspace:*",
    "drizzle-orm": "^0.38.0"
  },
  "devDependencies": {
    "@avkash/tsconfig": "workspace:*",
    "@avkash/eslint-config": "workspace:*",
    "typescript": "^5.8.2",
    "@types/bun": "^1.1.0"
  }
}
```

`tsconfig.json`:

```json
{ "extends": "@avkash/tsconfig/base.json", "include": ["src"] }
```

Then `pnpm install` from the repo root to link it into the workspace.

---

## 4. Step 2 — Model the data (`src/schema.ts`)

A module **owns its tables**. Because the LMS is your module (not part of `@avkash/db`), its tables live
here, importing the core `organisation`/`user` tables from `@avkash/db` for foreign keys. Follow the house
rules every Avkash table obeys: a non-null `orgId` FK (multi-tenancy), a `dbVersion` integer (optimistic
concurrency), audit columns, and an index on `orgId`.

```ts
import { pgTable, uuid, varchar, text, integer, timestamp, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { schema } from '@avkash/db'; // core tables: schema.organisation, schema.user

export const courseStatus = pgEnum('lms_course_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const enrollmentStatus = pgEnum('lms_enrollment_status', ['ENROLLED', 'IN_PROGRESS', 'COMPLETED']);

export const lmsCourse = pgTable(
  'LmsCourse',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => schema.organisation.orgId),
    title: varchar('title', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    status: courseStatus('status').notNull().default('DRAFT'),
    mandatory: integer('mandatory').notNull().default(0), // 1 = auto-enroll new hires (see events)
    dbVersion: integer('dbVersion').notNull().default(0), // optimistic concurrency (ETag/If-Match)
    createdAt: timestamp('createdAt', { precision: 6 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 6 }).notNull().defaultNow(),
    createdBy: varchar('createdBy', { length: 255 }),
    updatedBy: varchar('updatedBy', { length: 255 }),
  },
  (t) => [uniqueIndex('uq_lms_course_org_slug').on(t.orgId, t.slug), index('idx_lms_course_org').on(t.orgId)]
);

export const lmsEnrollment = pgTable(
  'LmsEnrollment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('orgId')
      .notNull()
      .references(() => schema.organisation.orgId),
    courseId: uuid('courseId')
      .notNull()
      .references(() => lmsCourse.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => schema.user.id),
    status: enrollmentStatus('status').notNull().default('ENROLLED'),
    enrolledAt: timestamp('enrolledAt', { precision: 6 }).notNull().defaultNow(),
    completedAt: timestamp('completedAt', { precision: 6 }),
  },
  (t) => [
    uniqueIndex('uq_lms_enrollment').on(t.courseId, t.userId), // makes enroll idempotent
    index('idx_lms_enrollment_org').on(t.orgId),
    index('idx_lms_enrollment_user').on(t.userId),
  ]
);
```

**Apply it to the database.** Your module's tables are picked up by drizzle-kit through the schema globs in
your `drizzle.config.ts` (see [Plan 50](../plans/50-repository-open-core-strategy.md) — `./packages/*/src/schema.ts`).
Then:

```bash
pnpm db:push                                                # sync schema to Postgres (no migration files)
docker compose up -d --build --force-recreate api          # rebuild + REPLACE the running container
```

> **Tenancy is not optional.** Every table carries `orgId`, and every query you write filters on it (§5). A
> module that forgets this leaks data across tenants — the single worst bug in a multi-tenant platform.

---

## 5. Step 3 — Domain logic (ctx-first services)

Domain functions take an `AuthContext` as their **first argument** and are transport-agnostic — no `Request`,
no Hono, nothing HTTP. They stamp `orgId` on writes, scope every read by `orgId`, guard with `requireRole`,
and use the shared error taxonomy. This is the heart of the module.

`src/courses.ts`:

```ts
import { and, eq } from 'drizzle-orm';
import { db } from '@avkash/db';
import { type AuthContext, NotFoundError, ConflictError, mapDatabaseError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { lmsCourse } from './schema';
import { coursePublished } from './events';

export interface CreateCourseInput {
  title: string;
  slug: string;
  description?: string;
  mandatory?: boolean;
}

async function getCourseOrThrow(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(lmsCourse)
    .where(and(eq(lmsCourse.id, id), eq(lmsCourse.orgId, orgId)))
    .limit(1); // ← org-scoped read
  if (!row) throw new NotFoundError('LMS_COURSE_NOT_FOUND');
  return row;
}

export async function createCourse(ctx: AuthContext, input: CreateCourseInput) {
  requireRole(ctx, 'ADMIN');
  try {
    const [row] = await db
      .insert(lmsCourse)
      .values({
        orgId: ctx.orgId, // ← stamp the tenant
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        mandatory: input.mandatory ? 1 : 0,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
      })
      .returning();
    return row;
  } catch (e) {
    throw mapDatabaseError(e); // unique slug → ConflictError, etc. — never leak raw PG errors
  }
}

export async function listCourses(ctx: AuthContext) {
  return db.select().from(lmsCourse).where(eq(lmsCourse.orgId, ctx.orgId));
}

export async function publishCourse(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  const course = await getCourseOrThrow(ctx.orgId, id);
  if (course.status === 'PUBLISHED') throw new ConflictError('LMS_COURSE_ALREADY_PUBLISHED');
  const [updated] = await db
    .update(lmsCourse)
    .set({ status: 'PUBLISHED', dbVersion: course.dbVersion + 1, updatedAt: new Date(), updatedBy: ctx.userId })
    .where(eq(lmsCourse.id, id))
    .returning();
  await coursePublished.publish(ctx, { courseId: id, mandatory: course.mandatory === 1 }); // §6
  return updated;
}
```

`src/enrollments.ts` — note the optimistic-concurrency compare-and-swap pattern and the idempotent enroll:

```ts
import { and, eq } from 'drizzle-orm';
import { db } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError, mapDatabaseError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { lmsEnrollment } from './schema';
import { enrollmentCompleted } from './events';

export async function enrollUser(ctx: AuthContext, courseId: string, userId: string) {
  requireRole(ctx, 'MANAGER');
  try {
    const [row] = await db
      .insert(lmsEnrollment)
      .values({ orgId: ctx.orgId, courseId, userId, status: 'ENROLLED' })
      .onConflictDoNothing() // unique(courseId,userId) → enroll is idempotent
      .returning();
    return row;
  } catch (e) {
    throw mapDatabaseError(e);
  }
}

// The learner marks their own enrollment complete.
export async function completeCourse(ctx: AuthContext, courseId: string) {
  if (!ctx.userId) throw new ForbiddenError('FORBIDDEN');
  const [updated] = await db
    .update(lmsEnrollment)
    .set({ status: 'COMPLETED', completedAt: new Date() })
    .where(
      and(
        eq(lmsEnrollment.orgId, ctx.orgId),
        eq(lmsEnrollment.courseId, courseId),
        eq(lmsEnrollment.userId, ctx.userId)
      )
    )
    .returning();
  if (!updated) throw new NotFoundError('LMS_NOT_ENROLLED');
  await enrollmentCompleted.publish(ctx, { courseId, userId: ctx.userId }); // §6
  return updated;
}
```

---

## 6. Step 4 — React to the platform (events) **[Platform: Phase 1]**

This is what makes a module a first-class citizen: it **emits** events others can react to, and **subscribes**
to core events — _without core knowing the LMS exists_. Auto-enrolling every new hire into mandatory courses
is the canonical example: the LMS listens for `user.created`; `@avkash/users` never imports the LMS.

`src/events.ts`:

```ts
import { z } from 'zod';
import { defineEvent, subscribe } from '@avkash/events';
import { userCreated } from '@avkash/users/events'; // core event published by the users domain
import { db } from '@avkash/db';
import { and, eq } from 'drizzle-orm';
import { lmsCourse, lmsEnrollment } from './schema';

// --- Events this module EMITS (other modules / webhooks can subscribe) ---
export const coursePublished = defineEvent(
  'lms.course.published',
  z.object({ courseId: z.string(), mandatory: z.boolean() })
);
export const enrollmentCompleted = defineEvent(
  'lms.enrollment.completed',
  z.object({ courseId: z.string(), userId: z.string() })
);

// --- Events this module SUBSCRIBES to ---
// Registered by the manifest at boot; the registry only fires it for orgs that have the 'lms' entitlement.
export function registerSubscribers() {
  subscribe(userCreated, async (e) => {
    // Auto-enroll the new user into every mandatory course in their org.
    const mandatory = await db
      .select({ id: lmsCourse.id })
      .from(lmsCourse)
      .where(and(eq(lmsCourse.orgId, e.orgId), eq(lmsCourse.status, 'PUBLISHED'), eq(lmsCourse.mandatory, 1)));
    for (const c of mandatory) {
      await db
        .insert(lmsEnrollment)
        .values({ orgId: e.orgId, courseId: c.id, userId: e.payload.userId, status: 'ENROLLED' })
        .onConflictDoNothing(); // idempotent — events are at-least-once
    }
  });
}
```

> **Two rules for subscribers.** (1) **Be idempotent** — the outbox relay delivers _at least once_, so a
> handler may run twice; `onConflictDoNothing` and unique constraints make that safe. (2) **Use events for
> reactions, not reads.** If you just need to _look up_ a user's team, call `@avkash/users` directly — events
> are for side-effects, not queries. Over-eventing is an anti-pattern.
>
> **Interim (until Phase 1 lands):** there is no event bus yet, and domains call `@avkash/notifications`
> directly. Until `@avkash/events` exists, either (a) defer the cross-module reactions, or (b) have the core
> call point invoke your function explicitly — and plan to delete that wire once the bus arrives. Do **not**
> import the LMS from a core package; that's the coupling the bus removes.

---

## 7. Step 5 — Shape the response (DTO + serialize)

Never return raw rows — they carry internal columns (`orgId`, audit fields). Build a DTO from the table with
`createSelectSchema(...).omit(...)` and project through `serialize()` at the route.

`src/dto.ts`:

```ts
import { createSelectSchema } from 'drizzle-zod';
import { lmsCourse, lmsEnrollment } from './schema';

export const courseDto = createSelectSchema(lmsCourse).omit({ orgId: true, createdBy: true, updatedBy: true });
export const enrollmentDto = createSelectSchema(lmsEnrollment).omit({ orgId: true });
```

---

## 8. Step 6 — Expose HTTP (routes)

Routes are a **thin** Hono sub-router: validate → call the domain function with `c.get('auth')` → return
JSON. No business logic here. Use the shared `AppEnv`, `requireAuth`, `validateBody`/`validateQuery`,
`idempotency`, and the `etag`/`If-Match` helpers — exactly as core route files do.

`src/routes.ts`:

```ts
import { Hono } from 'hono';
import { z } from 'zod';
import { serialize, PreconditionRequiredError } from '@avkash/shared';
import { type AppEnv, requireAuth } from '@avkash/api/middleware/auth';
import { validateBody } from '@avkash/api/middleware/validate';
import { idempotency } from '@avkash/api/middleware/idempotency';
import { etag } from '@avkash/api/concurrency';
import { createCourse, listCourses, publishCourse } from './courses';
import { enrollUser, completeCourse } from './enrollments';
import { courseDto } from './dto';

const createSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  mandatory: z.boolean().optional(),
});

export const lmsRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/courses', idempotency, validateBody(createSchema), async (c) =>
    c.json({ data: serialize(courseDto, await createCourse(c.get('auth'), c.get('body'))) }, 201)
  )
  .get('/courses', async (c) =>
    c.json({ data: (await listCourses(c.get('auth'))).map((r) => serialize(courseDto, r)) })
  )
  .post('/courses/:id/publish', async (c) => {
    const row = await publishCourse(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(row.dbVersion));
    return c.json({ data: serialize(courseDto, row) });
  })
  .post('/courses/:id/enroll', validateBody(z.object({ userId: z.string() })), async (c) =>
    c.json({ data: await enrollUser(c.get('auth'), c.req.param('id'), c.get('body').userId) }, 201)
  )
  .post('/courses/:id/complete', async (c) => c.json({ data: await completeCourse(c.get('auth'), c.req.param('id')) }));
```

The registry mounts this under `/v1/lms` and wraps it in the entitlement guard (§11–12). The whole surface
is `POST /v1/lms/courses`, `GET /v1/lms/courses`, `POST /v1/lms/courses/:id/publish`, etc.

---

## 9. Step 7 — Messages & errors (i18n)

Every error code you throw (`LMS_COURSE_NOT_FOUND`, `LMS_NOT_ENROLLED`, …) needs a localized template. Keep
them in the module, namespaced by the `LMS_` prefix so they never collide with core or another module.

`src/i18n.ts`:

```ts
export const en = {
  LMS_COURSE_NOT_FOUND: 'Course not found.',
  LMS_COURSE_ALREADY_PUBLISHED: 'This course is already published.',
  LMS_NOT_ENROLLED: 'You are not enrolled in this course.',
};
export const hi = {
  LMS_COURSE_NOT_FOUND: 'कोर्स नहीं मिला।',
  LMS_COURSE_ALREADY_PUBLISHED: 'यह कोर्स पहले से प्रकाशित है।',
  LMS_NOT_ENROLLED: 'आप इस कोर्स में नामांकित नहीं हैं।',
};
```

The registry merges these into the i18n runtime at boot, so `mapDatabaseError` and the central error handler
localize your codes by `Accept-Language` automatically.

---

## 10. Step 8 — Background work (jobs) — _optional_

If the module needs scheduled work (e.g. a daily "mandatory course overdue" reminder), declare it as a job;
the manifest hands it to the BullMQ scheduler. Jobs iterate tenants and **must skip orgs without the
entitlement** (§11).

```ts
// src/jobs.ts
import { isModuleEnabled } from '@avkash/entitlements';
export const lmsJobs = [
  {
    name: 'lms.overdue-reminder',
    cron: '0 9 * * *', // 9am daily
    run: async (ctx /* system AuthContext per org */) => {
      if (!isModuleEnabled(ctx, 'lms')) return;
      // …find overdue mandatory enrollments, publish reminder events…
    },
  },
];
```

---

## 11. Step 9 — Gate it per tenant (entitlement) **[Platform: Phase 4]**

The module declares a single **entitlement key** (`'lms'`). The registry uses it to:

- wrap the routes in `requireEntitlement('lms')` → a tenant without it gets a clean `402`;
- skip the subscribers and jobs for orgs that don't have it.

An org is granted the module by a row in `org_entitlement` (`moduleKey = 'lms'`, `enabled = true`), set by the
provider admin or a billing webhook. New orgs default to off until enabled.

> **Interim (until Phase 4 lands):** there is no entitlement table yet. Until then a module is either built-in
> (available to all orgs in that binary) or not. Design with the key now (`entitlement: 'lms'` in the
> manifest); enforcement switches on when Phase 4 ships — no code change in your module.

---

## 12. Step 10 — Declare the manifest **[Platform: Phase 3]**

The manifest is the single object that ties the module together. (Exact interface lives in
[Plan 49](../plans/49-modular-core-platform.md) / `@avkash/registry`.)

`src/module.ts`:

```ts
import type { AvkashModule } from '@avkash/shared';
import { lmsRoutes } from './routes';
import { registerSubscribers } from './events';
import { lmsJobs } from './jobs';
import { en, hi } from './i18n';

export const lmsModule: AvkashModule = {
  key: 'lms',
  title: 'Learning Management',
  entitlement: 'lms', // null would mean "core, always on"
  dependsOn: ['users'], // validated at boot
  basePath: '/lms',
  routes: lmsRoutes,
  subscribers: registerSubscribers,
  jobs: lmsJobs,
  i18n: { en, hi },
};
```

`src/index.ts`:

```ts
export { lmsModule } from './module';
export * from './courses';
export * from './enrollments';
export * from './events'; // so other modules can subscribe to lms.* events
```

---

## 13. Step 11 — Register the module

Registration is **one line** — and _where_ you add it is the only difference between an open and a private
module (the three dials from [Plan 50](../plans/50-repository-open-core-strategy.md)):

**Open-core contribution** — add to the public module list and open a PR (sign the CLA):

```ts
// apps/api/src/modules.ts  (PUBLIC repo)
import { lmsModule } from '@avkash/lms';
export const OPEN_MODULES = [org, users, leave, attendance, holidays, policy, documents, lmsModule];
```

**Private / self-host module** — keep the package in your private superset and add it there; the public core
never changes:

```ts
// avkash-cloud/packages/modules-private/index.ts  (PRIVATE repo)
import { lmsModule } from '@avkash/lms';
export const PRIVATE_MODULES = [payroll, compliance, lmsModule];
```

> **Interim (until Phase 3 lands):** there is no `createApp(modules)` registry yet — routes are wired by hand
> in [`apps/api/src/app.ts`](../apps/api/src/app.ts). Until the registry ships, register your module the
> current way: `import { lmsRoutes } from '@avkash/lms'` and add `.route('/lms', lmsRoutes)` in `app.ts`, add
> your DTOs where the route reads them, and merge your i18n keys. When the registry lands, this collapses to
> the single array entry above and the manual wiring is deleted.

---

## 14. Step 12 — Test it

Test the **domain functions against a real Postgres** (Avkash tests don't mock the DB), using the shared
fixtures and `ctx` factories from [`apps/api/src/test/helpers.ts`](../apps/api/src/test/helpers.ts).

```ts
import { test, expect } from 'bun:test';
import { createMahalaxmiOrg, adminCtx, userCtx } from '@avkash/api/test/helpers';
import { createCourse, publishCourse } from '@avkash/lms';
import { completeCourse } from '@avkash/lms';

test('learner can complete a published course', async () => {
  const org = await createMahalaxmiOrg();
  const admin = adminCtx(org.orgId, org.ownerId);

  const course = await createCourse(admin, { title: 'Safety 101', slug: 'safety-101', mandatory: true });
  await publishCourse(admin, course.id);

  const learner = userCtx(org.orgId, org.someUserId);
  // …enroll, then complete…
  const done = await completeCourse(learner, course.id);
  expect(done.status).toBe('COMPLETED');
});
```

Run `pnpm typecheck` (authoritative for cross-package types) and `pnpm test`.

---

## 15. Composing module data into core views

A core screen — the **Employee Detail** page, owned by `users` — often needs to show data your module owns
(an employee's courses, payslips, documents). Core must **never** import your module to get it: in the
open-core model your module may live in a private repo (its tables aren't even in the public schema), and
core depending on a module inverts the layering. The dependency arrow stays **module → core**, always. So you
never reach _up_ from core into the module — you **compose**. Events (§6) are how a module _reacts_ to core
(write-side); this is the read-side twin — how a module _augments_ a core view.

**Anti-patterns** (all break the boundary): core importing `@avkash/lms`; a DB join from the core employee
query into `LmsEnrollment`; the LMS writing a `courses` column onto the core `user` table.

### Option A — Client-side composition (works today)

The Employee Detail screen makes two calls and stitches them:

1. `GET /v1/employees/:id` — core employee data.
2. `GET /v1/lms/enrollments?userId=:id` — your module's own user-scoped endpoint.

Two requirements:

- **Expose a user-scoped read with the standard authz.** Mirror the policy module's precedent
  (`pendingAcknowledgements(ctx, userId)` → `if (targetUserId !== ctx.userId) requireRole(ctx, 'ADMIN')`):
  an employee sees their own courses; a manager/ADMIN sees anyone's.

  ```ts
  // src/enrollments.ts
  export async function listEnrollmentsForUser(ctx: AuthContext, userId: string) {
    if (userId !== ctx.userId) requireRole(ctx, 'ADMIN');
    return db
      .select()
      .from(lmsEnrollment)
      .where(and(eq(lmsEnrollment.orgId, ctx.orgId), eq(lmsEnrollment.userId, userId)));
  }
  ```

- **Render the section only when the `lms` entitlement is on** for the org — otherwise the call 402s. Core
  already exposes the org's enabled modules; check it before fetching.

Because `AppType` is composed from every registered module, the web client gets **type-safe** calls to both
`employees` and `lms` from one client. No new platform code — just the read endpoint. This is the recommended
default.

### Option B — Server-side contributor registry **[Platform: Phase 3]**

When you want a single composed payload and a uniform "profile has pluggable sections" model, register a
read-side contributor in your manifest (the symmetric twin of `subscribers`; see
[Plan 49](../plans/49-modular-core-platform.md)):

```ts
// in module.ts
profileContributors: [{
  key: 'lms',
  label: 'Courses',
  load: (ctx, employeeId) => listEnrollmentsForUser(ctx, employeeId),
}],
```

A core aggregator (`GET /v1/employees/:id?include=profile`) fans out to the contributors of **enabled**
modules and merges:

```
{ employee: {…}, sections: { lms: { courses: [...] }, payroll: {...}, documents: {...} } }
```

Core depends only on the contributor _interface_ (in `shared`), never on your module. Build the extension
point once and every future module — payroll, documents, performance — attaches to the same employee profile
for free.

> **Rule of thumb:** core publishes a stable employee identity + extension surface; modules **attach** to it.
> Core stays oblivious to what's attached — which is exactly why your new module can appear on the employee
> page without core changing a line.

---

## 16. The module contract — rules & constraints

**Must:**

- Take `AuthContext` as the first arg of every domain function; stamp `orgId` on writes; filter every read by
  `ctx.orgId`.
- Guard mutations with `requireRole` / `requireScope`; carry a `dbVersion` on mutable resources and CAS on it.
- Throw `DomainError` subclasses (`NotFoundError`, `ConflictError`, …) and wrap DB calls in `mapDatabaseError`.
- Own its tables, DTOs, error codes (namespaced), routes, jobs, and entitlement key.
- Make event subscribers **idempotent** (delivery is at-least-once).

**Must not:**

- Be imported by any core package (`shared`, `db`, `auth`, `org`, `users`, the platform packages).
- Import another module's _internal files_, or read/write tables it doesn't own. Talk to other modules via
  their exported functions (for reads) or **events** (for reactions).
- Return raw rows, hand-parse request bodies, or branch authorization on `ctx.via`.
- Reach into `@avkash/db` for core tables to _mutate_ them — call the owning domain instead.

---

## 17. Checklist (definition of done)

- [ ] Package scaffolded; `pnpm typecheck` green across the workspace.
- [ ] Tables carry `orgId` + `dbVersion` + audit columns + an `orgId` index; `pnpm db:push` applied.
- [ ] Every read is org-scoped; every write stamps `orgId`. (Grep your queries for `orgId`.)
- [ ] Mutations guarded by role; PATCH paths use `If-Match` + version CAS.
- [ ] DTOs omit internal columns; routes return via `serialize`.
- [ ] Error codes added to `en` **and** `hi`, namespaced by the module prefix.
- [ ] Events emitted are documented; subscribers are idempotent.
- [ ] Entitlement key declared in the manifest.
- [ ] Registered in exactly one module list (open or private) — **no other core file changed**.
- [ ] Scenario test against a real DB passes.

---

## 18. Reference

**Core packages a module may import:** `@avkash/shared` (errors, `AuthContext`, `serialize`,
`mapDatabaseError`), `@avkash/db` (`db`, core tables via `schema`), `@avkash/auth` (`requireRole`, guards),
`@avkash/i18n`, `@avkash/events`, `@avkash/entitlements`, and core domains `@avkash/users` / `@avkash/org`
for reads.

**Core events to subscribe to** (catalog grows as the bus rolls out — see
[Plan 49](../plans/49-modular-core-platform.md)): `user.created`, `user.offboarded`, `org.created`,
`leave.request.approved`, `attendance.punch.recorded`. Subscribe to react; never to poll.

**Related plans:** [49 — modular core platform](../plans/49-modular-core-platform.md) (the runtime seams),
[50 — repository & open-core strategy](../plans/50-repository-open-core-strategy.md) (open vs private, the
`createApp` factory, schema ownership).
