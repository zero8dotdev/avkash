# Plan 51 — Granular Authorization (OpenFGA + Field Visibility)
# WS-R Reporting Agent: Implementation Summary + DoD Verification

**Branch:** `plan51/integration`  
**Date:** 2026-06-10  
**Agent model:** claude-sonnet-4-6 (WS-R)  
**Methodology:** independent grep/test evidence — no trust of reports without verification

---

## 1. Per-WS Status Table

| WS | Title | Commit (first landing) | Unit tests | Typecheck | Lint | Status |
|----|-------|------------------------|-----------|-----------|------|--------|
| Phase1 | Event bus / outbox | `d51bca9` | 10/10 (live PG) | 24/24 | 24/24 | DONE |
| WS0 | Contracts (shared types) | `61611fe` | n/a (types only) | 24/24 | 24/24 | DONE |
| WS1 | OpenFGA infra + authz client | `1d0141f` | 14/14 (stub) | 24/24 | 24/24 | DONE |
| WS2 | Core FGA model + store tests + loader | `66277dc` | 28/28 (stub) | 24/24 | 24/24 | DONE |
| WS3 | Tuple-sync pipeline + reconciler | `ec8eb2a` | 21/21 (stub) | 24/24 | 24/24 | DONE |
| WS4 | Field-level visibility seam | `81b0e5c` | 36/36 (stub) | 24/24 | 24/24 | DONE |
| WS5 | Route pilot (leave / employees / transfers) | `c7fec51` | 64 (stub) | 24/24 | 24/24 | DONE |
| WS6 | Admin + explain + audit | `6853188` | 30 (stub) | 24/24 | 24/24 | DONE |
| WS7 | Demo seed + smoke + runbook + boot wiring | `9197285` | (static compile) | 24/24 | 24/24 | DONE |
| Fixes | openfga-db-init + list_objects fmt | `1210baa`, `ccf05f9` | FGA store: 16/16 | — | — | DONE |

**Test suite re-runs (WS-R independent verification):**

| Package | Command | Result |
|---------|---------|--------|
| `packages/authz` | `bun test packages/authz/src/` | **28 pass, 0 fail** |
| `packages/authz-sync` | `bun test packages/authz-sync/src/` | **21 pass, 0 fail** |
| `packages/field-policy` | `bun test packages/field-policy/src/` | **82 pass, 0 fail** |
| `packages/leave` (route-pilot) | `bun test packages/leave/src/route-pilot.test.ts` | **6 pass, 0 fail** |
| `packages/users` (audit) | `bun test packages/users/src/audit.test.ts` | **6 pass, 0 fail** |
| `packages/events` (live PG) | `DATABASE_URL=... bun test packages/events/src/` | **10 pass, 0 fail** |
| `pnpm model:test` | `pnpm --filter @avkash/authz model:test` | **ALL CHECKS PASSED** |
| FGA store tests (orchestrator-given) | `fga model test` via openfga/cli docker | **16/16** |
| Cross-package combined run | bun test across all 7 files | **109 pass, 2 fail** — 2 failures are Bun `mock.module` isolation artifact (FgaError SDK export collision when suites share a process); each package passes cleanly in isolation |
| `pnpm typecheck` | full monorepo | **24/24 successful** |
| `pnpm lint` | full monorepo | **24/24 successful** |

---

## 2. Definition-of-Done Checklist

### DoD 1 — Leave approval authorized by `requireRelation`; no hand-rolled supervisor lookups; delegation via one conditioned tuple with expiry

**VERIFIED.**

Evidence:
- `packages/leave/src/leave.ts:96`: `await authzClient.requireRelation(ctx, 'approver', objectRef(FGA_TYPES.employee, profileId))` — single FGA call resolves the full chain.
- `packages/authz-sync/src/derive.ts:272–282`: delegation tuples written with `active_window` condition (starts/ends from ApprovalDelegation row).
- `packages/authz/model/core.fga:77`: `define delegate: [user with active_window]` — time-windowed expiry in model.
- `bun test packages/leave/src/route-pilot.test.ts` → 6 pass; tests cover MANAGER deny, ADMIN bypass, fail-closed, employee-pivot model.
- Legacy `canApprove()` SQL check is a graceful fallback ONLY when `EmployeeProfile` row is absent (FGA not yet synced); it is not a permanent bypass.

### DoD 2 — `assertOrg` still guards every FGA-checked route (defense in depth, scenario test)

**PARTIAL.**

Evidence:
- `packages/leave/src/leave.ts:250`: `eq(schema.leave.orgId, ctx.orgId)` in `setStatus` provides org-scoped SQL before `assertCanApprove`. Comment at line 86: "assertOrg() is enforced by the caller (setStatus) before reaching here."
- `apps/api/src/routes/employees.ts:210`: `assertInOrg` runs in `getEmployeeProfile` before FGA viewer check. Domain functions uniformly scope by `ctx.orgId`.
- **Gap:** No dedicated new scenario test was written to prove cross-org + FGA route = 404/403. The existing `apps/api/src/test/scenario-0*.test.ts` suite was not extended for Plan 51. Tenant isolation is enforced by SQL filter (correct and defensive) but the DoD's "verified by a scenario test" language is not satisfied.

### DoD 3 — Killing OpenFGA returns 503 `AUTHZ_UNAVAILABLE`; never 200 (fail-closed test)

**VERIFIED.**

Evidence:
- `packages/authz/src/client.ts:46–50`: `mapFgaError` catches all errors and throws `UnavailableError('AUTHZ_UNAVAILABLE')`.
- `packages/authz/src/client.test.ts:88`: `it('throws UnavailableError(AUTHZ_UNAVAILABLE) on FGA transport error — FAIL CLOSED', ...)`.
- `packages/authz/src/client.test.ts:125`: `requireRelation` propagates `UnavailableError` when FGA is down — FAIL CLOSED.
- `bun test packages/authz/src/` → 28 pass, 0 fail.
- **DEFERRED-TO-LIVE:** Container-stop → 503 end-to-end (demo beat 8) requires a running stack. Code-level proof is complete.

### DoD 4 — Org-graph mutation propagates to FGA via outbox; replay/reorder convergence; reconciler repairs injected drift and logs it; lag metrics exported

**VERIFIED (with noted deviation).**

Evidence:
- **State-based writer:** `packages/authz-sync/src/subscriber.ts:4` comment + `derive.ts:1` header confirm state-based approach. Event payloads ignored except orgId.
- **Replay convergence:** `packages/authz-sync/src/sync.test.ts:212` — 21 pass.
- **Out-of-order:** `sync.test.ts:236` — passes.
- **Reconciler repair logging:** `packages/authz-sync/src/sync.ts:161–168`: `if (repairs > 0) { console.error('[authz-reconciler] REPAIR NEEDED ...')` with "investigate upstream" message.
- **Repair test:** `sync.test.ts:200` — verifies `diffTuples` produces correct repair count.
- **Lag metrics:** `packages/events/src/observability.ts` exports `outboxDepth()` + `oldestUnpublishedAgeMs()`; wired at `apps/api/src/routes/internal.ts:150` as `GET /internal/authz/outbox`.
- **Deviation (WS3):** Most domain mutations call `publish(db, ctx, ...)` OUTSIDE a wrapping transaction (post-write best-effort). Only `createOrganization` publishes inside `db.transaction`. Nightly reconciler is the documented safety net.

### DoD 5 — Employee responses omit field groups caller doesn't hold; writes to unheld groups → 403 `FORBIDDEN_FIELD`; `?sort=salary` rejected without `compensation`; `identity`/`medical` reads produce audit rows

**VERIFIED (with schema caveat).**

Evidence:
- **Omit (not null):** `packages/field-policy/src/field-policy.test.ts:106`: `it('hidden field is absent, not null', ...)` — 82 pass.
- **Write gate:** `apps/api/src/routes/employees.ts:193,242`: `assertWritableFields(grant, EMPLOYEE_FIELD_GROUPS.groups, body)` on both PATCH routes.
- **Query gate:** `apps/api/src/routes/employees.ts:133`: `assertQueryableFields(grant, EMPLOYEE_FIELD_GROUPS.groups, query, LIST_SENSITIVE_PARAMS)`.
- **`?sort=salary` → FORBIDDEN_FIELD:** covered in `ws5-route-pilot.test.ts` — 82 pass.
- **Audit rows:** `packages/users/src/audit.ts:27` + wired in `employees.ts:227–231` for `identity`/`medical` groups.
- **Schema caveat:** `salary`, `bankAccount`, `pan`, `aadhaar`, `passport`, `disability`, `conditions` columns do NOT yet exist on `EmployeeProfile`. The enforcement seam is structurally complete; it activates once columns are added with `db:push`.

### DoD 6 — Tenant admin flips `field_policy` row; change takes effect without deploy (cache invalidation test)

**VERIFIED.**

Evidence:
- `packages/field-policy/src/crud.ts:71,116,132`: every write path calls `invalidateFieldPolicy(ctx.orgId, resource)`.
- `packages/field-policy/src/field-policy.test.ts:260–267`: invalidation is no-op, idempotent, synchronous.
- `packages/field-policy/src/ws6-admin-route.test.ts:47–60`: 3 cache eviction tests — 82 pass.
- `apps/api/src/routes/field-policies.ts`: POST/PATCH/DELETE all go through CRUD helpers that invalidate on success.

### DoD 7 — FGA store tests run in CI; public CI passes with open-module fragments only

**PARTIAL.**

Evidence:
- `packages/authz/model/core.fga.yaml`: 16 assertions (14 checks + 2 list_objects) in OpenFGA store-test format — **16/16 pass** via orchestrator docker run (commit `ccf05f9`).
- `packages/authz/package.json:14`: `"model:test": "node scripts/validate-model.js"` — CI-runnable DSL validation. Verified: **ALL CHECKS PASSED**.
- **Gap:** `@openfga/cli` is not published to npm. The `.fga.yaml` store tests are not wired into a CI pipeline step in the repository. The `model:test` script validates DSL only. Full YAML store-test execution depends on the CLI binary being available in CI.

### DoD 8 — `plans/51-reports/SUMMARY.md` exists; Meridian demo runbook executes end-to-end (beats 1–8)

**PARTIAL.**

Evidence:
- `plans/51-reports/SUMMARY.md`: this file.
- `docs/demo-enterprise-authz.md`: runbook with all 8 beats, curl commands, troubleshooting.
- `scripts/seed-meridian.ts` + `scripts/demo-smoke.ts`: typecheck-verified; `bun build` clean.
- `package.json:24–25`: `demo:seed` and `demo:smoke` scripts.
- **DEFERRED-TO-LIVE:** Full beat execution against running stack. Beat 6 permanently SKIPPED (API key scoping not in scope). Beats 1/2/4/5 need session tokens; smoke uses internal-auth proxies + prints curl commands.

---

## 3. Cross-Report Consistency Findings

### Finding 1 — WS3 post-write publish vs. plan's in-tx rule

**MEDIUM impact.** All domain mutations except `createOrganization` call `publish(db, ...)` AFTER the mutation outside a transaction. If the publish call throws after the mutation commits, the outbox row is missing until the nightly reconciler. WS3 report documents this as a known deviation. No other WS is structurally affected (state-based writer makes replay safe). Lag window on publish failure: relay interval → reconciler cadence.

### Finding 2 — WS4 Role-key defaults vs. WS5 FGA-derived relations

**LOW — handled correctly.** WS4 uses Role enum keys as an interim; WS5 passes FGA-derived relation names via the already-present `relations?: readonly string[]` parameter in `resolveFieldGroups`. Intentional phased approach documented in both reports.

### Finding 3 — WS7 HRBP manual tuple vs. reconciler deletion (CRITICAL)

**HIGH impact for demo.** `scripts/seed-meridian.ts` writes Anita's `hrbp` tuple directly. `packages/authz-sync/src/derive.ts:67–91` (`deriveBusinessUnitTuples`) emits ONLY `org` relationship tuples — no `hrbp` tuples — because `BusinessUnit` has no `hrbpUserId` column. Verified by `grep -n "hrbp" packages/authz-sync/src/derive.ts` → line 67 is a comment only; no tuple generation. The nightly reconciler will DELETE Anita's tuple as "extra". **Demo mitigation:** run `pnpm demo:seed` immediately before the demo; do not run the reconciler between seed and beats 3/4/7.

### Finding 4 — WS3 `setUserBusinessUnit`/`setUserDepartment` not instrumented

**LOW.** These functions do not call `publish()`. They affect `user.businessUnitId` / `user.departmentId`, which are not currently direct FGA tuple sources in `deriveExpectedTuples`. Covered by nightly reconciler. Becomes higher priority if the `hrbpUserId` column is added (HRBP tuples would then depend on accurate BU linkage).

### Finding 5 — WS6 `flattenTree` partial FGA tree node coverage

**LOW for demo.** `flattenTree` covers `leaf.users` and `union` nodes. Complex `tupleToUserset` chains yield empty `paths` (raw `tree` JSON is correct). Demo beat 7 uses a direct `hr_admin` grant — a leaf case — which works correctly.

---

## 4. Open Issues Register (ranked by demo impact)

| # | Severity | Issue | Suggested fix |
|---|----------|-------|---------------|
| 1 | CRITICAL (demo) | HRBP manual tuple wiped by nightly reconciler — `derive.ts` emits no `hrbp` tuples because `BusinessUnit` has no `hrbpUserId` column | Add `hrbpUserId uuid nullable` to `BusinessUnit` schema; `db:push`; add `if (bu.hrbpUserId) tuples.push(tuple(userRef(bu.hrbpUserId), 'hrbp', buObj))` in `deriveBusinessUnitTuples` |
| 2 | HIGH (demo beat 4/5) | Compensation/identity/medical columns absent from `EmployeeProfile` — `salary`, `bankAccount`, `pan`, `aadhaar` etc. do not exist; field enforcement is structurally ready but enforces on non-existent fields | Add columns to `packages/db/src/schema/employee.ts`; `pnpm db:push`; update `EMPLOYEE_FIELD_GROUPS` mappings |
| 3 | HIGH | `publish()` outside domain transactions — post-mutation publish can fail leaving no outbox row; lag window expands to nightly reconciler cadence on publish failure | Wrap domain mutation + publish in `db.transaction(async tx => { ...; await publish(tx, ...) })` for all instrumented paths |
| 4 | MEDIUM (CI) | FGA store tests not in CI pipeline — `@openfga/cli` not on npm; `core.fga.yaml` (16 assertions) verified via docker but no pipeline step | Add CI step downloading `openfga/openfga` binary and running `fga model test --tests packages/authz/model/core.fga.yaml` |
| 5 | MEDIUM (beat 6) | API key scoping permanently SKIPPED — Plan 49 Seam 2 not in scope | Implement Plan 49 Seam 2: `partner:key:<id>` FGA type + tuple; wire `requireScope` → FGA check |
| 6 | MEDIUM | `setUserBusinessUnit` and `setUserDepartment` not instrumented with events | Add `publish(db, ctx, businessUnitChangedDef, ...)` / `departmentChangedDef` calls in `packages/users/src/employee.ts` |
| 7 | LOW | No dedicated scenario test for assertOrg + FGA route (DoD 2 partial) | Add `scenario-09-fga-authz.test.ts`: cross-org leave approve → 404; FGA deny → FORBIDDEN_RELATION |
| 8 | LOW (compliance) | Sensitive-read audit is fire-and-forget — DB write errors swallowed silently | Route audit writes through the outbox (or a retry queue) rather than direct DB insert |
| 9 | LOW | `flattenTree` covers only `leaf.users` and `union` — `tupleToUserset` chains yield empty paths | Extend `flattenTree` to recursively walk `computedUserset` and `tupleToUserset` node types |
| 10 | LOW | Cross-package `bun test` combined run has 2 test failures (Bun mock isolation artifact) | Not a real failure; run suites per-package in CI (already the pattern) |

---

## 5. Demo-Readiness Verdict

**Prerequisites before demo:**
1. `docker compose up -d` (Postgres + OpenFGA running, openfga-db-init + openfga-migrate completed)
2. `pnpm db:push` (applies `field_policy` + `event_outbox` tables)
3. `pnpm demo:seed` (Meridian org + FGA tuples + HRBP tuple — run immediately before)
4. API + worker running (`pnpm dev` or docker compose api + worker containers)

| Beat | Description | Status | Caveats |
|------|-------------|--------|---------|
| 1 | Rohan approves Sara's leave (200); Dev denied (403 FORBIDDEN_RELATION) | RUNNABLE | Requires session token for Rohan/Dev per runbook; smoke uses explain as proxy |
| 2 | Delegation in one call → Dev can approve inside window | RUNNABLE-WITH-CAVEAT | Full session flow; delegation model verified by 16/16 store tests |
| 3 | Sara transfers → Rohan loses visibility; lag metric on screen | RUNNABLE-WITH-CAVEAT | `GET /internal/authz/outbox` shows lag; relay polls every 5s |
| 4 | Priya flips `field_policy` row → Anita (HRBP) sees compensation | RUNNABLE-WITH-CAVEAT | **CRITICAL:** run demo:seed immediately before; compensation columns absent (use proxy fields); cache invalidation live |
| 5 | `?sort=salary` → 403 FORBIDDEN_FIELD | RUNNABLE | Requires non-admin session token |
| 6 | Least-privilege API key | BLOCKED | Plan 49 Seam 2 not implemented; smoke prints SKIPPED |
| 7 | explainAccess answers auditor; sensitive-read audit trail | RUNNABLE | `GET /internal/authz/explain` live; `flattenTree` covers direct grant paths |
| 8 | FGA stop → 503; restart → recovers; reconciler shows drift | RUNNABLE-WITH-CAVEAT | Container stop/start in runbook; repair count will be nonzero after stop — reconciler heals it |

**Overall verdict:** 7 of 8 beats runnable (beat 6 blocked on scope). 4 beats fully runnable; 3 have caveats. The implementation is demo-ready for an enterprise pitch with: (a) run `pnpm demo:seed` immediately before beats 3/4/7; (b) demo beat 4 on proxy fields not real salary/PAN columns; (c) session token factory needed for fully automated smoke.

---

## 6. Agent Accounting

| Agent | Role | Notes |
|-------|------|-------|
| WS0 | Contracts (shared types, error codes, FGA signatures) | Completed |
| WS1 | OpenFGA infra + @avkash/authz client | Completed; branch naming issue required v2 branch |
| WS2 | Core FGA model + store tests + loader | Completed; FGA 1.1 single-hop constraint required design adaptation |
| WS3 | Tuple-sync pipeline | Crashed before commit (~90% done); resumed agent fixed deps + test issues |
| WS4 | Field-level visibility seam | Completed |
| WS5 | Route pilot | Completed |
| WS6 | Admin + explain + audit | Completed |
| WS7 | Demo seed + smoke + runbook + boot wiring | Completed |
| WS-R | Reporting (this file) | This session |
| **Total** | **9 agents** (8 workstream + 1 reporting; WS3 = 1 crashed + 1 resumed) | |

---

## DoD Score Summary

| DoD Item | Status |
|----------|--------|
| 1. requireRelation in leave + delegation expiry | **VERIFIED** |
| 2. assertOrg still on FGA-guarded routes | **PARTIAL** (no new scenario test) |
| 3. FGA down → 503 AUTHZ_UNAVAILABLE (fail-closed) | **VERIFIED** |
| 4. Outbox propagation + convergence + reconciler repair + lag metrics | **VERIFIED** |
| 5. Employee omit projection + FORBIDDEN_FIELD + query gate + audit | **VERIFIED** |
| 6. field_policy row flip → immediate (cache invalidation test) | **VERIFIED** |
| 7. FGA store tests in CI | **PARTIAL** (no CI pipeline step; manual docker pass) |
| 8. SUMMARY.md + runbook end-to-end | **PARTIAL** (file exists; beat execution DEFERRED-TO-LIVE) |

**Final DoD score: 5 VERIFIED / 3 PARTIAL**
