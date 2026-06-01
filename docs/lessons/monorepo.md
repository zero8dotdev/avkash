# Monorepo — Refresher Course

> A learning doc, not a spec. Built around the Avkash HRMS API design (Bun + Hono +
> Drizzle + Better Auth in a Turborepo). Read it to re-learn how a monorepo works and
> *why* each decision is made. The architecture itself lives in `plans/03-technical-architecture.md`.

---

## The one idea

**The dependency graph is the architecture.**

Everything else in this doc is a consequence of that sentence. In a monorepo, the
relationships between packages are written down in `package.json` files, enforced by the
compiler, and turned into a build pipeline by the task runner. You don't document the
architecture separately — you can't, because the graph is the only version that breaks
the build when it's wrong.

Read a dependency list as a **set of claims about the domain**, not as configuration:

```
payroll → users, leave, attendance      "payroll is what happens when you combine
                                          who's employed, who was present, who was on leave"
slack   → leave, users  (not db)         "the integration orchestrates domain logic;
                                          it does not reach into tables"
web     → shared        (only)           "the frontend cannot import a database query,
                                          even by accident"
```

Each arrow is a design decision you make once. The build system remembers it forever.

---

## Layers: how to read the graph

Sort every package by how many internal dependencies it has. That sort *is* your
architecture's layers.

| Layer | Has dependencies on… | Avkash packages | What it means |
|-------|----------------------|-----------------|---------------|
| **0 — Foundations** | nothing internal | `shared`, `db`, `config`, `tsconfig`, `eslint-config` | Primitives everyone builds on |
| **1 — Identity** | foundations | `auth` | "Who is calling" — needed before any domain logic |
| **2 — Domains** | foundations + `auth` | `users`, `leave`, `attendance`, `policy`, `documents` | Business logic, one bounded context each |
| **3 — Orchestration** | other domains (not `db`) | `payroll`, `slack`, `notifications`, `jobs` | Combine domains; never reach past them into data |
| **4 — Apps** | everything they wire | `apps/api`, `apps/web` | Transport + UI. Apps wire; packages think. |

Rules of thumb that fall out of the table:
- **Foundations have zero internal deps.** If `shared` ever imports `leave`, the foundation is no longer a foundation.
- **Domains reach *down*, never *sideways into data*.** `payroll` calls `leave`'s functions; it does not query the `leave` table itself.
- **Apps are the only place a framework appears.** `Hono` and `Next.js` imports live in `apps/`. A domain package importing `Hono` is the same smell as a UI package importing a payroll calculation.

---

## The Avkash graph (reference)

```
apps/
  api/   → auth, users, leave, attendance, payroll, policy,
            documents, slack, jobs, db, shared
  web/   → shared                                 (types only — CANNOT import db)

packages/
  # Layer 0 — foundations
  shared/         → (nothing)   enums, errors, AuthContext, Zod primitives, dates
  db/             → shared       Drizzle schema (ALL tables) + client + migrations
  config/         → shared       Zod-validated env
  tsconfig/       → (nothing)    shared TS bases
  eslint-config/  → (nothing)    shared lint rules

  # Layer 1 — identity
  auth/           → db, shared, config

  # Layer 2 — domains
  users/          → db, shared, auth
  leave/          → db, shared, auth
  attendance/     → db, shared, auth
  policy/         → db, shared, auth
  documents/      → db, shared, auth

  # Layer 3 — orchestration
  payroll/        → users, leave, attendance, shared   (no db!)
  notifications/  → config, shared
  slack/          → users, leave, auth, shared          (no db!)
  jobs/           → payroll, notifications, documents, shared
```

---

## Concepts, one at a time

### 1. Workspaces

A monorepo is many packages in one repo, linked by a **workspace protocol** so they import
each other by name without publishing to npm. With pnpm:

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```jsonc
// packages/leave/package.json
{
  "name": "@avkash/leave",
  "dependencies": {
    "@avkash/db": "workspace:*",      // ← resolves to the local package, not npm
    "@avkash/shared": "workspace:*",
    "@avkash/auth": "workspace:*"
  }
}
```

`workspace:*` means "use whatever version is in this repo." The package list in
`dependencies` is the architecture diagram — adding a line there is a structural decision.

### 2. Internal packages — just-in-time TypeScript

You do **not** have to compile every package to `dist/` before consuming it. The simplest
setup for a solo/small team is the "internal package" / "just-in-time" pattern: packages
export raw `.ts` and the consuming app's bundler (Next.js, Bun) compiles them.

```jsonc
// packages/leave/package.json
{
  "name": "@avkash/leave",
  "exports": { ".": "./src/index.ts" },   // point straight at source
  "scripts": { "typecheck": "tsc --noEmit", "lint": "eslint ." }
}
```

This removes a whole class of "did I rebuild the package?" bugs. You add a real `build`
step (e.g. `tsup`) only when a package is consumed by something that can't compile TS
itself (a published SDK, a Node service without a bundler).

### 3. The build pipeline you don't write

The entire Turborepo config is short because the pipeline is *derived* from the graph:

```jsonc
// turbo.json
{
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "dev":       { "cache": false, "persistent": true },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "lint":      { "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "db:generate": { "cache": false },     // side effect — not cacheable
    "db:migrate":  { "cache": false }
  }
}
```

The load-bearing line is `"dependsOn": ["^build"]`. The `^` means **"build my dependencies
first."** Turborepo reads the same graph you declared in `package.json` files and derives
the execution order:

1. `shared`, `db`, `config`, `tsconfig` build first (no internal deps).
2. `auth`, then all the domains, build next.
3. `payroll`, `slack`, `jobs` build last (they wait on the domains).

You never wrote that order. The graph wrote it. `turbo run build test typecheck` is your
entire CI.

### 4. Caching and `--filter`

Turborepo hashes each task's inputs. Same inputs → cached output, printed as `FULL TURBO`
(0ms). Change one line in `shared` and only `shared` + its dependents rebuild; everything
else is cached.

- `turbo run build --filter=@avkash/api` — build just the API and what it needs.
- `turbo run build --filter=...[origin/main]` — build only packages affected by your diff.
- `turbo run build --graph` — print the actual DAG. Run this often; it's your live architecture diagram.

Caveat: tasks must be **deterministic** (same inputs → same outputs) to cache safely.
Side-effecting tasks (schema/migration generation) opt out with `"cache": false`.

### 5. Shared tooling as packages

`tsconfig` and `eslint-config` are real packages with zero dependencies. Every other
package extends them:

```jsonc
// packages/leave/tsconfig.json
{ "extends": "@avkash/tsconfig/base.json", "include": ["src"] }
```

Change a compiler or lint rule once; it propagates to every consumer on the next run.
Config is code, and code belongs in a package.

### 6. The boundary that can't be crossed

This is the payoff for the "internal API" design. `apps/web` depends on `@avkash/shared`
and **nothing else**:

```jsonc
// apps/web/package.json
{ "dependencies": { "@avkash/shared": "workspace:*", "next": "...", "react": "..." } }
```

There is no `@avkash/db` in that list, so the frontend literally **cannot** `import { db }`
or call a domain function directly — the module isn't resolvable. The client/server split
that a single Next.js repo lets you erode silently is now structural. The web app talks to
the API over HTTP, like any other client would.

### 7. Types are the contract

In a polyrepo, services talk over HTTP and you keep them honest with contract tests or an
OpenAPI spec. In a TypeScript monorepo, **the contract is an import**. If `leave` changes
the shape of a leave record, every consumer — including the API routes and the web client
— gets a type error at build time. On your laptop, before you push. Not in staging.

Hono makes this end-to-end: `apps/api` exports its route type, and `apps/web` consumes a
fully typed client with no codegen step:

```ts
// apps/api/src/app.ts
export type AppType = typeof app

// apps/web/src/lib/api.ts
import type { AppType } from '@avkash/api'
import { hc } from 'hono/client'
export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!)
```

---

## The thinking tool

The real value isn't the build speed. It's that the monorepo **forces an architectural
decision at every change**. When you reach for a dependency, you have to add it to a
`package.json`, which shows up in the diff, which makes you ask: *should this package
really depend on that one?*

Worked example: adding a feature to `jobs`, you reach for `@avkash/payroll`'s internals.
Easy — add the dep, import, done. But that would make `jobs → payroll → users, leave,
attendance` pull half the system into the queue. So you stop, lift the one primitive you
needed into `shared`, and `jobs` stays thin. In a single-folder repo that import would
have been invisible and the architecture would have quietly degraded. The monorepo made
the cost *visible* — as a structural change, not a code-review comment.

That's the whole point: **the monorepo refuses to let you stop thinking.**

---

## Honest downsides

- **Everything breaks together.** Rename a type in `shared` and you get 40 errors across
  12 packages. This is correct — you *want* to know what broke — but a wall of red for a
  one-field rename feels violent. The cascade is the graph working as designed.
- **Build output is noisy.** 15 packages print 15 headers, most saying `FULL TURBO`.
  `--filter` helps; the default is chatty.
- **Side-effecting tasks don't cache.** Schema/migration generation runs every time. A few
  seconds solo; it adds up for a large team in CI.
- **Frictionless imports tempt you.** Workspace imports are so easy it's easy to add a
  dependency you shouldn't. The graph makes the cost visible but doesn't stop you. You
  still have to say no to yourself.

---

## When this stops working

This setup (Turborepo, `workspace:*`, just-in-time packages, one person or a few) is great
up to roughly a small team. Past ~50 engineers the concern shifts from *"what depends on
what"* to *"who is allowed to change what"* — you'll want `CODEOWNERS`, affected-package CI
filters, and possibly Nx or Bazel.

But the graph tells you *when* to split. If `payroll` grows into its own team's surface,
its dependency list already names exactly which interfaces it consumes and exposes — the
extraction boundary is drawn. And each package is a natural onboarding scope: "you own
`leave` and `attendance`; here are their deps; here's what depends on them; don't break
those interfaces." That's a five-minute conversation pointing at `package.json`, not a
walk through a stale wiki.

---

## Drills (do these — they're how it sticks)

Each is a 2-minute experiment that teaches more than re-reading the section above. The
lesson is in watching the system reject you.

1. **The cascade.** Rename `AuthContext.orgId` → `tenantId` in `shared`. Run `turbo run
   typecheck`. Watch the red spread across every consumer. *Lesson: types are the contract.*
2. **The forbidden dep.** Add `@avkash/db` to `apps/web/package.json` and try to
   `import { db }`. *Lesson: boundaries are structural, not disciplinary.*
3. **The cache.** Edit one line in `shared`, run `turbo run build`, note what rebuilds vs.
   `FULL TURBO`. Then run again with no change — all cached. *Lesson: inputs determine work.*
4. **The derived order.** Run `turbo run build --graph` and read the build order out loud.
   You never wrote it. *Lesson: the graph is the pipeline.*
5. **The temptation.** Next time you reach for a cross-layer import, stop and ask where the
   primitive really belongs. Lift it into `shared` instead. *Lesson: the thinking tool.*

---

## See also

- `plans/03-technical-architecture.md` — the full stack and package structure.
- `plans/09-migration-supabase.md` — the step-by-step migration this monorepo enables.
- `docs/lessons/` — companion lessons (add `api-design.md` next).
</content>
</invoke>
