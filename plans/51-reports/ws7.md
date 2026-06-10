# Plan 51 WS7 Report — Demo + Seed (Meridian Manufacturing)

**Status:** DONE
**Branch:** plan51/integration
**Date:** 2026-06-10
**Model:** claude-sonnet-4-6

---

## Files Touched

| File | Action |
|------|--------|
| `scripts/seed-meridian.ts` | New — idempotent Bun seed script for Meridian Manufacturing demo org |
| `scripts/demo-smoke.ts` | New — HTTP smoke test for beats 1–8 with PASS/FAIL/SKIPPED per beat |
| `docs/demo-enterprise-authz.md` | New — enterprise demo runbook: prereqs, beat-by-beat curl + explanations, troubleshooting |
| `packages/authz/src/boot.ts` | New — `bootAuthz(extraFragments)` convenience helper (ensureStore + loadAuthzModel) |
| `packages/authz/src/index.ts` | +1 line: `export { bootAuthz } from './boot'` |
| `apps/api/src/index.ts` | Boot-wiring: calls `bootAuthz([])` at startup; logs storeId + modelId |
| `package.json` (root) | Added `demo:seed` + `demo:smoke` scripts |
| `plans/51-reports/ws7.md` | This report |

---

## Deliverable Status

### 1. `scripts/seed-meridian.ts` — DONE

Idempotent Bun script. Check-or-create by email/name for all entities. Builds:
- Org "Meridian Manufacturing" (VERIFIED status)
- BUs: Plants, Corporate
- Departments: Manufacturing (MFG), Finance (FIN)
- Teams: Assembly (under Manufacturing), Logistics (under Manufacturing)
- Personas: Priya (ADMIN/hr_admin), Rohan (MANAGER/Assembly), Sara (USER/Assembly), Dev (MANAGER/Logistics), Anita (USER/Plants BU HRBP)
- Employee profiles for all 5 (existing columns only — see compensation caveat)
- Leave type: Annual Leave
- Sara's pending leave request (via `applyLeave`; direct-insert fallback if balance check blocks on fresh org)
- FGA sync via `syncOrgTuples(orgId)` — wraps with try/catch so seed succeeds even if FGA not running
- Manual HRBP tuple for Anita on Plants BU (see HRBP caveat)
- Field policy: `hrbp/compensation/none` baseline for beat 4

Domain functions used (ctx-first): `createOrganization`, `createBusinessUnit`, `createDepartment`, `createTeam`, `createLeaveType`, `applyLeave`, `syncOrgTuples`. Direct DB inserts used for: `user` rows (no domain fn that creates a user without the invitation flow), `EmployeeProfile` rows (no bulk upsert fn), `team.managers` update, `organisation.status` update.

### 2. `scripts/demo-smoke.ts` — DONE

Bun script hitting the running API. Each beat is a named function. `--beat N` flag for single-beat runs. Reads persona IDs from `MERIDIAN_*` env vars. Prints PASS/FAIL/SKIPPED with elapsed ms.

| Beat | Mechanism | Notes |
|------|-----------|-------|
| 1 | `/internal/authz/explain` for Rohan and Dev on Sara's employee | explain returns paths; Dev's ID absent → PASS |
| 2 | `/internal/authz/reconcile` pre-check; prints curl for delegation POST | Full session flow documented in runbook |
| 3 | explain + outbox `/internal/authz/outbox` + reconcile | Shows lag metric and viewer relation state |
| 4 | `/field-policies?resource=employee` reachability (401/403 = wired) | Prints curl sequence for live demo |
| 5 | `GET /employees?sort=salary` without session → 401/403 | Full session-based test in runbook |
| 6 | SKIPPED — API keys not in Plan 51 scope | Reason printed |
| 7 | `/internal/authz/explain` for Priya viewer on Sara | Prints paths |
| 8 | `/internal/authz/reconcile/:orgId` alive + repair count | Docker stop/start instructions printed |

### 3. `docs/demo-enterprise-authz.md` — DONE

Runbook with: prerequisites (docker compose, db:push, demo:seed, worker), all 8 beats with enterprise pitch sentence, exact curl commands, expected output, "what to say while it runs" notes, and a troubleshooting section covering: FGA store not initialized, HRBP tuple missing, compensation fields absent, FGA tuples empty, worker not running, openfga-db-init failures.

### 4. Boot-time `ensureStore` + `ensureModel` wiring — DONE

Added `packages/authz/src/boot.ts` with `bootAuthz(extraFragments)`:
- Calls `ensureStore('avkash')` → sets store ID on the singleton client
- Instantiates a store-scoped `OpenFgaClient` for the model write
- Calls `loadAuthzModel(client, storeId, extraFragments)` → write-iff-changed

Wired in `apps/api/src/index.ts` as a fire-and-forget promise (server starts even if FGA is temporarily unreachable; guarded routes return 503 until FGA recovers and the next `bootAuthz` re-run).

Resolves WS1 open issue #3: "ensureStore() at API boot — not yet wired".

---

## Static Verification

| Gate | Result |
|------|--------|
| `pnpm typecheck` | ✅ 24/24 packages |
| `pnpm lint` | ✅ 24/24 packages (0 errors) |
| `bun build scripts/seed-meridian.ts --target bun` | ✅ Parse + bundle clean (workspace imports resolved at runtime) |
| `bun build scripts/demo-smoke.ts --target bun` | ✅ Parse + bundle clean |

---

## What is Verified Statically vs. Deferred to Live

### Statically verified
- TypeScript correctness of all new files
- Import paths resolve at compile time (JIT packages, workspace imports)
- `seed-meridian.ts` uses only exported domain functions from `@avkash/org`, `@avkash/users`, `@avkash/leave`, `@avkash/authz-sync`, `@avkash/authz`
- `demo-smoke.ts` has no external deps beyond standard `fetch` (built into Bun/Node)
- `boot.ts` function signature and types correct
- `bootAuthz` export visible from `@avkash/authz`

### Deferred to live (requires running Docker stack)
- `pnpm demo:seed` end-to-end against Postgres + OpenFGA
- `pnpm demo:smoke` against the running API (all 8 beats)
- FGA tuple writes / reads (authz:backfill, syncOrgTuples)
- `bootAuthz` at API boot: ensureStore → actual FGA store creation
- `ensureModel` writing core.fga DSL to FGA
- Beat 1/2/4/5 full session-based flows (require session cookies for persona users)
- `openfga-db-init` + `openfga-migrate` one-shot containers

---

## Caveats

### 1. HRBP manual tuple (critical for beat 4)

**Root cause:** `BusinessUnit` table has no `hrbpUserId` column. The FGA model defines `business_unit.hrbp: [user]` but `deriveExpectedTuples` in `packages/authz-sync/src/derive.ts` does not emit this tuple (no DB source for it).

**Current approach:** `seed-meridian.ts` writes the tuple directly via `authzClient.writeTuples([{user: userRef(anitaId), relation: 'hrbp', object: objectRef(FGA_TYPES.businessUnit, buPlantsId)}], [])`.

**Problem:** The nightly reconciler (`reconcileAllOrgs` → `syncOrgTuples`) will remove this tuple the next time it runs, because `deriveExpectedTuples` does not derive it.

**Workaround for demo:** Re-run `pnpm demo:seed` before each demo session to restore the tuple.

**Long-term fix:** Add `hrbpUserId uuid` nullable column to `BusinessUnit` schema, run `db:push`, instrument `deriveBUTuples` in `derive.ts` to emit `hrbp` tuples when set. This is a small DB+WS3 follow-up.

### 2. Compensation/identity/medical schema columns missing

**Root cause:** `EmployeeProfile` does not have `salary`, `bankAccount`, `pan`, `aadhaar`, `passport`, `disability`, `conditions` columns yet (WS4 noted this as forward-compatibility, open issue #2).

**Impact:** Beat 4 (field-level visibility) demonstrates the field-group enforcement infrastructure (policy flip, cache invalidation, FORBIDDEN_FIELD on sort) but the actual compensation fields are absent from Sara's profile because the DB columns don't exist.

**Workaround:** Beat 4 demo uses existing profile fields and the policy flip mechanics. The core behaviour (field absent from JSON, not null) is demonstrable on any group-mapped field.

**Long-term fix:** Add columns to `packages/db/src/schema/employee.ts`, `pnpm db:push`, update `EMPLOYEE_FIELD_GROUPS` mappings. The enforcement seam is already in place.

### 3. API key (beat 6) not implemented

**Root cause:** Resource-scoped API keys (Plan 49 Seam 2) are not in scope for Plan 51 WS1–7. The `requireScope` hook exists but nothing populates scopes from FGA resource-type tuples.

**Impact:** Beat 6 is SKIPPED in `demo:smoke` with a descriptive reason.

**Long-term fix:** Plan 49 Seam 2 implementation. When done, add a `partner:key:xyz scope business_unit:plantsId` FGA type + tuple, and wire `requireScope` → FGA check.

### 4. Smoke script beat 1/2/4/5 require session tokens for full verification

**Root cause:** The smoke script uses the internal-auth token for `GET /internal/authz/*` endpoints, but beats 1, 2, 4, 5 require actual session cookies for the tenant-facing routes (`/leaves`, `/employees`, `/field-policies`, `/delegations`).

**Current behaviour:** Beats use the explain/reconcile/outbox internal endpoints as proxy checks, plus print the exact curl commands for the live session-based demo.

**Long-term fix:** A session-factory helper (create a session via `/api/auth/sign-in` with test credentials) could make the smoke fully automated. Not implemented here to keep the smoke script simple and environment-agnostic.

### 5. `bootAuthz` is fire-and-forget (not blocking)

**Design decision:** `apps/api/src/index.ts` calls `bootAuthz([]).then(...).catch(...)` without `await` — the server starts even if FGA is unreachable at boot. This is intentional:
- The `/health/ready` probe catches FGA unavailability (returns 503 until FGA is up)
- Orchestrators (k8s, ECS) route traffic only when ready
- Operators see the error in logs immediately
- A blocking boot would cause restart loops if FGA has a cold-start lag (which `openfga-migrate` introduces on first deploy)

---

## Deviations from Plan

1. **`bootAuthz` in new file vs. inline in `apps/api`**: Created `packages/authz/src/boot.ts` rather than inlining in `apps/api/src/index.ts`. This keeps the boot logic testable and allows future callers (e.g. `apps/worker`) to call it too.

2. **Sara leave application fallback**: `applyLeave` validates balance, which may fail on a fresh org with no leave policy configured. Added a direct-insert fallback so `demo:seed` always produces a pending leave request regardless of policy state.

3. **Team department linking**: Departments have no `businessUnitId` column. The BU linkage for "Manufacturing under Plants" is expressed via the team's `departmentId` and the users' `businessUnitId` field (soft FK). The FGA model handles BU scoping via the `hrbp` tuple chain.

---

## Open Issues

1. **HRBP manual tuple reconciler drift** (see caveat 1) — needs `BusinessUnit.hrbpUserId` column + derive.ts instrumentation.
2. **Beat 2 full delegation smoke** — needs a session-factory helper.
3. **Beat 4/5 compensation schema columns** — needs EmployeeProfile schema additions.
4. **`fga model test` CLI** — `@openfga/cli` not published to npm; store tests authored in `core.fga.yaml` but live execution deferred to CI with binary.
5. **`bootAuthz` extraFragments TODO** — currently always `[]`; TODO comment in `apps/api/src/index.ts` for Plan 49 Phase 3 module registry wiring.
