# Avkash Architecture README

This document describes the technical shape of the Avkash open core: stack, workspace layout, package boundaries, and current status. For setup commands, see the [Technical README](technical-readme.md).

---

## Stack

| Layer           | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Runtime         | Bun                                                          |
| HTTP            | Hono                                                         |
| ORM             | Drizzle + PostgreSQL 16                                      |
| Auth            | Better Auth with email/password, Slack OAuth, and API keys   |
| AuthZ           | OpenFGA for relationship-based and field-level authorisation |
| Background jobs | BullMQ + Redis                                               |
| Tooling         | Turborepo + pnpm workspaces                                  |

---

## Monorepo Layout

```text
apps/
  api/      Hono server; thin wiring layer, no business logic
  worker/   BullMQ scheduler and maintenance jobs
packages/
  shared/   AuthContext, DomainError taxonomy, primitives
  config/   Zod-validated env, fails fast at boot
  db/       Drizzle schema, client, database error mapping
  auth/     Better Auth and API keys
  authz/    OpenFGA client, model bootstrap, health
  authz-sync/ Writes FGA tuples from domain events
  org/      Organisation lifecycle, invitations
  users/    People, teams, roles, profiles
  leave/    Leave requests, balances, policies, accruals
  attendance/ Punches, shifts, devices, workweek
  holidays/ Holiday calendars
  policy/   Policy rules, level restrictions
  documents/ Document storage
  field-policy/ Per-field visibility and write gates
  jobs/     BullMQ queues and schedule definitions
  notifications/ Email and SMS dispatch
  slack/    Slack SDK wiring
  events/   In-process event bus
  i18n/     Message catalog, error translation
  emails/   React Email templates
```

Packages are just-in-time: no publish step and no package build step for local development. Everything imports through `@avkash/<name>` workspace aliases.

---

## Open-Core Boundary

The public repository contains the HR foundation: platform packages, identity, authorisation, organisation, people, leave, attendance, holidays, policy, documents, notifications, Slack, jobs, and event infrastructure.

Private modules live outside this repository. Payroll, statutory compliance, performance, recruitment, analytics, billing, provider administration, and the hosted UI are composed in Avkash Cloud.

The public `avkash` repository is the API-only open core. Private modules (payroll, UI, hosted services) are composed in a separate private repository that depends on this one as a submodule.

The module system is two-way: core emits domain facts, while modules contribute routes, jobs, subscribers, permissions, fields, schema, and policy surfaces back into the app. See [Pluggable Data Flow](pluggable-data-flow.md).

---

## Current Status

This is an active v2 rewrite. The API is functional across the core HR domains, but the project is still pre-1.0.

Known gaps:

- **No bundled UI** - this repository is the public API core
- **No OpenAPI spec** - the TypeScript client type is the contract for now
- **Route test coverage is still growing** - domain unit tests exist, but route tests are sparse
- **Database migrations are not versioned yet** - use `db:push` during development and move to generated migrations before production data
