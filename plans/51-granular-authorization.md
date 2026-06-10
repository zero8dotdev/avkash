# Plan 51 — Granular authorization (OpenFGA + field-level visibility)

Status: **architecture blueprint + multi-agent implementation plan**. Adds **Seam 4 — relationship
authorization** to the Plan 49 platform: Zanzibar-style ReBAC via **OpenFGA** mapped onto the existing org
graph (Business Unit → Department → Team → Employee), a **tuple-sync pipeline** riding the Plan 49 event
bus, and **field-level visibility** (sensitivity groups projected at the `serialize` seam). Together they
answer the three enterprise asks flat RBAC cannot: per-tenant custom org/approval structures without code
changes, resource-scoped API keys, and provable, query-able access paths for audits.

Referenced by / amends: [Plan 49 (modular core platform)](49-modular-core-platform.md) — adds Seam 4 and
extends the `AvkashModule` manifest; [Plan 50 (repository & open-core strategy)](50-repository-open-core-strategy.md)
— `@avkash/authz` and the OpenFGA service are **open** (public repo); private modules contribute their own
model fragments.

**Defaults baked into this plan** (override before execution if you disagree): field **groups** (sensitivity
classes), never per-field rules; enforcement **only** at `serialize` / `validateBody`, never scattered in
domain code; **omit** (not null/mask) wire semantics for hidden fields; **fail-closed** when OpenFGA is
unreachable; the field-group → role matrix lives in a **Postgres `field_policy` table** (FGA-native field
groups deferred); OpenFGA shares the **same Postgres instance** in a dedicated logical database.

---

## Why

Current authz is a flat role ladder + tenant assertion ([packages/auth/src/guards.ts](../packages/auth/src/guards.ts)):
`requireRole(ctx, 'MANAGER')` answers "is this person *a* manager" — but every real HR question is
relationship-shaped: "is this person *the right* manager **for this employee**". Today that second half is
re-derived ad hoc inside `leave`, `attendance`, `users` (supervisor lookups, team-membership checks),
differently in each package. Meanwhile the domain model is already a rich relationship graph: business
units, departments, teams, org levels, supervisors, shift supervisors, delegations, transfers.

Three gaps this plan closes:

1. **No relationship authz.** "Manager approves *their* reports' leave", "HRBP sees *their* BU",
   "shift supervisor regularizes *their shift's* punches" — all hand-rolled, none consistent, none
   per-tenant configurable. Enterprise deals stall on "can you model our structure?".
2. **No field-level visibility.** Compensation, bank details, national IDs (PAN/Aadhaar), medical data —
   HR's most sensitive columns — are all-or-nothing per route. DPDP/GDPR data-minimization questions
   ("who can access compensation data?") have no answer.
3. **`scopes` is decorative.** `requireScope` exists but nothing populates scopes; API keys (Plan 49
   core hardening) without resource-level scoping are org-wide skeleton keys.

---

## Target architecture — Seam 4

```
                 ┌─────────────────────────── CORE ────────────────────────────┐
HTTP / Slack ───▶│ AuthContext · requireRole · requireScope        (unchanged)  │
device / api-key │                                                              │
                 │  ┌────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────┐  │
                 │  │ Module     │ │ Event bus │ │ Entitlements │ │ AUTHZ    │  │
                 │  │ registry   │ │ (outbox)  │ │ (per-org)    │ │ (Seam 4) │  │
                 │  └────────────┘ └─────┬─────┘ └──────────────┘ └────┬─────┘  │
                 └───────────────────────┼─────────────────────────────┼────────┘
                                         │ domain events               │ check / list /
                                         ▼                             │ explain
                                  ┌──────────────┐    writes    ┌──────┴───────┐
                                  │ tuple-writer │─────────────▶│   OpenFGA    │
                                  │ (subscriber) │              │ (same PG     │
                                  └──────────────┘              │  instance)   │
                                  ┌──────────────┐    repairs   └──────────────┘
                                  │ reconciler   │─────────────▶
                                  │ (nightly job)│
                                  └──────────────┘
```

Three layers, one seam each — they compose, never overlap:

| Layer | Question | Mechanism |
| --- | --- | --- |
| Entitlement | Does the org even have this module? | `org_entitlement` (Plan 49 Seam 3 — unchanged) |
| Object access | Can Alice act on employee 123? | OpenFGA relations over the org graph |
| Field visibility | Which *parts* of 123 can Alice see/write? | Field groups → project at `serialize`, strip at `validateBody` |

### Constraint: shared database

OpenFGA runs as **one additional stateless-ish container** (Apache-2.0, single Go binary) pointed at the
**existing Postgres 16 instance** — no new stateful infrastructure. It gets a **dedicated logical database**
(`openfga`) inside the same instance, created by a Postgres init script, migrated by `openfga migrate` on
boot:

```yaml
# docker-compose.yml (public repo) — additions
openfga-migrate:
  image: openfga/openfga:v1.8
  command: migrate
  environment:
    OPENFGA_DATASTORE_ENGINE: postgres
    OPENFGA_DATASTORE_URI: postgres://avkash:avkash@postgres:5432/openfga?sslmode=disable
  depends_on: { postgres: { condition: service_healthy } }

openfga:
  image: openfga/openfga:v1.8
  command: run
  environment:
    OPENFGA_DATASTORE_ENGINE: postgres
    OPENFGA_DATASTORE_URI: postgres://avkash:avkash@postgres:5432/openfga?sslmode=disable
  depends_on: { openfga-migrate: { condition: service_completed_successfully } }
  ports: ['8080:8080']   # HTTP API; 8081 gRPC if needed
```

**Why a separate logical DB, not the app schema:** `drizzle-kit push` diffs the live database against the
Drizzle schema and will flag (or try to drop) tables it doesn't know. OpenFGA's tables must never be visible
to it. Same instance = same backup/operations story; separate logical DB = zero tooling interference. The
self-host bar rises by exactly one container.

### New package: `@avkash/authz` (identity layer, open)

Sits beside `auth` in the dependency graph (depends on `shared` + `config` only — **not** `db`). Exposes:

```ts
// packages/authz/src/index.ts
requireRelation(ctx, relation: string, object: string): Promise<void>
//   check(user:{ctx.userId}, relation, object) → ForbiddenError('FORBIDDEN_RELATION') on no
//   FGA unreachable → DomainError('AUTHZ_UNAVAILABLE') → 503. FAIL CLOSED, never fall back to allow.

listAccessible(ctx, relation: string, type: string): Promise<string[]>
//   ListObjects → ids for SQL `WHERE id IN (...)` filtering on list endpoints/reports

explainAccess(ctx, relation: string, object: string): Promise<ExpandTree>
//   Expand API → "why does Alice see this?" — the audit/compliance answer

writeTuples(writes: Tuple[], deletes: Tuple[]): Promise<void>   // used ONLY by tuple-writer + reconciler
```

Honors the cardinal rule: never branches on `ctx.via`. `AuthContext` is **unchanged**. `requireRole` /
`requireScope` / `assertOrg` stay for what they're good at; routes layer `requireRelation` on top where the
question is relationship-shaped. **Every FGA-guarded route still calls `assertOrg`** — tenant isolation is
enforced twice (graph chains to org + explicit assertion), never delegated to FGA alone.

### Authorization model — core types + module fragments

One FGA **store**; object IDs are the real row UUIDs (globally unique, so cross-tenant collisions are
impossible by construction). The core model (indicative, finalized in WS2):

```
model
  schema 1.1

type user

type org
  relations
    define member: [user]
    define hr_admin: [user]
    define owner: [user]

type business_unit
  relations
    define org: [org]
    define head: [user]
    define hrbp: [user]                          # the per-BU HR partner — the classic enterprise ask

type department
  relations
    define business_unit: [business_unit]
    define head: [user]

type team
  relations
    define department: [department]
    define manager: [user]
    define delegate: [user with active_window]   # delegation = a tuple with a time condition
    define member: [user]
    define approver: manager or delegate or head from department

type employee
  relations
    define team: [team]
    define subject: [user]
    define viewer: subject or approver from team or hr_admin from org... or hrbp resolution

type leave_request
  relations
    define subject: [employee]
    define approver: approver from team from subject

condition active_window(now: timestamp, starts: timestamp, ends: timestamp) {
  now >= starts && now <= ends
}
```

What this buys, concretely: delegation collapses to one conditioned tuple (and auto-covers *every*
permission the delegator had); department-head inheritance is a model rewrite written once; per-tenant
variations (matrix reporting, region heads) become tuple/model changes, not code.

**Modules contribute fragments.** The Plan 49 manifest gains two fields (amendment below):

```ts
interface AvkashModule {
  // ... Plan 49 fields ...
  authzModel?: string;                 // FGA DSL fragment (module's own types, e.g. payslip)
  fieldGroups?: ResourceFieldGroups[]; // see Piece 3
}
```

The registry concatenates core model + entitled modules' fragments and writes the combined model to FGA at
boot **iff changed** (models are immutable+versioned in FGA; the store keeps history). A private `payroll`
module ships `type payslip { define viewer: subject or payroll_admin from org }` without touching core —
consistent with routes/i18n/jobs.

**Model tests are mandatory.** Every model change ships with FGA store tests (`.fga.yaml`: tuples +
check/list assertions, run via `fga model test` in CI). A wrong model is a security bug; test it like schema.

---

## Piece 2 — Tuple sync (the dual-write answer)

**Hard prerequisite: Plan 49 Phases 0–1 (contracts + event bus/outbox).** Without the outbox, FGA writes
would be naive dual-writes → silent permanent divergence. With it, failure degrades to *bounded, observable
lag*. Design rules, in priority order:

1. **The tuple-writer subscriber is STATE-BASED, not delta-based.** On any org-graph event
   (`team.member.added/removed`, `employee.transferred`, `delegation.created/revoked`, `org.role.changed`,
   `department.*`, `business_unit.*`), it **reads current truth from Postgres** and writes FGA to match —
   never applies the event's payload as a delta. Replays and reordering (at-least-once delivery) then
   converge instead of corrupt. Idempotent by construction.
2. **Alert on outbox lag.** Two metrics — outbox depth and oldest-unrelayed age — are the divergence window
   made observable. Export both; alert at minutes.
3. **Reconciler job** (in `@avkash/jobs`, nightly per-org): derive expected tuples from Postgres (org chart
   is the source of truth) → diff against FGA (Read API) → write missing, delete extra, **log every
   repair**. Bounds worst-case divergence to the interval *regardless of cause* — including mutations that
   never emitted an event (backfills, manual SQL). A nonzero repair count is an upstream bug signal; surface
   it loudly.
4. **Revokes get the fast lane.** Delayed grants fail closed (403, support ticket, self-heals); delayed
   revokes fail **open** (transferred-out manager still sees old team — a real incident in HR data). For
   transfer/offboarding flows specifically: attempt the revoke tuple write **synchronously best-effort** in
   the request path, with the outbox event as the guarantee behind it.
5. **Bootstrap/backfill command.** `pnpm authz:backfill` — full expected-tuple derivation + write, for
   first deployment and disaster recovery. (Same code path as the reconciler's "expected" side.)

Honest residual risk, stated for enterprise security questionnaires: *"permission revocation propagates in
≤N seconds (relay latency), with a nightly full reconciliation"* — measurable and defensible.

---

## Piece 3 — Field-level visibility (sensitivity groups)

**Granularity: field groups, never individual fields.** Per-resource sensitivity classes — the unit auditors
and DPDP/GDPR conversations actually use:

```
employee:
  basic         → name, title, team, photo            (org members)
  contact       → email, phone, address               (manager chain, HR)
  employment    → level, hire date, employment type   (manager chain, HR)
  compensation  → salary, bank details                (hr_admin, subject)
  identity      → PAN, Aadhaar, passport              (hr_admin only)
  medical       → disability, conditions              (hr_admin only; reads AUDITED)
```

**Where the matrix lives:** a Postgres table (open module-declared defaults, per-org overrides). FGA stays
the *object*-level authority; the group matrix is config, queryable for the admin UI:

```
field_policy
  id           uuid PK
  orgId        uuid     notNull
  resource     varchar  notNull       ('employee')
  fieldGroup   varchar  notNull       ('compensation')
  relation     varchar  notNull       ('hr_admin' | 'manager' | 'subject' | role name)
  access       varchar  notNull       ('read' | 'write' | 'none')
  createdAt / updatedAt / version
  unique(orgId, resource, fieldGroup, relation)
```

Resolution: org override row → module-manifest default (`ResourceFieldGroups.defaults`). Cached per
`(orgId, resource)` with short TTL + invalidate-on-write — same pattern as entitlements.

**Enforcement at exactly two points, never in domain code:**

- **Read — `serialize`.** Gains a projection arg: `serialize(dto, row, { groups })` drops keys whose group
  the caller doesn't hold. Manifest declares the group → column mapping; `dto.ts` stays the single shaping
  point. Sensitive fields become **optional** in DTO types (the `AppType` contract weakens deliberately —
  the web client must handle absence).
- **Write — `validateBody`.** Body fields outside the caller's *writable* groups → **reject with 403
  `FORBIDDEN_FIELD`** (explicit beats silent-strip's "saved but didn't"). Same matrix, second gate.

**Wire semantics: OMIT the key.** Not `null` (ambiguous with "no value"), not masking (UI concern). Document
in API conventions.

**The three commonly-missed holes, closed by design:**

1. **Query side-channel.** Hiding `salary` while allowing `?sort=salary` / `?salary_gt=` leaks it by
   inference. Filter/sort/search params are gated by the **same** group map (each route's query schema
   annotates which group a param draws from; `validateQuery` enforces).
2. **Aggregates.** Report columns declare their source groups; the report builder drops columns the caller
   can't see. An average over salaries *is* compensation data.
3. **Sensitive-read audit.** Serializing `identity`/`medical` groups emits an audit row (who, what, when) —
   batched per request. Named requirement in HR compliance frameworks; attaches at the same seam.

ETags are version-based (not content-hash), so per-caller projections don't break optimistic concurrency.
Idempotency replay is caller-scoped already — no change, asserted by a test.

---

## Amendments to Plans 49 & 50

**Plan 49:**
- The seam diagram gains **Seam 4 (authz)**; `AvkashModule` gains `authzModel?` + `fieldGroups?`.
- Phasing: Seam 4 slots **after Phase 1** (event bus is the tuple-sync backbone) and composes with Phase 3
  (registry merges model fragments). It does NOT block Phases 2–7. Interim before Phase 3 lands: fragments
  wire via a static list in `apps/api` (TODO-tagged), moved into manifests when the registry exists.
- Entitlements (Seam 3) and assurance/step-up are **not** migrated into FGA. FGA answers "who can do what
  to which resource" — not "what did this org pay for".

**Plan 50:**
- `packages/authz` is **public** (platform seam, like events/registry/entitlements). OpenFGA is Apache-2.0 —
  self-hosters get granular authz; it's a funnel feature, not a paid gate.
- Public docker-compose gains the `openfga` service; `avkash-cloud` compose points it at the cloud Postgres.
- Private modules ship their own `authzModel` fragments + `fieldGroups` in their own packages (mirrors the
  private-schema rule). The public CI **leak-guard grep** extends to private FGA type names.
- Public CI runs FGA store tests with open-module fragments only; private CI runs the full merged model.
- `field_policy` table lives in public `packages/db` (it's core platform).

---

## Multi-agent implementation plan

Prereqs before any workstream starts: **Plan 49 Phase 0 (contracts) and Phase 1 (event bus/outbox) merged.**
WS0 below extends Phase 0's contracts.

### Workstreams

Each WS = one agent, one git worktree, one branch. Surfaces are disjoint by design — no two workstreams edit
the same file except where an explicit interface contract (from WS0) defines the join.

| WS | Title | Surface (packages/files) | Depends on | Produces (interface) |
| --- | --- | --- | --- | --- |
| **0** | **Contracts** | `packages/shared` (types only): `requireRelation`/`listAccessible` signatures, `Tuple`, `ResourceFieldGroups`, manifest extensions, error codes (`FORBIDDEN_RELATION`, `FORBIDDEN_FIELD`, `AUTHZ_UNAVAILABLE`), org-graph event-name catalog | Plan 49 P0 | the vocabulary every other WS imports |
| **1** | **Infra + client** | `docker-compose.yml`, `packages/config` (FGA env, Zod), `packages/authz` (client, guards, fail-closed, health), `/health/ready` FGA probe | 0 | working `@avkash/authz` against a live FGA |
| **2** | **Core model + tests** | `packages/authz/model/` (core DSL, `.fga.yaml` store tests), model loader (write-iff-changed), CI step | 0 | the authorization model + its test harness |
| **3** | **Tuple sync** | tuple-writer subscriber (state-based), `pnpm authz:backfill`, reconciler in `packages/jobs`, lag metrics, sync-revoke for transfers | 0, 1, 2, Plan 49 P1 | org graph ⇄ FGA, bounded divergence |
| **4** | **Field visibility** | `packages/db/src/schema/field-policy.ts`, resolution service + cache, `serialize` projection, `validateBody` write-gate, query-param gating, `employee` pilot groups | 0 | the field-group enforcement seam |
| **5** | **Route pilot** | `routes/leave.ts` (approve → `requireRelation`), `routes/employees.ts` (detail + `listAccessible` list filtering + field groups), `routes/delegations.ts` (→ conditioned tuples) | 1, 2, 3, 4 | proof on the three flagship flows |
| **6** | **Admin + explain + audit** | `routes/internal.ts` extensions: field-policy CRUD, `explainAccess` endpoint, sensitive-read audit events | 1, 2, 4 | the enterprise/compliance surface |
| **7** | **Demo + seed** | `scripts/seed-meridian.ts`, demo runbook (`docs/demo-enterprise-authz.md`), end-to-end smoke script | 3, 5, 6 | the runnable enterprise demo |
| **R** | **Reporting agent** | `plans/51-reports/` only — never touches source | continuous | SUMMARY.md + demo-readiness verdict |

Parallelism: after WS0 merges → WS1, WS2, WS4 run concurrently. After WS1+WS2 → WS3. After WS3+WS4 → WS5,
WS6 concurrently. WS7 last. Critical path: 0 → 1/2 → 3 → 5 → 7.

### Agent protocol

- **Model:** all implementation agents (WS0–WS7) and the reporting agent (WS-R) run on **Sonnet**
  (`claude-sonnet-4-6`). The workstreams are deliberately scoped tightly enough (disjoint surfaces, WS0
  contracts fixed up front) that Sonnet handles each one; escalate a single workstream to Opus only if it
  stalls on a design ambiguity, and record the escalation in its report.
- **Worktree + branch:** `git worktree add ../avkash-ws<N> plan51/ws<N>-<slug>` off the integration branch
  `plan51/integration` (itself off `avkash-v2.0`).
- **Gates (all required before reporting done):** `pnpm typecheck` (the cross-package authority), `pnpm
  lint`, existing tests green, **new tests for new behavior** (WS2: store tests; WS3: replay/reorder/
  reconcile-repair tests; WS4: projection + write-reject + query-gate tests; WS5: scenario tests).
- **Stay in your surface.** Needing an edit outside the declared surface = an interface gap → flag it in
  the report for WS0/owner resolution, don't just edit.
- **Report file:** each agent writes `plans/51-reports/ws<N>.md` — status (done/blocked/partial), files
  touched, interface deviations from this plan, test evidence (command + outcome), open issues.
- **Merge order** follows the dependency graph into `plan51/integration`; conflicts there indicate a surface
  violation, not a merge problem.

### Reporting agent (WS-R)

Runs after each WS merge and finally before the demo. Reads all `plans/51-reports/ws*.md` + the integration
diff, then:

1. Verifies every Definition-of-done item below against the actual tree (greps/runs, not trust).
2. Cross-checks interface deviations between reports (WS3 changed an event name WS5 consumes? → flag).
3. Writes `plans/51-reports/SUMMARY.md`: per-WS status table, DoD checklist with evidence links, open
   issues ranked, and a **demo-readiness verdict** (the runbook's beats each marked runnable / blocked).

---

## Demo story — "Meridian Manufacturing" (the enterprise pitch)

Seeded by `scripts/seed-meridian.ts`: one org, 2 business units (Plants, Corporate), departments, teams.
Personas: **Priya** (org hr_admin) · **Rohan** (manager, Team Assembly) · **Sara** (employee, Team Assembly)
· **Dev** (manager, Team Logistics) · **Anita** (HRBP, Plants BU) · a **partner API key** scoped to Plants.

| Beat | What the audience sees | Proves (WS) |
| --- | --- | --- |
| 1. The org chart IS the policy | Rohan approves Sara's leave → 200. Dev tries → 403 `FORBIDDEN_RELATION`. Nobody wrote per-route manager checks. | 2, 3, 5 |
| 2. Delegation in one call | Rohan goes on leave; one delegation POST → Dev can approve Sara's request — and only inside the time window. | 3, 5 |
| 3. Revocation propagates | Sara transfers to Logistics → Rohan loses visibility in seconds; show the lag metric on screen. | 3 |
| 4. Field-level visibility, live | Rohan GETs Sara's profile: no `compensation` keys at all. Priya flips one `field_policy` row → Anita (HRBP) now sees compensation for Plants employees. No deploy. | 4, 6 |
| 5. No side channels | Dev tries `?sort=salary` → 403 `FORBIDDEN_FIELD`. The hidden field can't be inferred. | 4 |
| 6. Least-privilege API key | Partner key lists Plants attendance → 200; Corporate → 403. "Your integrations get exactly what you grant." | 1, 5 |
| 7. Answer the auditor | `explainAccess`: "why does Priya see salaries?" → the relation path, live. Plus the sensitive-read audit trail for `identity`/`medical`. | 6 |
| 8. Honest failure story | Stop the FGA container → checks return 503 (fail closed, never open). Restart → recovers. Run the reconciler → repair log shows zero (or shows it healing an injected drift). | 1, 3 |

Beat 8 is deliberately in the demo: enterprises trust the failure story more than the happy path.

---

## Risks & mitigations

- **Tuple drift** (the existential one) → state-based writer + lag alerting + nightly reconciler + backfill
  command. Worst case bounded to the reconciliation interval; repairs logged as upstream-bug signals.
- **Wrong model = security bug** → store tests mandatory in CI for every model change, both repos.
- **Check latency on hot paths** → FGA co-located (same compose network), `BatchCheck`/`ListObjects` for
  lists, field-policy matrix cached. Do **not** cache individual check results initially (staleness risk >
  latency win); revisit with data.
- **`AppType` weakening** → sensitive fields optional in DTOs is deliberate and documented; web client
  handles absence; one pilot resource (`employee`) first.
- **Self-host complexity creep** → exactly one extra container, same Postgres instance, zero extra stateful
  infra; document in the self-host guide (Plan 11).
- **Scope creep into FGA** → entitlements, assurance, idempotency stay where they are (stated above).
- **Agent surface collisions** → disjoint surfaces + WS0 contracts + reporter cross-checks; an integration
  conflict is treated as a design violation, not rebased away.

---

## Definition of done

- A leave approval is authorized by `requireRelation` resolving the org graph — zero hand-rolled supervisor
  lookups remain in the pilot routes; delegation works via one conditioned tuple incl. expiry.
- `assertOrg` still guards every FGA-checked route (defense in depth verified by a scenario test).
- Killing OpenFGA makes guarded routes return 503 `AUTHZ_UNAVAILABLE` — never 200 (fail-closed test).
- An org-graph mutation propagates to FGA via the outbox; replay/reorder tests prove convergence; the
  reconciler repairs an injected drift and logs it; lag metrics exported.
- `employee` responses omit field groups the caller doesn't hold; writes to unheld groups → 403
  `FORBIDDEN_FIELD`; `?sort=salary` is rejected for callers without `compensation`; `identity`/`medical`
  reads produce audit rows.
- A tenant admin flips a `field_policy` row and the change takes effect without deploy (cache invalidation
  test).
- FGA store tests run in CI; public CI passes with open-module fragments only.
- `plans/51-reports/SUMMARY.md` exists with every DoD item evidence-linked; the Meridian demo runbook
  executes end-to-end (beats 1–8).

---

## Open decisions (not blocking WS0–2)

- **HRBP modeling**: BU-scoped relation in core model (default above) vs a generic "scoped role" pattern —
  finalize in WS2 with store tests for both candidates.
- **Check-result caching**: off by default; revisit with latency data from WS5.
- **FGA-native field groups** (per-*instance* exceptions like "this employee's comp visible to their case
  manager"): deferred — the `field_policy` table can't express it; upgrade path is a `field_group` FGA type
  later without changing the enforcement seam.
- **Reconciler cadence**: nightly default; enterprises may buy a tighter SLA → make it per-org configurable
  later (entitlement `limits` jsonb is the natural home).
- **Which resources after `employee`**: documents (per-doc sharing — the literal Zanzibar case) is the
  strongest second; payroll's `payslip` proves the private-module fragment path.
