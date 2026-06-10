# Plan 49 — Modular core platform (open-core + per-tenant entitlements)

Status: **architecture blueprint + phased plan**. Turns Avkash v2 from a well-layered monolith into a
*pluggable platform*: a stable open-source **core** that any company can adopt and self-host, with optional
**modules** (compliance, payroll, extended HR) that register themselves and switch on **per organisation**
via an entitlement flag. Managed multi-tenant SaaS is the primary consumption model; self-host is a
first-class fallback.

Referenced by: [Plan 03 (technical architecture)](03-technical-architecture.md),
[Plan 07 (pricing)](07-pricing-monetization.md). Amended by
[Plan 51 (granular authorization)](51-granular-authorization.md), which adds **Seam 4 — relationship
authz** (OpenFGA) and extends the `AvkashModule` manifest with `authzModel` / `fieldGroups`; Seam 4 depends
on Phase 1 (event bus) and composes with Phase 3 (registry). Touches every domain package, so land it
incrementally (phase by phase) rather than as one big-bang refactor.

This plan is **architecture + sequencing only** — no code lands until a phase is approved.

---

## Why

The backend is already ~75% of a sellable core: single `AuthContext` threaded everywhere with mandatory
`orgId` filtering ([packages/shared/src/context.ts](../packages/shared/src/context.ts)), a real error
taxonomy + single envelope, DTO/serialize, optimistic concurrency, idempotency, a comprehensive audit log
([packages/db/src/schema/audit.ts](../packages/db/src/schema/audit.ts)), and scenario test coverage.

But it is a **monolith with clean packages**, not a platform. Three structural facts block "modules on top":

1. **No extension seam.** Every domain *directly imports and calls* `dispatch()` from
   `@avkash/notifications` — leave, attendance, users, org, and even `auth`
   ([packages/auth/src/auth.ts:7](../packages/auth/src/auth.ts)). Notifications is labelled
   "orchestration" but is wired *into* the core and reaches `@avkash/db` directly
   ([packages/notifications/src/dispatch.ts](../packages/notifications/src/dispatch.ts)). There is **no
   event bus**, so a new module cannot react to `leave.approved` or `user.created` without editing core
   domain code.
2. **A new module means surgery on ~6 core files.** Adding `compliance` today edits `app.ts` (routes),
   `db/schema/index.ts` + `relations.ts`, `apps/api/src/dto.ts`, `i18n/messages/{en,hi}.ts`, and
   `jobs/schedule.ts`. Nothing self-registers.
3. **Nothing turns a module on per customer.** There is a `subscription` table
   ([packages/db/src/schema/billing.ts](../packages/db/src/schema/billing.ts)) but **zero enforcement** —
   no entitlement check, no per-org gate. "Sell payroll as an add-on" has no mechanism behind it.

Plus a thin pitch surface: no OpenAPI/SDK (only Hono's `AppType`, useless to external consumers), no `/v1`
versioning, no provider/back-office admin, `console.log`-only observability.

This plan closes those gaps in dependency order.

---

## Target architecture

### The core / module boundary

**CORE — the open kernel you pitch ("define the code"). Always present, never gated:**

- Tenancy + `AuthContext` (all transports), org + users + teams lifecycle
- Auth / identity: Better Auth, **API keys**, authN resolvers per transport, authz guards
- RBAC (`Role` ladder) + scopes
- Cross-cutting platform: errors, i18n runtime, validation, DTO/serialize, optimistic concurrency,
  idempotency, request-id, health/readiness
- Config (Zod env)
- **The event bus** (new), **the module registry** (new), **the entitlements service** (new), audit

**MODULES — optional, self-registering, entitlement-gated:**

- Existing domains become modules: `leave`, `attendance`, `holidays`, `policy`, `documents`
- Future: `payroll` (de-stub), `compliance` (greenfield)
- Delivery becomes *event subscribers*, not things core calls: `notifications`, `slack`, `webhooks` (new)

Rule that makes this real: **core never imports a module; modules depend only downward on core.** Modules
communicate cross-cutting side-effects through **events**, not direct calls. (Synchronous cross-domain
*reads* — e.g. leave asking attendance "is this a workday" — stay as direct function calls. Events are for
*reactions and side-effects*, not queries. Do not over-event.)

### The three seams

```
                    ┌─────────────────────────── CORE ───────────────────────────┐
   HTTP / Slack ───▶│  AuthContext · RBAC · platform middleware                    │
   device / api-key │                                                              │
                    │   ┌──────────────┐   ┌────────────────┐   ┌───────────────┐  │
                    │   │ Module       │   │ Event bus      │   │ Entitlements  │  │
                    │   │ registry     │   │ (txn outbox    │   │ (per-org gate │  │
                    │   │ (manifests)  │   │  + relay)      │   │  + cache)     │  │
                    │   └──────┬───────┘   └───────┬────────┘   └──────┬────────┘  │
                    └──────────┼───────────────────┼───────────────────┼──────────┘
                               │ mounts routes,    │ publish / subscribe│ gates routes,
                               │ jobs, i18n         │                    │ subs, jobs
        ┌──────────────────────┴────────────────────┴────────────────────┴───────────┐
   MODULES   leave   attendance   holidays   policy   documents   payroll   compliance
   (gated)        └─ notifications · slack · webhooks  (event subscribers, no core calls)
```

---

## Seam 1 — Domain event bus (transactional outbox)

The backbone. New foundation package `@avkash/events` (depends only on `shared` + the `db` client).

```ts
// packages/events/src/index.ts
interface DomainEvent<P> {
  name: string;            // '<module>.<entity>.<verb>'  e.g. 'leave.request.approved'
  orgId: string;
  actorId: string | null;  // from AuthContext; null for system
  actorType: 'user' | 'service' | 'system';
  payload: P;              // typed per event, validated by a Zod schema
  occurredAt: Date;
  requestId: string | null;
}

defineEvent<P>(name: string, schema: ZodType<P>): EventDef<P>
publish<P>(tx, ctx, def: EventDef<P>, payload: P): Promise<void>   // writes outbox row IN tx
subscribe<P>(def: EventDef<P>, handler: (e: DomainEvent<P>) => Promise<void>): void
```

**Transactional outbox** — `publish` inserts into `event_outbox` in the *same DB transaction* as the domain
mutation, so there is no dual-write problem ("if the leave was approved, the event will fire"). A **relay**
in the worker drains unpublished rows and fans out to in-process subscribers + the webhook deliverer.

```
event_outbox
  id            uuid PK
  orgId         uuid       notNull
  name          varchar    notNull         ('leave.request.approved')
  payload       jsonb      notNull
  actorId       uuid?
  actorType     varchar    notNull
  requestId     varchar?
  occurredAt    timestamp  notNull
  publishedAt   timestamp?                  (null = not yet relayed)
  attempts      integer    default 0
  lastError     text?
  index(publishedAt) where publishedAt is null    -- relay scan
  index(orgId, name, occurredAt)
```

Delivery is **at-least-once** → subscribers must be idempotent. Notifications already has an idempotent
outbox; audit/webhook subscribers key on `event_outbox.id`. Relay uses poll-every-N-seconds plus Postgres
`LISTEN/NOTIFY` for low latency.

**This one seam pays for three gaps:** it decouples notifications (removing the layering violation), it
gives **outbound webhooks for free** (just another subscriber), and it lets compliance/audit hook any event
without touching core.

---

## Seam 2 — Module registry + manifest

Each module exports a manifest; a core registry discovers them at boot. The contract lives in `shared` so
both core and modules import it without a cycle.

```ts
// packages/shared/src/module.ts
interface AvkashModule {
  key: string;                 // 'leave' — stable, unique, used as the entitlement default key
  title: string;
  entitlement: string | null;  // entitlement key required to enable; null = core (always on)
  dependsOn?: string[];        // module keys required; validated at boot (leave → attendance, holidays)

  routes?: (router: Hono) => void;          // registry mounts under /v1/<base>, wraps in entitlement guard
  jobs?: JobDefinition[];                    // registry registers each with the BullMQ scheduler
  subscribers?: EventSubscriber[];           // registry wires each to the event bus (entitlement-checked)
  profileContributors?: ProfileContributor[]; // read-side: augment a core view (employee detail) — see below
  i18n?: Partial<Record<Locale, Catalog>>;   // namespaced by module key; merged into the i18n runtime
}
```

Registration collapses to **one file**: `apps/api/src/modules.ts` exports `const MODULES: AvkashModule[]`.
`app.ts` iterates it to mount routes; the worker iterates it for jobs + subscribers. Adding a module = add
its package + **one array entry** — not six core edits.

**Schema ownership — explicit decision (deferred relocation).** Drizzle needs all tables statically for
`db:push`, and in an open-core + entitlements model every tenant shares one Postgres anyway. So for the
initial build we **keep table definitions in `packages/db`** (organised one file per module, as today) and
gate *behaviour* by entitlement, not *table existence*. Physically relocating each module's tables into its
own package (with the drizzle-kit config aggregating them) is a clean but heavy follow-up — tracked as an
optional later refactor, **out of scope here**. Modules own their *logic, routes, DTOs, i18n, jobs, events,
and entitlement key* from day one; the table file is the only thing still living in `db`.

---

## Read-side composition (amendment to Seam 2)

Seam 1 (events) is how a module *reacts* to core. Its mirror image is how a module *augments* a core read
view — e.g. the **Employee Detail** page (owned by `users`) showing an employee's LMS courses, payslips, or
documents. Core must not import modules, so it cannot fetch this itself; modules **contribute** to the view.

The manifest gains a `profileContributors` field (added above):

```ts
interface ProfileContributor {
  key: string;                                            // 'lms'
  label: string;                                          // 'Courses'
  load(ctx: AuthContext, employeeId: string): Promise<unknown>;
}
```

A core aggregator endpoint composes the **entitled** modules' contributions:

```
GET /v1/employees/:id?include=profile
→ { employee: {…}, sections: { lms: {…}, payroll: {…} } }
```

The registry only invokes contributors for modules the org has entitled (Seam 3), so a section is naturally
absent when its module is off. The same slot mechanism generalises to other core surfaces (team detail, org
dashboard): name a slot, let modules contribute, compose at read time. Core depends only on the
`ProfileContributor` interface — never on a module.

**Phase:** rides on Seam 2 (registry) + Seam 3 (entitlement gating) → **Phase 3/4**. **Interim:** until then,
**client-side composition** (the core view makes a second call to the module's user-scoped endpoint) delivers
the same result with zero core change, and may remain the default; the registry is for server-composed
payloads and a uniform widget model.

---

## Seam 3 — Per-tenant entitlements

The gate that makes "modules sold on top" real.

```
org_entitlement
  id           uuid PK
  orgId        uuid FK → organisation   notNull
  moduleKey    varchar  notNull         ('payroll', 'compliance', 'attendance', ...)
  enabled      bool     default true
  plan         varchar?                 ('starter'|'growth'|'enterprise' — informational)
  limits       jsonb?                   (per-module caps, e.g. {"seats": 100})
  source       varchar  notNull         ('manual'|'billing'|'trial')
  validUntil   timestamp?               (null = perpetual; set for trials)
  createdAt / updatedAt
  unique(orgId, moduleKey)
```

```ts
// packages/<core>/entitlements
isModuleEnabled(ctx, moduleKey): boolean       // reads a per-org cached set
requireEntitlement(moduleKey): Middleware/guard // throws ForbiddenError('MODULE_NOT_ENABLED') → 402
```

**Three gate points**, all driven by the manifest's `entitlement` key:

- **Routes** — registry wraps each gated module's router in `requireEntitlement` (skipped when
  `entitlement === null`). Disabled → clean `402 PAYMENT_REQUIRED` envelope.
- **Subscribers** — registry wraps handlers to no-op when the module is disabled for that event's `orgId`.
- **Jobs** — per-tenant loops skip orgs lacking the entitlement.

**Caching** — entitlement checks are hot-path; load a per-org entitlement set once and cache with a short
TTL, invalidated on write (Redis pub/sub for multi-instance). New orgs are provisioned with the free-tier
module set enabled; paid modules stay off until a sale or billing webhook flips them. Billing-provider wiring
(Razorpay/Stripe → entitlement) is downstream of this table and not in scope here.

---

## Core hardening (prereqs the modules lean on)

- **Uniform `AuthContext` for non-HTTP actors.** Device auth currently yields a `DeviceContext`, and internal
  cron has no context at all. Make both produce a real `AuthContext` (`actorType: 'service' | 'system'`) so
  every domain call and audit row is uniform ([packages/attendance/src/device.ts](../packages/attendance/src/device.ts),
  [apps/api/src/middleware/internal-auth.ts](../apps/api/src/middleware/internal-auth.ts)).
- **API keys.** Add an `api_key` table + resolver producing `AuthContext` with `actorType: 'service'`,
  populated `scopes`, `assurance: 'low'`. The `requireScope` guard already exists
  ([packages/auth/src/guards.ts](../packages/auth/src/guards.ts)) but `scopes` is never populated. This is
  what lets an external company integrate at all.

---

## Pitch surface (productization)

- **OpenAPI + `/docs`.** Routes are already Zod-validated; adopt `@hono/zod-openapi` to emit a spec and serve
  Swagger UI. External consumers get docs + SDK codegen. (`AppType` stays the internal-web contract.)
- **Versioning.** Introduce a `/v1` prefix now (cheap insurance) and a written deprecation policy.
- **Provider admin.** A provider-side surface (separate auth, `actorType: 'system'`) to list/suspend orgs,
  set entitlements, and export tenant data. Extends the existing `/internal` group
  ([apps/api/src/routes/internal.ts](../apps/api/src/routes/internal.ts)).
- **Observability.** Replace `console.log` with structured logging (pino) carrying `requestId + orgId +
  actorId`; add a pluggable error-reporting hook (Sentry-compatible).
- **Data portability.** Per-tenant export endpoint + GDPR-style tenant deletion (the test helpers already
  cascade-delete by `orgId`, so the deletion logic exists — it just needs a guarded surface).

---

## Phasing

Each phase is independently shippable and de-risks the next. Land them in order; nothing is big-bang.

| Phase | Deliverable | Depends on | Closes |
| --- | --- | --- | --- |
| **0** | **Contracts & boundary.** This doc + the `AvkashModule`, `DomainEvent`, entitlement interfaces and the event catalog. Types + docs only, no behaviour. | — | shared vocabulary |
| **1** | **Event bus + outbox + relay.** `@avkash/events`, `event_outbox` table, worker relay. No consumers migrated yet. | 0 | the missing seam |
| **2** | **Notifications → subscriber.** Replace direct `dispatch()` in leave/attendance/users/org/auth with `publish(...)`; notifications subscribes. (Optionally move audit to a subscriber.) | 1 | layering violation; proves the seam |
| **3** | **Module registry + manifests.** Convert existing domains to modules; collapse 6-file registration to one `modules.ts`; move DTOs + i18n into modules. | 0 (better with 1) | the "6 core files" problem |
| **4** | **Entitlements.** `org_entitlement` table, service, middleware, caching, default provisioning; gate every non-core module. | 3 | per-tenant "modules on top" |
| **5** | **Outbound webhooks.** Webhook-delivery subscriber + `webhook_subscription` table + HMAC signing + retries. | 1 | external integration |
| **6** | **Core hardening + pitch surface.** Service/system `AuthContext` + API keys; OpenAPI + `/docs`; `/v1`; provider admin; structured logging. | 1, 4 | sellability |
| **7** | **Greenfield proof: `compliance`** (+ de-stub `payroll`). Validates a module plugs in with ~1 core edit: its own package + one manifest line, subscribing to events, declaring its entitlement. | 1, 3, 4 | the thesis |

Parallelisable once Phase 1 lands: Phase 3 (registry) and Phase 5 (webhooks) are independent; Phase 6's
pitch-surface items (OpenAPI, logging) can proceed alongside.

---

## Risks & mitigations

- **At-least-once delivery.** Outbox relay can re-deliver → all subscribers must be idempotent (key on
  `event_outbox.id`; notifications already dedupes).
- **Entitlement cache coherence.** Stale cache across instances → invalidate via Redis pub/sub; short TTL as
  backstop.
- **Over-eventing.** Tempting to route every cross-domain call through events. Keep synchronous *reads* as
  direct calls; reserve events for *reactions* and *cross-cutting side-effects*.
- **Migration churn.** Converting domains to modules touches many files. Do it module-by-module behind the
  manifest so `main` stays green; `pnpm typecheck` (cross-package authority) gates each step.
- **Schema-ownership scope creep.** Resist relocating tables into module packages now (deferred decision
  above); it is a large refactor with little near-term payoff under one shared Postgres.

---

## Definition of done (platform-level)

- A new module (`compliance`) is added by creating its package and appending **one line** to `modules.ts` —
  zero edits to `app.ts` routing, i18n catalogs, DTO file, or job scheduler.
- That module reacts to core events (e.g. `user.created`, `leave.request.approved`) **without** any core
  domain package importing it.
- A provider can enable/disable that module **per organisation**, and a disabled module's routes return a
  clean `402`, its subscribers are inert, and its jobs skip.
- `@avkash/notifications` is no longer imported by any domain or by `auth`; it only subscribes to events.
- External consumers can discover the API via an OpenAPI spec at `/docs` and authenticate with an API key.

---

## Open decisions (not blocking Phase 0/1)

- Billing provider wiring (Razorpay vs Stripe) that flips entitlements — downstream of Seam 3.
- Whether **audit** becomes an event subscriber or stays explicit `writeAudit()` (leaning: keep explicit for
  determinism; mirror selected events into audit additively).
- In-process subscriber dispatch vs a dedicated queue per subscriber (start in-process via the relay;
  promote hot subscribers to their own queue if needed).
- Whether to ever physically relocate module tables out of `packages/db` (the deferred schema refactor).
