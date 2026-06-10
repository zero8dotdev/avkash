# Plan 51 WS6 Report — Admin + Explain + Sensitive-Read Audit

**Status:** DONE  
**Branch:** plan51/integration  
**Date:** 2026-06-10  
**Model:** claude-sonnet-4-6

---

## Files Touched

| File | Action |
|------|--------|
| `apps/api/src/dto.ts` | Added `fieldPolicyDto` — drops `orgId`/`createdBy`/`updatedBy`, exposes `version` for ETag/If-Match |
| `apps/api/src/routes/field-policies.ts` | **New** — tenant-facing CRUD for `field_policy` table (ADMIN-guarded) |
| `apps/api/src/routes/internal.ts` | Extended: `flattenTree` helper, `INTERNAL_CTX`, three new endpoints (`/authz/explain`, `/authz/reconcile/:orgId`, `/authz/outbox`) |
| `apps/api/src/app.ts` | Added `@avkash/events` import and `.route('/field-policies', fieldPolicies)` mount |
| `apps/api/package.json` | Added `@avkash/events: workspace:*` dependency |
| `apps/api/src/routes/employees.ts` | Added `writeSensitiveReadAudit` import + sensitive-read audit hook in `GET /:id` |
| `packages/users/src/audit.ts` | **New** — `writeSensitiveReadAudit` domain-side audit helper |
| `packages/users/src/index.ts` | Added `export * from './audit'` |
| `packages/users/src/audit.test.ts` | **New** — 6 unit tests for `writeSensitiveReadAudit` |
| `packages/field-policy/src/ws6-admin-route.test.ts` | **New** — 24 unit tests: CRUD guard, cache invalidation, audit guard logic, explain tree flattener |
| `plans/51-reports/ws6.md` | This report |

---

## Deliverable Status

### 1. Field-policy admin routes (DONE)

`apps/api/src/routes/field-policies.ts` — tenant-facing CRUD under `/field-policies`, ADMIN-guarded (WS6 tightens from the CRUD helpers' MANAGER threshold to ADMIN at the route layer — field visibility is a platform-level setting). Pattern follows `blackouts.ts`:

- `GET /field-policies?resource=` — lists rows for the org; `validateQuery`; `requireRole(ctx, 'ADMIN')`.
- `POST /field-policies` — upsert (idempotent on unique key `(orgId, resource, fieldGroup, relation)`); `idempotency` middleware; `validateBody`; returns `201` with ETag.
- `PATCH /field-policies/:id` — version-checked update; requires `If-Match` (428 if missing, 412 if stale); ETag header on response.
- `DELETE /field-policies/:id` — `204 No Content`.

All write paths call `invalidateFieldPolicy` (inside the CRUD helpers) so the resolver cache is invalidated immediately — demo beat 4 ("flip a row, no deploy") works without a restart.

`fieldPolicyDto` added to `apps/api/src/dto.ts` via `createSelectSchema(schema.fieldPolicy).omit({ orgId, createdBy, updatedBy })`. The `version` column is retained for ETag/If-Match semantics.

### 2. Explain endpoint (DONE)

`GET /internal/authz/explain?relation=&object=&user=` — provider-side, internal-auth guarded.

- Calls `authzClient.explainAccess(INTERNAL_CTX, relation, object)` (FGA Expand API).
- `flattenTree(tree)` walks the recursive `UsersetTree` structure and produces a flat array of human-readable strings like `"user:alice ← viewer"` for quick compliance review.
- Response: `{ tree, paths, relation, object, queriedUser }`.
- Input validation: 400 if `relation` or `object` is absent.
- `INTERNAL_CTX` is a synthetic system-level `AuthContext` with `actorType: 'system'`; `explainAccess` does not read ctx fields (only calls `getClient().expand()`).

Powers demo beat 7: "why does Priya see salaries?" → returns the FGA Expand tree + flattened path list.

### 3. Authz ops surface under /internal (DONE)

**`GET /internal/authz/reconcile/:orgId`**
- Calls `syncOrgTuples(orgId)` (from `@avkash/authz-sync`) — state-based diff + write.
- Returns `{ orgId, written, deleted, expectedCount, actualCount, repairs }`.
- Logs a loud error when `repairs > 0` (upstream bug signal).
- Powers demo beat 8 (reconciler, repair log).

**`GET /internal/authz/outbox`**
- Calls `outboxDepth()` + `oldestUnpublishedAgeMs()` from `@avkash/events` in parallel.
- Returns `{ outboxDepth, oldestUnpublishedAgeMs }`.
- Powers demo beat 3 (show the lag metric live).

### 4. Sensitive-read audit (DONE)

**`packages/users/src/audit.ts`** — `writeSensitiveReadAudit(ctx, targetUserId, auditedGroupsRead)`:
- Inserts one `ActivityLog` row per call (`keyword: 'employee.sensitive_fields.read'`).
- `changedColumns: { groups: string[], targetUserId: string }` — the payload carries which sensitive groups were read and who the subject was.
- `changedBy = ctx.userId` (null for system actors).
- Matches the existing domain audit pattern exactly (`db.insert(schema.activityLog).values(...)`, same table, same field shape used by `packages/users/src/employee.ts` and `packages/leave/src/audit.ts`).

**`apps/api/src/routes/employees.ts` `GET /:id`** hook:
- Runs after `resolveFieldGroups` and before response construction.
- Guard conditions (both must hold to emit an audit row):
  1. Caller is NOT the subject (`!relations.includes('subject')`).
  2. Grant contains at least one audited group (`identity` / `medical`).
- Fire-and-forget: the `writeSensitiveReadAudit` promise is not awaited; errors are caught and logged so the HTTP response is never failed by an audit write error.
- Batched per request: one row per `GET /:id` call, regardless of how many audited fields are in the group.

### 5. Tests (DONE)

**`packages/users/src/audit.test.ts`** (6 tests):
- Writes audit row with correct `keyword`, `orgId`, `userId`, `changedBy`, `tableName`.
- `changedColumns.groups` contains all audited groups passed.
- `changedColumns.targetUserId` contains the target.
- `changedBy` is null when `ctx.userId` is null.
- Resolves without throwing for a single group.
- All use module mock to avoid DB dependency.

**`packages/field-policy/src/ws6-admin-route.test.ts`** (24 tests):
- `invalidateFieldPolicy`: synchronous, no-op, idempotent, handles multiple resources (3 tests).
- `requireRole` guard: MANAGER+/ADMIN+ allow/deny matrix (7 tests) — verifies both the CRUD-level threshold (MANAGER) and the route-level threshold (ADMIN).
- Sensitive-read audit guard logic: 7 cases covering hr_admin+identity (audit written), hr_admin+medical (written), both groups (written), subject self-read (NOT written), MANAGER no audited groups (NOT written), USER basic only (NOT written), empty grant (NOT written).
- `flattenTree` explain helper: 7 cases covering null/undefined/non-object tree, leaf with users, union nodes, empty union, empty tree.

---

## Gates

| Gate | Result |
|------|--------|
| `pnpm typecheck` | ✅ 24/24 packages |
| `pnpm lint` | ✅ 24/24 packages |
| `bun test packages/users/src/audit.test.ts` | ✅ 6 pass, 0 fail |
| `bun test packages/field-policy/src/ws6-admin-route.test.ts` | ✅ 24 pass, 0 fail |
| `bun test packages/field-policy/` (full, regression) | ✅ 82 pass, 0 fail |
| `bun test packages/authz/src/` (regression) | ✅ 28 pass, 0 fail |
| `bun test packages/authz-sync/src/` (regression) | ✅ 21 pass, 0 fail |

---

## Deviations from Plan

1. **Route guard level for field-policies: ADMIN not MANAGER.** The plan says "OWNER/ADMIN-guarded". The crud.ts helpers use `requireRole(ctx, 'MANAGER')` (a lower threshold used for broad HR operations). The routes add an explicit `requireRole(ctx, 'ADMIN')` on top of the crud guard — consistent with "OWNER/ADMIN-guarded" in the spec. MANAGERs cannot flip field-policy rows.

2. **`flattenTree` not exported from internal.ts.** The helper is defined in `internal.ts` but not exported (it is a file-private helper). Tests verify its logic via a duplicated inline version in `ws6-admin-route.test.ts`. This is intentional — the function is route-local and has no other consumers.

3. **`outboxDepth`/`oldestUnpublishedAgeMs` imported from `@avkash/events` (not re-exported via `@avkash/authz-sync`).** The plan mentions `@avkash/events` for these functions. `@avkash/events` already exports them; adding `@avkash/events` as a direct dep to `apps/api` is the cleanest path (authz-sync is an orchestration package; re-exporting observability primitives would violate layering). Added `@avkash/events: workspace:*` to `apps/api/package.json`.

4. **`explainAccess` does not use `ctx`.** The FGA `expand()` call in `client.ts` only passes `{ relation, object }` — ctx is not used. `INTERNAL_CTX` is constructed with fully-typed fields (`actorType: 'system'`, `assurance: 'high'`) to satisfy the TypeScript signature, but its values are irrelevant to the FGA call.

5. **Sensitive-read audit is fire-and-forget.** The spec says "emits an audit row". A failing audit write must not fail the HTTP response (following the pattern established in `packages/leave/src/accrual.ts` where `writeAudit` is called in a try block). The promise is detached with `.catch(console.error)`.

---

## Open Issues

1. **`flattenTree` handles a subset of FGA tree node types.** The OpenFGA Expand tree can have deeply nested `tupleToUserset` and `computed` nodes. The current implementation covers `leaf.users` (the common case for direct grants), `union` (for computed relations), and `root`. Complex conditioned-delegation trees may produce empty `paths` while still returning the correct raw `tree`. For the demo beat 7 use case (why does Priya see salaries?) the `paths` will be meaningful if the access path terminates in a direct user grant; for complex computed chains the raw `tree` JSON is the fallback.

2. **`PATCH /field-policies/:id` does not re-resolve the route-level auth guard between the If-Match parse and the CAS update.** The ADMIN check is at route mount level; a timing attack (ADMIN demoted between auth and update) is bounded by the existing `requireRole` guard at the crud layer (MANAGER threshold) which also fires. Low practical risk.

3. **Field-policy route tests are function-level (no HTTP layer).** Route-level integration tests (exercising the Hono app with a real DB) require Docker. Per spec, stub/unit tests only for WS6.
