# Avkash Technical README

This document covers the practical details for running and developing the Avkash open core. For the product story and open-core positioning, start with the root [README](../README.md).

---

## Self-Hosting

**Prerequisites:** Docker, Postgres 16, Redis.

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
pnpm db:push   # drizzle-kit push; no migration files yet
```

There are no versioned migration files yet. `db:push` syncs the schema to the database. Switch to `drizzle-kit generate` plus `migrate` before you have production data you cannot push over.

### Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | - | Postgres connection string |
| `BETTER_AUTH_SECRET` | yes | - | At least 32 random bytes |
| `REDIS_URL` | yes, for worker | `redis://localhost:6379` | BullMQ broker |
| `FGA_API_URL` | yes | `http://localhost:8080` | OpenFGA HTTP endpoint |
| `FGA_STORE_ID` | yes | - | Created on first boot |
| `FGA_MODEL_ID` | yes | - | Auth model ID |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Comma-separated allowed origins |
| `PORT` | no | `3001` | API listen port |
| `RESEND_API_KEY` | no | - | Email delivery; console fallback if blank |
| `MSG91_AUTH_KEY` | no | - | SMS delivery; silent if blank |
| `SLACK_CLIENT_ID` | no | - | Slack OAuth login |
| `SLACK_CLIENT_SECRET` | no | - | Slack OAuth login |
| `INTERNAL_API_TOKEN` | no | `dev-cron-token` | Guards `/internal` scheduler endpoints |

---

## Development

```bash
pnpm install
pnpm dev        # starts api and worker via Turbo
pnpm typecheck  # authoritative; trust this over the editor LSP
pnpm lint
pnpm test
```

The API hot-reloads via `bun --watch`. To rebuild the Docker container after a schema change:

```bash
pnpm db:push
docker compose up -d --build --force-recreate api
```

`--force-recreate` is required. `--build` alone rebuilds the image but does not replace the running container.

---

## API

Base URL: `http://localhost:3001`

Auth: send a `Better-Auth-Session` cookie from `POST /api/auth/sign-in` or an `Authorization: Bearer <api-key>` header.

Representative endpoints:

```text
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

There is no OpenAPI spec yet. The Hono `AppType` export in `apps/api/src/app.ts` is the type-safe contract. Consume it from a TypeScript client with `hc<AppType>()`.

