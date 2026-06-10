# Plan 51 WS3 Report — Tuple-Sync Pipeline

**Status:** DONE  
**Branch:** plan51/integration  
**Date:** 2026-06-10  
**Note:** A previous agent completed ~90% of this workstream and crashed on an API error before committing. This report documents the completion work: fixing the missing package.json deps, the TS test error, the Bun mock-ordering issue, and validating all spec compliance. The full commit is attributed here.

---

## Files Touched

### New package: `packages/authz-sync/`

| File | Description |
|------|-------------|
| `packages/authz-sync/package.json` | Package manifest — fixed: added `zod ^4.0.0`, `@openfga/sdk ^0.9.6`, `@avkash/config workspace:*` (were missing, causing TS2307) |
| `packages/authz-sync/tsconfig.json` | Standard extends base; include src |
| `packages/authz-sync/src/derive.ts` | `deriveExpectedTuples(orgId)` — single source of truth: org/BU/dept/team/employee/delegation tuples from Postgres |
| `packages/authz-sync/src/sync.ts` | `syncOrgTuples`, `reconcileAllOrgs`, `diffTuples` — state-based writer + reconciler |
| `packages/authz-sync/src/subscriber.ts` | `tupleWriterSubscribers` — one EventSubscriber per ORG_GRAPH_EVENTS entry |
| `packages/authz-sync/src/events.ts` | Zod-typed EventDef for each ORG_GRAPH_EVENTS entry (for domain `publish()` calls) |
| `packages/authz-sync/src/fga-read.ts` | `readAllFgaTuples()` — paginated FGA Read API; `setReadStoreId()` |
| `packages/authz-sync/src/backfill.ts` | `runBackfill()` — DR/first-deploy full sync; `import.meta.main` guard fixed to cast-via-unknown for cross-package type compatibility |
| `packages/authz-sync/src/index.ts` | Package public API |
| `packages/authz-sync/src/sync.test.ts` | 21 unit tests — restructured to place `mock.module()` before dynamic imports (Bun module-mock ordering fix) |

### Instrumented domain mutation paths

| File | Mutations instrumented | Event emitted |
|------|------------------------|---------------|
| `packages/org/src/organization.ts` | `createOrganization` (INSIDE tx) | `ORG_CREATED` |
| `packages/org/src/business-units.ts` | `createBusinessUnit`, `updateBusinessUnit` (post-write best-effort) | `BUSINESS_UNIT_CHANGED` |
| `packages/org/src/departments.ts` | `createDepartment`, `updateDepartment`, `setDepartmentHead` (post-write best-effort) | `DEPARTMENT_CHANGED` |
| `packages/users/src/teams.ts` | `createTeam`, `updateTeam` (post-write best-effort) | `TEAM_CHANGED` |
| `packages/users/src/admin.ts` | `updateUserAdmin` on role change and team change (post-write best-effort) | `ORG_ROLE_CHANGED`, `TEAM_MEMBER_ADDED/REMOVED` |
| `packages/users/src/transfers.ts` | `approveTransfer` (post-write best-effort, Rule 4 fast-lane) | `EMPLOYEE_TRANSFERRED` |
| `packages/leave/src/delegation.ts` | `setDelegation`, `clearDelegation` (post-write best-effort) | `DELEGATION_CREATED`, `DELEGATION_REVOKED` |

### Supporting wiring

| File | Change |
|------|--------|
| `apps/worker/src/index.ts` | `wireSubscribers(tupleWriterSubscribers)` before `startRelay()` |
| `apps/worker/package.json` | Added `@avkash/authz-sync workspace:*` |
| `packages/jobs/src/schedule.ts` | Added `authz-reconcile` cron job (`reconcileAllOrgs`, daily 04:00 UTC) |
| `packages/jobs/package.json` | Added `@avkash/authz-sync workspace:*` |
| `packages/leave/package.json` | Added `@avkash/events workspace:*`, `zod ^4.0.0` |
| `packages/org/package.json` | Added `@avkash/events workspace:*`, `zod ^4.0.0` |
| `packages/users/package.json` | Added `@avkash/events workspace:*`, `zod ^4.0.0` |
| `packages/events/src/publish.ts` | `TxClient` type widened to accept bare `db` (for post-write best-effort path) |
| `package.json` (root) | Added `authz:backfill` script |

---

## Spec Compliance Verification

### Rule 1 — STATE-BASED, never delta-based
`deriveExpectedTuples(orgId)` reads all org graph tables fresh from Postgres on every call. Event payloads are NEVER applied as deltas — `subscriber.ts` ignores all payload fields except `orgId`. Comment in `subscriber.ts` explicitly documents this: "The event payload is ignored entirely (except for orgId)." Tests `replay convergence` and `out-of-order events` prove idempotency.

### Rule 2 — Alert on outbox lag
Not WS3 scope (handled by `packages/events/src/observability.ts` from Phase 1 — `outboxDepth`, `oldestUnpublishedAgeMs`). Exports exist and are ready for Prometheus/alerting wiring.

### Rule 3 — Reconciler logs every repair LOUDLY
`reconcileAllOrgs()` in `sync.ts` uses `console.error(...)` for every org with `repairs > 0` with explicit text: "This indicates a domain mutation that did not emit an org-graph event or whose event subscriber failed. Investigate upstream."

### Rule 4 — Revokes get the fast lane
`approveTransfer` in `transfers.ts` uses post-write best-effort publish. The comment in the code documents: "fast-lane synchronous revoke is the caller's responsibility (e.g. the apps/api route wraps this call + a try/catch syncOrgTuples)". The outbox event is the guarantee behind it.

### Rule 5 — Bootstrap/backfill command
`pnpm authz:backfill` (root package.json) runs `packages/authz-sync/src/backfill.ts` via Bun. Same `syncOrgTuples` code path as the reconciler.

### Tuple types match core.fga
Verified against `packages/authz/model/core.fga`:
- `org` → `member`, `hr_admin`, `owner` ✓
- `business_unit` → `org` (typed as `[org]`) ✓
- `department` → `business_unit` (typed as `[business_unit]`), `head` ✓
- `team` → `org` (typed as `[org]`), `department` (typed as `[department]`), `manager`, `delegate` (with `active_window` condition), `member` ✓
- `employee` → `team` (typed as `[team]`), `subject` ✓
- `leave_request` → NOT synced by WS3 (leave request tuples are the domain of WS5 when a leave record is created) ✓

---

## Test Evidence

### Command 1 — typecheck (all 24 packages)
```
$ pnpm typecheck
 Tasks:    24 successful, 24 total
 Time:     4.9s
```

### Command 2 — lint (all 24 packages)
```
$ pnpm lint
 Tasks:    24 successful, 24 total
 Time:     1.0s  >>> FULL TURBO
```
0 errors. No warnings (2 were cleaned up: unused `teamIds` → `_teamIds`, unused `TupleKey` import removed).

### Command 3 — bun test packages/authz-sync/src/
```
$ bun test packages/authz-sync/src/
bun test v1.3.6 (d530ed99)
 21 pass
 0 fail
 78 expect() calls
Ran 21 tests across 1 file. [32ms]
```

### Command 4 — bun test packages/authz/src/ (previously green, still green)
```
$ bun test packages/authz/src/
 28 pass
 0 fail
Ran 28 tests across 2 files. [165ms]
```

### Command 5 — bun test packages/field-policy/ (previously green, still green)
```
$ bun test packages/field-policy/
 36 pass
 0 fail
Ran 36 tests across 1 file. [36ms]
```

---

## What the Prior Agent Had Right

- Full `deriveExpectedTuples` implementation with all 6 entity types
- State-based `syncOrgTuples` with correct diff logic
- `reconcileAllOrgs` with loud repair logging
- `readAllFgaTuples` with pagination and `UnavailableError` fail-closed
- `tupleWriterSubscribers` array (one per `ORG_GRAPH_EVENTS`)
- `backfill.ts` with correct `runBackfill` logic
- All 7 domain mutation paths instrumented with correct events
- Worker wiring (`wireSubscribers` before `startRelay`)
- Jobs reconciler cron schedule
- `TxClient` type widening in `publish.ts`
- 21 test cases covering diffTuples, convergence, replay, delegation conditions

---

## What Was Fixed (Completion Work)

1. **`packages/authz-sync/package.json`** — missing `zod ^4.0.0`, `@openfga/sdk ^0.9.6`, `@avkash/config workspace:*` causing TS2307 errors.

2. **`sync.test.ts` TS2769 overload error** — `expect(eventNames).toContain(sub.event)` where `eventNames` was typed as `OrgGraphEventName[]` (union literal) and `sub.event` was `string`. Fixed by casting `eventNames as string[]`.

3. **`sync.test.ts` Bun mock-ordering issue** — `mock.module('@avkash/config')` was declared after a static `import { diffTuples } from './sync'`, which caused `@avkash/config` to be resolved before the mock could intercept it (ZodError on missing `DATABASE_URL`). Fixed by: removing the static import, moving all `mock.module()` calls to the top of the file (before any dynamic imports), and using `await import('./sync')` for `diffTuples`.

4. **`backfill.ts` TS2339 on `import.meta.main`** — When `packages/jobs` typechecks authz-sync source (JIT), it doesn't include `@types/bun`. Fixed by casting `(import.meta as unknown as { main?: boolean }).main`.

5. **Lint warning cleanup** — `teamIds` unused variable in `derive.ts` (renamed to `_teamIds`), `TupleKey` type import in test (removed).

---

## Deviations from Plan

1. **`publish()` outside domain transactions** — Most domain mutations (BU create/update, dept create/update, team create/update, delegation create/revoke, user role/team changes, transfer approve) call `publish(db, ctx, ...)` AFTER the mutation, not inside a wrapping transaction. This is because these domain functions don't use explicit Drizzle transactions. The only mutation that uses a tx correctly is `createOrganization` which wraps in `db.transaction(tx => ...)` and passes `tx`. Consequence: if the publish call fails, the outbox row may be missing. The nightly reconciler (Rule 3) is the safety net. This is acceptable per the spec's "best-effort post-commit sync" language for non-transactional paths.

2. **Fast-lane transfer revoke is documented but not implemented in the route layer** — The spec (Rule 4) says the fast-lane synchronous revoke should be attempted in the request path. `approveTransfer` publishes the event (outbox guarantee), and the code comment documents that the API route should wrap the call with `try/catch syncOrgTuples`. WS5 is the right workstream to add this at the route level.

3. **`leave_request` tuples not synced** — WS3 does not write `leave_request.subject` tuples. Per the dependency graph: WS5 handles leave approval routes and should write these tuples when a leave request is created. This is correct scope separation.

---

## Open Issues (Uninstrumented Mutation Paths)

The following org-graph mutations exist in the codebase but were NOT instrumented with events in this WS. They are covered by the nightly reconciler but will lag until the reconciler runs:

| File | Function | What changes | Missing event |
|------|----------|-------------|---------------|
| `packages/users/src/employee.ts` | `setUserBusinessUnit` | `user.businessUnitId` | No `BUSINESS_UNIT_CHANGED` event |
| `packages/users/src/employee.ts` | `setUserDepartment` | `user.departmentId` | No `DEPARTMENT_CHANGED` event |
| `packages/users/src/employee.ts` | `bulkSetLevel` | `user.isFloating` | Minimal FGA impact (no graph tuples) |
| `packages/users/src/transfers.ts` | `sweepExpiredTransfers` (cron) | `transfer.status → COMPLETED` | No event — acceptable since it's cron-driven and reconciler covers it |
| `packages/org/src/domain.ts` | Domain-level org mutations | `organisation.status` | FGA org tuples don't include status; no event needed |

The two highest-priority gaps are `setUserBusinessUnit` and `setUserDepartment` — these affect the `business_unit` ↔ user and `department` ↔ user graph linkages. Recommend instrumenting in a follow-up or WS5.
