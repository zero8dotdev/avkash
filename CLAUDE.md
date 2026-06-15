# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Avkash is an open-source HR management platform (leave, attendance, people, org, policy) with Slack integration. This branch is **Avkash v2** — a Bun + Hono + Drizzle backend in a Turborepo + pnpm monorepo. (Avkash v1 — Next.js 15 + Supabase + Ant Design — lives on `main`; do not bring its patterns here.)

**Stack:** Bun (API runtime), Hono (HTTP), Drizzle ORM, Better Auth, PostgreSQL 16, Zod 4. Turborepo + pnpm workspaces. The `apps/web` Next.js app is currently a stub.

## Commands

All orchestrated by Turbo from the repo root:

```bash
pnpm dev          # turbo run dev   — API hot-reloads via `bun run --watch`
pnpm build        # turbo run build
pnpm typecheck    # turbo run typecheck — AUTHORITATIVE for cross-package types
pnpm lint         # turbo run lint  — ESLint 9 flat config
pnpm format       # prettier --check .   (format:fix to write)
pnpm db:push      # drizzle-kit push — sync schema to the DB (no migration files)
pnpm db:studio    # drizzle-kit studio
pnpm knip         # dead-code / unused-dep analysis
```

Local stack runs in Docker (Postgres + API + web):

```bash
docker compose up -d --build --force-recreate api   # rebuild + REPLACE the api container
docker compose ps                                   # status / health
docker compose logs -f api
```

`--force-recreate` is essential — `--build` alone rebuilds the image but does **not** replace a running container, so code changes silently don't take effect.

> **Type errors:** trust `pnpm typecheck` (or `turbo run typecheck`), not the editor. The editor's LSP frequently shows stale "Cannot find module '@avkash/…'" for the just-in-time packages; Turbo's run is the source of truth.

## Monorepo Layout

- `apps/api` — the Bun + Hono HTTP server. The only place transports (HTTP, Slack SDK) are wired.
- `apps/web` — Next.js app (stub for now).
- `packages/*` — the domain and foundation libraries.

**Just-in-time packages:** every package exports `./src/index.ts` directly (`"exports"` / `"main"` point at source) and extends `@avkash/tsconfig/base.json` — there is **no build step**. Import across packages via `@avkash/<name>`; never reach into another package's internal files.

### Dependency layering (enforced by convention — keep it)

Packages form a strict graph. A package may only import from layers below it:

1. **Foundation** (zero internal deps): `shared` (enums, errors, `AuthContext`, primitives), `config` (Zod-validated env, fails fast at boot), `db` (Drizzle schema — the single source of schema truth — client, `db:push`), `i18n` (message/error catalogs + locale), `emails` (React Email templates → `renderEmail`; preview via `pnpm email:dev`), `tsconfig`, `eslint-config`.
2. **Identity:** `auth` — Better Auth + API keys; authN resolvers (one per transport) and authz guards.
3. **Domain:** `org` (the Organisation tenant + lifecycle + invitations), `users` (people, teams, roles, profiles), `leave`, `attendance`, `holidays`, `policy`, `documents`. Domains own their tables and business rules.
4. **Orchestration** (top of graph): `jobs` (BullMQ workers), `payroll`, `notifications`, `slack`. These reach **through** domain packages, **never** into `db` directly.

When adding code, put it at the right layer. If an orchestration package wants to touch the database, route it through the owning domain instead.

## API Conventions (`apps/api`)

`app.ts` is the wiring layer: each route group is thin (parse request → call a domain function with `ctx` → return JSON). Domain logic lives in `packages/*`, never in routes. The exported `AppType` is the type-safe contract the web client consumes (no codegen).

- **Auth context:** handlers receive an `AuthContext` (`orgId`, `userId`, `role`); guard with `requireRole(ctx, 'MANAGER')` etc. Domain functions are `ctx`-first.
- **Errors:** code-first `DomainError` taxonomy (`packages/shared/src/errors.ts`). One envelope: `{ error: { code, message, details, requestId } }`. Messages localize by `Accept-Language` via `@avkash/i18n`; `mapDatabaseError` translates DB constraint violations. Internals are hidden unless `EXPOSE_ERRORS`/non-prod.
- **Request validation:** Zod 4 via `validateBody` / `validateQuery` middleware (`middleware/validate.ts`) — read parsed data with `c.get('body')` / `c.get('query')`. Don't hand-parse `c.req.json()`.
- **Response DTOs:** `dto.ts` builds DTOs from `createSelectSchema(table).omit({...})` (drizzle-zod) to drop internal columns (`orgId`, audit fields). Return via `serialize(dto, data)` — never dump raw rows.
- **Optimistic concurrency:** mutable resources carry a `version` column. GET returns an `ETag`; PATCH **requires** `If-Match` (428 `PreconditionRequiredError` if missing, 412 `PreconditionFailedError` if stale). Helpers in `concurrency.ts`; the UPDATE does a CAS on `version`.
- **Idempotency:** unsafe creates accept an `Idempotency-Key`; the `idempotency` middleware + `IdempotencyKey` table fingerprint the request and replay the cached response on retry.
- **Cross-cutting middleware:** `request-id`, `locale`, CORS, `internal-auth` (token-guarded `/internal`). Health: `/health` (liveness), `/health/ready` (readiness, DB ping with timeout).
- **Inherit-by-null cascades:** settings resolve down a chain, where `null` means "inherit" (e.g. workweek user → team → default; holiday location team → org). Mirror this when adding configurable fields.

## Database

Drizzle ORM. Schema is defined entirely in `packages/db/src/schema/` (one file per area, re-exported from `index.ts`) and is the single source of truth. **No migration files** — `pnpm db:push` (`drizzle-kit push`) syncs the schema to Postgres directly. After changing schema, run `db:push`, then rebuild the API container with `--force-recreate`.

Key enums live in `@avkash/shared` / `packages/db/src/schema/enums.ts` (e.g. `Role`: OWNER, MANAGER, USER, ANON, ADMIN; leave status; attendance punch type/source).

## Linting & Formatting

- **ESLint 9 flat config.** Rules live in `@avkash/eslint-config` (typescript-eslint recommended + node globals, `eslint-config-prettier` last so Prettier owns formatting). The root `eslint.config.js` is resolved from every package dir, so all `eslint .` runs and the editor share one config. `no-explicit-any` / `no-unused-vars` are warnings.
- **Prettier** owns formatting (`.prettierrc.json`, width 120). `.zed/settings.json` enables format-on-save. Keep eslint and prettier non-overlapping — never re-add a `prettier/prettier` eslint rule.

## Commit Conventions

Conventional Commits, validated by `commitlint.config.ts`. Format: `type(scope): message`.

- **Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- **Scopes:** setup, config, deps, feature, bug, docs, style, refactor, test, build, ci, release, other

Git hooks are not currently wired (husky was removed with v1). Until they're re-added, commits use `--no-verify`; keep messages convention-compliant by hand.

## Node / Bun

- API runtime: **Bun**. Tooling requires **Node >= 20**.
- `@/*`-style path aliases are a v1 concept and do not exist here — use `@avkash/*` workspace imports.
