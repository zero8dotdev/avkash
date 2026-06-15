# Avkash

Open-source HR platform. REST API that covers leave, attendance, people, org structure, and policy — self-hostable, no UI included.

The UI and paid modules (payroll, compliance) ship in [Avkash Cloud](https://github.com/zero8dotdev/avkash-cloud), a private superset that embeds this repo as a dependency.

---

## What it does

- **Leave** — requests, approvals, accruals, comp-off, encashments, delegations, blackout periods
- **Attendance** — device-based punch, shift management, workweek patterns, OT/gap detection
- **People** — employee directory, teams, departments, business units, org levels, transfers
- **Policy** — leave policies, level restrictions, holiday calendars, location-aware rules
- **Field access control** — per-field visibility and write gates via OpenFGA (who sees what on whose profile)
- **Notifications** — email (Resend) and SMS (MSG91) with a console fallback for local dev
- **Slack** — login and (optionally) leave notifications via Slack

Everything is multi-tenant. Every query is scoped to an `orgId`; there is no cross-tenant data leakage by construction.

---

## What it is not

- There is no bundled UI. The API is the product.
- There is no SaaS offering from this repo. If you want managed hosting, that is Avkash Cloud.
- Payroll, compliance, and performance modules are not here. They are private.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| HTTP | Hono |
| ORM | Drizzle + PostgreSQL 16 |
| Auth | Better Auth (email/password + Slack OAuth + API keys) |
| AuthZ | OpenFGA (relationship-based, field-level) |
| Background jobs | BullMQ + Redis |
| Tooling | Turborepo + pnpm workspaces |

---

## Self-hosting

**Prerequisites:** Docker, a Postgres 16 instance (or use the compose stack), Redis.

```bash
git clone https://github.com/zero8dotdev/avkash.git
cd avkash
cp .env.example .env   # fill in DATABASE_URL, BETTER_AUTH_SECRET at minimum
docker compose up -d
```

The compose file starts Postgres, Redis, OpenFGA, the API server on `:3001`, and the background worker. The API is ready when `/health/ready` returns `{"status":"ready"}`.

For production use, point `DATABASE_URL` and `REDIS_URL` at your own infrastructure and run only the `api` and `worker` services.

### Schema

```bash
pnpm db:push   # drizzle-kit push — no migration files, syncs schema directly
```

There are no versioned migration files. `db:push` syncs the schema to the database. Switch to `drizzle-kit generate` + `migrate` before you have production data you cannot push over.

### Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | — | Postgres connection string |
| `BETTER_AUTH_SECRET` | yes | — | ≥32 random bytes |
| `REDIS_URL` | yes (worker) | `redis://localhost:6379` | BullMQ broker |
| `FGA_API_URL` | yes | `http://localhost:8080` | OpenFGA HTTP endpoint |
| `FGA_STORE_ID` | yes | — | Created on first boot |
| `FGA_MODEL_ID` | yes | — | Auth model ID |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Comma-separated allowed origins |
| `PORT` | no | `3001` | API listen port |
| `RESEND_API_KEY` | no | — | Email delivery (console fallback if blank) |
| `MSG91_AUTH_KEY` | no | — | SMS delivery (silent if blank) |
| `SLACK_CLIENT_ID` | no | — | Slack OAuth login |
| `SLACK_CLIENT_SECRET` | no | — | Slack OAuth login |
| `INTERNAL_API_TOKEN` | no | `dev-cron-token` | Guards `/internal` scheduler endpoints |

---

## Development

```bash
pnpm install
pnpm dev        # starts api + worker via Turbo
pnpm typecheck  # authoritative — trust this over the editor LSP
pnpm lint
pnpm test
```

The API hot-reloads via `bun --watch`. To rebuild the Docker container after a schema change:

```bash
pnpm db:push
docker compose up -d --build --force-recreate api
```

`--force-recreate` is required. `--build` alone rebuilds the image but does not replace the running container.

### Monorepo layout

```
apps/
  api/      Hono server — thin wiring layer, no business logic
  worker/   BullMQ scheduler + maintenance jobs
packages/
  shared/   AuthContext, DomainError taxonomy, primitives
  config/   Zod-validated env, fails fast at boot
  db/       Drizzle schema (single source of truth), client
  auth/     Better Auth + API keys
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
  notifications/ Email + SMS dispatch
  slack/    Slack SDK wiring
  events/   In-process event bus (domain → subscribers)
  i18n/     Message catalog, error translation
  emails/   React Email templates
```

Packages are just-in-time — no build step, no publish. Everything imports via `@avkash/<name>` workspace aliases.

---

## API

Base URL: `http://localhost:3001`

Auth: send a `Better-Auth-Session` cookie (obtained from `POST /api/auth/sign-in`) or an `Authorization: Bearer <api-key>` header.

A few representative endpoints:

```
GET    /health/ready
POST   /api/auth/sign-in/email
GET    /leaves
POST   /leaves
PATCH  /leaves/:id
GET    /attendance
POST   /attendance/punch
GET    /employees
GET    /me
GET    /balances
GET    /reports
```

There is no OpenAPI spec yet. The Hono `AppType` export in `apps/api/src/app.ts` is the type-safe contract — consume it from a TypeScript client with `hc<AppType>()`.

---

## Status

This is an active v2 rewrite. The API is functional and covers all core HR domains. What is not done yet:

- **No OpenAPI spec** — the TypeScript client type is the contract for now
- **No route-level test suite** — unit tests exist for domain logic; route tests are sparse
- **Module registry** — the `createApp(modules)` factory (Plan 49) is not built; routes are wired directly in `app.ts`

---

## License

Avkash core is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE).

Commercial license exceptions are available for enterprises that cannot adopt AGPL terms.

---

## Contributing

Contributions are welcome. By contributing, you agree that your contribution is licensed under the project license and that a signed [CLA](CLA.md) may be required before merge. Open an issue to discuss before sending a pull request for anything non-trivial.
