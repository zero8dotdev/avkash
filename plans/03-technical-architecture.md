# 03 — Technical Architecture

## Decision Summary

| Layer          | Choice                       | Rationale                                               |
| -------------- | ---------------------------- | ------------------------------------------------------- |
| Frontend       | Next.js 15 (App Router)      | Keep — solid, React 19, SSR                             |
| Backend API    | Bun + Hono                   | Fast, TypeScript-native, runs on Bun                    |
| Database       | PostgreSQL 16                | Keep — all SQL is portable, no changes needed           |
| ORM            | Drizzle ORM                  | Type-safe, Bun-compatible, lighter than Prisma          |
| Auth           | Better Auth                  | Bun-native, plugins for Slack/Google OAuth, magic links |
| File Storage   | Cloudflare R2                | S3-compatible, cheap egress, free tier is large         |
| Email          | Resend                       | Modern API, developer-friendly, good deliverability     |
| SMS / WhatsApp | MSG91                        | Indian provider, good rates, WhatsApp Business API      |
| Queue / Jobs   | BullMQ + Redis               | Payroll runs, document generation, notifications        |
| Cache          | Redis (Upstash for cloud)    | Session cache, rate limiting, queue                     |
| Search         | PostgreSQL FTS → Meilisearch | Start simple, upgrade when needed                       |
| CDN            | Cloudflare                   | Free tier covers most traffic                           |
| Monitoring     | Sentry + OpenTelemetry       | Error tracking + distributed tracing                    |
| Logging        | Pino → Loki + Grafana        | Structured logs, self-hostable stack                    |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Clients                             │
│  Browser (Next.js)  │  WhatsApp Bot  │  Mobile (future) │
└────────┬────────────┴───────┬────────┴─────────┬────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js 15 (App Router)                    │
│  Server Components │ API Routes │ Server Actions        │
│              (Node.js / Vercel / Docker)                │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (internal)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Bun + Hono API Server                      │
│  /auth    /orgs    /users    /leaves    /payroll        │
│  /attendance    /documents    /reports    /webhooks     │
│              Better Auth middleware                     │
└──────┬────────────────┬───────────────┬────────────────┘
       │                │               │
       ▼                ▼               ▼
┌────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL │  │    Redis     │  │  Cloudflare  │
│   (data)   │  │(cache/queue) │  │  R2 (files)  │
└────────────┘  └──────┬───────┘  └──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  BullMQ Workers │
              │ (Bun processes) │
              │ - Payroll runs  │
              │ - PDF gen       │
              │ - Notifications │
              │ - Biometric sync│
              └─────────────────┘
```

---

## Backend: Bun + Hono API

### Why Bun?

- 3–4x faster than Node.js for I/O workloads
- Native TypeScript execution (no transpile step in dev)
- Built-in test runner, bundler, package manager
- Better Auth explicitly supports Bun

### Why Hono?

- Runs on Bun, Cloudflare Workers, Node — portable
- Clean, Express-like API, TypeScript-first
- Middleware system (auth, rate limiting, cors, logging)
- RPC client generation (type-safe API calls from Next.js)

### API Structure

```
packages/api/
├── src/
│   ├── index.ts              # Bun.serve entry
│   ├── app.ts                # Hono app, middleware
│   ├── auth.ts               # Better Auth setup
│   ├── db/
│   │   ├── index.ts          # Drizzle client
│   │   ├── schema/           # Drizzle schema per module
│   │   └── migrations/       # Auto-generated migrations
│   ├── routes/
│   │   ├── orgs.ts
│   │   ├── users.ts
│   │   ├── teams.ts
│   │   ├── leaves.ts
│   │   ├── attendance.ts
│   │   ├── payroll.ts
│   │   ├── documents.ts
│   │   ├── reports.ts
│   │   └── webhooks/
│   │       ├── slack.ts
│   │       ├── whatsapp.ts
│   │       └── biometric.ts
│   ├── services/             # Business logic layer
│   │   ├── payroll/
│   │   ├── compliance/
│   │   ├── notifications/
│   │   └── documents/
│   ├── workers/              # BullMQ job processors
│   │   ├── payroll.worker.ts
│   │   ├── pdf.worker.ts
│   │   └── notify.worker.ts
│   └── lib/
│       ├── r2.ts             # Cloudflare R2 client
│       ├── msg91.ts          # SMS/WhatsApp
│       ├── resend.ts         # Email
│       └── tally.ts          # Tally export formatter
├── package.json
└── tsconfig.json
```

### Monorepo Structure

```
avkash/                       # Root
├── apps/
│   ├── web/                  # Next.js 15 frontend
│   └── api/                  # Bun + Hono backend
├── packages/
│   ├── db/                   # Shared Drizzle schema + types
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities
├── docker-compose.yml
├── docker-compose.prod.yml
└── turbo.json                # Turborepo config
```

---

## Frontend: Next.js 15

### What Changes from Current

- Replace `src/app/_utils/supabase/` with API client calling Bun API
- Replace Supabase Auth session with Better Auth session cookies
- Middleware updates: verify session via Better Auth `auth.api.getSession()`
- Server Actions become thin wrappers around `fetch()` to API
- Keep Ant Design + Tailwind UI unchanged

### API Client Pattern

```typescript
// packages/types/src/api.ts — shared RPC types
// apps/web/src/lib/api.ts — typed fetch wrapper

import type { AppType } from '@avkash/api';
import { hc } from 'hono/client';

export const api = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);
```

Hono's RPC client gives fully type-safe calls to the Bun API with no code generation step.

### i18n (Hindi Support)

```
apps/web/src/
├── messages/
│   ├── en.json
│   └── hi.json
└── i18n.ts   # next-intl config
```

Use `next-intl` — works natively with Next.js App Router.

---

## Auth: Better Auth

### Why Better Auth over others

| Criteria         | Better Auth | Lucia v3    | Auth.js v5 |
| ---------------- | ----------- | ----------- | ---------- |
| Bun support      | Native      | Yes         | Limited    |
| Slack OAuth      | Plugin      | Manual      | Plugin     |
| Magic links      | Built-in    | Manual      | Plugin     |
| DB adapters      | Drizzle ✓   | Yes         | Yes        |
| Session strategy | Cookie + DB | Cookie + DB | JWT/DB     |
| Self-hostable    | Yes         | Yes         | Yes        |

### Auth Flows

1. **Magic Link** (primary for owners/admins)
   - Email → link → cookie session
2. **Slack OAuth** (primary for employees)
   - Connect Slack workspace → map Slack user → session
3. **Google OAuth** (secondary)
4. **Password** (optional, for self-hosted installs)

### Session Flow

```
Request → Next.js Middleware
  → auth.api.getSession(headers)  [Better Auth server call]
  → if no session → redirect /login
  → if session → pass userId, orgId, role to layout
```

---

## Database: Drizzle ORM

### Why Drizzle over Prisma

- Lighter runtime (no engine binary)
- Bun-compatible (Prisma has known Bun issues)
- SQL-like query syntax — easier to reason about
- Type inference is tighter
- Faster query compilation

### Schema Organization

```
packages/db/src/schema/
├── core.ts         # Organisation, User, Team, Department
├── leave.ts        # Leave, LeaveType, LeavePolicy
├── attendance.ts   # AttendanceRecord, Shift, BiometricDevice
├── payroll.ts      # PayrollRun, Payslip, SalaryStructure
├── compliance.ts   # StatutoryConfig, PFRecord, ESIRecord
├── documents.ts    # Document, DocumentTemplate
├── performance.ts  # Goal, ReviewCycle, Review
├── onboarding.ts   # OnboardingTemplate, OnboardingTask
├── recruitment.ts  # JobPosting, Candidate, Application
├── audit.ts        # ActivityLog
└── billing.ts      # Subscription, PaySubMap
```

---

## File Storage: Cloudflare R2

- S3-compatible API (same SDK)
- Zero egress fees (crucial for payslip downloads at scale)
- Free: 10 GB storage, 1M reads/month
- Signed URLs for secure document access
- Used for: payslips, offer letters, ID proofs, policy documents

---

## Job Queue: BullMQ + Redis

Jobs that run asynchronously:

| Job                  | Trigger                 | Worker                                       |
| -------------------- | ----------------------- | -------------------------------------------- |
| Payroll finalization | HR clicks "Run Payroll" | Calculates all employees, generates payslips |
| PDF generation       | Payslip / offer letter  | Puppeteer or PDFKit                          |
| WhatsApp delivery    | Payslip ready           | MSG91 API call per employee                  |
| Biometric sync       | Cron every 15 min       | Pull from device API / parse CSV             |
| Leave accrual        | Monthly cron            | Credit leave balances                        |
| Attendance auto-mark | EOD cron                | Mark absent if no punch                      |
| Compliance reminder  | Cron                    | PF due date alerts                           |
| Probation expiry     | Daily cron              | Alert manager 7 days before                  |

---

## Deployment Targets

See [06-deployment.md](./06-deployment.md) for full detail.

| Tier                 | Stack                                                   |
| -------------------- | ------------------------------------------------------- |
| Hosted SaaS (cloud)  | Fly.io / Railway + Neon PostgreSQL + Upstash Redis + R2 |
| Self-hosted (Docker) | Docker Compose — all services on one VPS                |
| Self-hosted (K8s)    | Helm chart — for larger installs                        |

---

## Performance Targets

| Metric                      | Target                                  |
| --------------------------- | --------------------------------------- |
| API p95 response time       | < 100ms                                 |
| Payroll run (100 employees) | < 10 seconds                            |
| PDF generation              | < 3 seconds                             |
| Dashboard load              | < 1.5 seconds                           |
| DB queries                  | All hot paths < 50ms (indexes required) |

---

## Security Requirements

- All API routes require authenticated session (Better Auth middleware)
- Organization-level data isolation (every query scoped to orgId)
- Role checks enforced in service layer: OWNER > MANAGER > USER
- PAN / Aadhaar stored encrypted (AES-256), masked in UI
- Bank account numbers encrypted at rest
- File access via signed URLs (not public R2 buckets)
- Rate limiting on auth endpoints (BullMQ-backed or Hono middleware)
- HTTPS enforced everywhere (Cloudflare terminates TLS)
- Audit log: every data mutation logged to ActivityLog
