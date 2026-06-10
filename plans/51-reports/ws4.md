# Plan 51 WS4 Report — Field-level visibility seam

**Status:** DONE  
**Branch:** plan51/ws4-field-visibility  
**Date:** 2026-06-10

---

## Files Touched

| File | Action |
|---|---|
| `packages/db/src/schema/field-policy.ts` | Created — `FieldPolicy` table (Deliverable 1) |
| `packages/db/src/schema/index.ts` | +1 line: `export * from './field-policy'` |
| `packages/db/src/schema/types.ts` | +`FieldPolicy` / `NewFieldPolicy` inferred types |
| `packages/shared/src/serialize.ts` | Extended `serialize()` with optional third `projection` arg (Deliverable 3) |
| `packages/field-policy/package.json` | Created — new just-in-time package |
| `packages/field-policy/tsconfig.json` | Created — extends `@avkash/tsconfig/base.json` |
| `packages/field-policy/src/resolver.ts` | `resolveFieldGroups`, `invalidateFieldPolicy`, in-memory cache (Deliverable 2) |
| `packages/field-policy/src/crud.ts` | CRUD helpers: `listFieldPolicies`, `upsertFieldPolicy`, `updateFieldPolicy`, `deleteFieldPolicy` |
| `packages/field-policy/src/write-gate.ts` | `assertWritableFields` (Deliverable 4) |
| `packages/field-policy/src/query-gate.ts` | `assertQueryableFields`, `QueryParamAnnotation` (Deliverable 5) |
| `packages/field-policy/src/employee-groups.ts` | `EMPLOYEE_FIELD_GROUPS` pilot declaration (Deliverable 6) |
| `packages/field-policy/src/index.ts` | Package exports |
| `packages/field-policy/src/field-policy.test.ts` | 36 tests covering all deliverables (Deliverable 7) |
| `plans/51-reports/ws4.md` | This report |

---

## Deliverables Summary

### 1. `field_policy` table (`packages/db/src/schema/field-policy.ts`)
- `id uuid PK defaultRandom`, `orgId uuid notNull references Organisation`, `resource varchar(128)`, `fieldGroup varchar(128)`, `relation varchar(128)`, `access varchar(16)`.
- `version integer notNull default(0)` — optimistic concurrency token (ETag / If-Match), matching the style of `core.ts` and `policy.ts`.
- `createdAt/updatedAt timestamp(6) notNull defaultNow()`, `createdBy/updatedBy varchar(255)` — matching `policy.ts` audit column style.
- `uniqueIndex('uq_field_policy')` on `(orgId, resource, fieldGroup, relation)`.
- `index('idx_field_policy_org_resource')` on `(orgId, resource)` — the primary cache-miss query.
- Exported from `schema/index.ts` with one added line (before `relations`/`types` which must remain last).
- `FieldPolicy` / `NewFieldPolicy` inferred types added to `schema/types.ts`.

### 2. `@avkash/field-policy` package
- Just-in-time package (exports `./src/index.ts`). Deps: `@avkash/shared`, `@avkash/db`, `@avkash/auth`, `drizzle-orm`.
- **Resolver** (`resolver.ts`): `resolveFieldGroups(ctx, resource, declared, relations?)` with resolution order: org override rows → manifest default. `relations` defaults to `[ctx.role]`; WS5 passes FGA-derived relations.
- **Cache**: `Map<string, CacheEntry>` keyed by `orgId:resource`, 30s TTL. Stampede protection via inflight `Map<string, Promise>`. `invalidateFieldPolicy(orgId, resource)` clears both maps.
- **CRUD** (`crud.ts`): `listFieldPolicies` (MANAGER+), `upsertFieldPolicy` (MANAGER+, on-conflict update with `sql` version bump), `updateFieldPolicy` (MANAGER+, CAS update on `version`), `deleteFieldPolicy` (MANAGER+). All invalidate cache on success.

### 3. `serialize` seam (`packages/shared/src/serialize.ts`)
- Optional third arg `{ grant: FieldGroupGrant, groups: Record<string, readonly string[]> }`.
- Collects hidden keys (fields in groups not in `grant.read`); builds projected object omitting them entirely.
- Two-arg calls are unchanged — the `if (!projection)` guard returns the parsed result directly.
- Wire semantics: key **absent** from response object (never `null`, never masked).

### 4. Write gate (`write-gate.ts`)
- `assertWritableFields(grant, groups, body)` — throws `ForbiddenError('FORBIDDEN_FIELD', { fields })` when body keys belong to groups outside `grant.write`. Opt-in for routes (WS5 will adopt).

### 5. Query side-channel gate (`query-gate.ts`)
- `assertQueryableFields(grant, groups, params, annotated)` — pure function, no DB calls.
- Two-pass: (1) explicit `QueryParamAnnotation[]` declarations checked against `grant.read`; (2) reverse-index of field names to groups catches raw field-name params (e.g. `?salary=50000`).
- Throws `ForbiddenError('FORBIDDEN_FIELD', { params })`.

### 6. Employee pilot declaration (`employee-groups.ts`)
- `EMPLOYEE_FIELD_GROUPS: ResourceFieldGroups` for `resource: 'employee'`.
- Groups: `basic` / `contact` / `employment` / `compensation` / `identity` / `medical`.
- Fields mapped from actual `EmployeeProfile` table columns and `userDto` public fields.
- Defaults matrix: `USER` → basic; `MANAGER` → basic+contact+employment; `ADMIN`/`OWNER` → all (write); `subject` → basic+contact (write) + employment+compensation (read); identity/medical → hr_admin only.
- `auditedGroups: ['identity', 'medical']`.
- **Note**: relation keys are Role names (`USER`, `MANAGER`, `ADMIN`, `OWNER`) plus a `subject` placeholder. WS5 will add FGA-derived relation keys (`manager`, `hr_admin`, `hrbp`, `subject`). The `resolveFieldGroups` signature already accepts `relations?: readonly string[]` for this.

### 7. Tests
- 36 tests across 7 `describe` blocks in `packages/field-policy/src/field-policy.test.ts`.
- **Executed**: `bun test` in `packages/field-policy` → **36 pass, 0 fail**.
- Coverage: projection omits correctly; two-arg backward compat (smoke); hidden = absent not null; write-gate rejects with `FORBIDDEN_FIELD`; all-forbidden listed together; query-gate rejects sort param; query-gate rejects field-name params (side channel); absent params safe; cache invalidation no-op; resolution precedence (pure logic test); write-implies-read accumulator.

---

## Gates

| Gate | Result |
|---|---|
| `pnpm install` | ✅ PASS (Done in 17s, new `@avkash/field-policy` package resolved) |
| `pnpm typecheck` | ✅ PASS — 21/21 packages successful |
| `pnpm lint` | ✅ PASS for all new/modified packages. Pre-existing failure in `@avkash/attendance` (`prefer-const` in `attendance.ts` line 186) — not introduced by this WS, no diff vs `plan51/integration`. |
| `bun test` (field-policy) | ✅ 36 pass, 0 fail |
| `bun test` (policy, regression) | ✅ 9 pass, 0 fail |

---

## Deviations from Plan

1. **`upsertFieldPolicy` vs pure CRUD**: Plan says "CRUD functions for field_policy rows". Added upsert (INSERT … ON CONFLICT DO UPDATE) as the primary creation path since the unique constraint makes idempotent creates the correct behavior for tenant admin configuration.

2. **Compensation/identity/medical fields on `EmployeeProfile`**: The current `EmployeeProfile` table (`packages/db/src/schema/employee.ts`) does not have `salary`, `bankAccount`, `pan`, `aadhaar`, `passport`, `disability`, `conditions`, or `bloodGroup` columns — these are declared in `EMPLOYEE_FIELD_GROUPS` as the **intended** field names for when those columns are added (WS5/WS6 or a future schema migration). The plan explicitly anticipates this ("put fields with no sensible group in 'basic'"). The groups are forward-compatible: the serialize projection silently omits group-fields that don't exist in the DTO. Noted for WS-R.

3. **`serialize` signature length**: TypeScript `Function.length` counts declared parameters (3 for the extended signature). The test was initially written with `.toBe(1)` then corrected — no code impact.

4. **Lint pre-existing failure**: `@avkash/attendance` has a `prefer-const` lint error on a variable in `attendance.ts:186`. This exists on `plan51/integration` and is not caused by this WS. All new/modified packages (`@avkash/field-policy`, `@avkash/shared`, `@avkash/db`) lint cleanly.

---

## Open Issues

1. **FGA relation keys in defaults**: `EMPLOYEE_FIELD_GROUPS.defaults` currently uses Role names. WS5 needs to add `manager`, `hr_admin`, `hrbp`, `subject` as explicit relation keys once FGA tuples are available. The `resolveFieldGroups(ctx, resource, declared, relations?)` signature already accepts these.

2. **Missing sensitive columns on `EmployeeProfile`**: Compensation (salary, bank), identity (PAN, Aadhaar, passport), and medical columns need schema additions (db:push gated) before the serialization gate is functionally enforced.

3. **`assertQueryableFields` route adoption**: Pending WS5 wiring. No existing route modified per spec.

4. **`assertWritableFields` route adoption**: Pending WS5 wiring. No existing route modified per spec.

5. **`db:push`**: Not run (per spec). Schema change will take effect when the deployer runs `pnpm db:push` (or `docker compose` rebuild).

6. **Audit rows for `identity`/`medical` reads**: `EMPLOYEE_FIELD_GROUPS.auditedGroups` declares the requirement. Actual audit-row emission is not implemented in this WS — it's an extension point at the `serialize` seam that WS6 will add.
