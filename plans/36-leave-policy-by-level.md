# Plan 36 — Leave policy scoped by employment level

Status: **implementation plan**. Extends `LeavePolicy` so the same leave type can carry different
entitlements for workers, executives, and management within the same org — without duplicating teams.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level).

---

## The gap

`LeavePolicy` is keyed on `(teamId, leaveTypeId)`. In a single Production department (one team), a
blue-collar WORKER and a floor EXECUTIVE supervisor coexist. They must have different earned-leave
entitlements (the Factories Act mandates different accrual for workers vs staff). Currently there is
no way to express this without splitting them into separate teams — which breaks approval routing.

---

## Design: level-policy overlay

Two layers:

1. **Team policy** — existing `(teamId, leaveTypeId)` — the baseline for the team.
2. **Level policy** — new `(orgId, employmentLevel, leaveTypeId)` — org-wide override per level.

Resolution order: **level policy beats team policy when both exist**. If no level policy exists for
a user's level, fall back to team policy. If neither exists, no entitlement.

This keeps team policies intact (no migrations, no breakage) and layers level-specific rules on top.

---

## Schema

New table in `packages/db/src/schema/leave.ts`:

```
level_leave_policy
  id                   uuid PK
  orgId                uuid FK → organisation
  employmentLevel      employment_level  notNull
  leaveTypeId          uuid FK → leave_type  [on delete: cascade]

  unlimited            bool default false
  maxLeaves            integer?
  autoApprove          bool default false
  allowNegativeBalance bool default false

  rollOver             bool default false
  rollOverLimit        integer?
  rollOverExpiry       varchar?   (MM/DD format)

  accruals             bool default false
  accrualFrequency     accrual_frequency?
  accrueOn             accrue_on?

  encashable           bool default false
  encashmentMaxDays    integer?
  compOffExpiryDays    integer default 90
  prorateOnJoin        bool default true
  escalateOverDays     integer?

  isActive             bool default true
  version              integer default 0
  createdAt / updatedAt / createdBy / updatedBy
  unique(orgId, employmentLevel, leaveTypeId)
```

This mirrors the `LeavePolicy` column set exactly — same fields, different key. No new enum needed.

---

## Policy resolution function

`packages/leave/src/policy.ts` — extend `getEffectivePolicy`:

```ts
async function getEffectivePolicy(
  orgId: string,
  teamId: string,
  leaveTypeId: string,
  employmentLevel?: EmploymentLevel | null
): Promise<LeavePolicy | LevelLeavePolicy | null>
```

```
1. If employmentLevel is not null:
     fetch level_leave_policy for (orgId, employmentLevel, leaveTypeId) where isActive = true.
     If found → return it.
2. Fetch leave_policy for (teamId, leaveTypeId) where isActive = true.
   If found → return it.
3. Return null (no policy).
```

All existing callers of `getEffectivePolicy` pass `employmentLevel` sourced from
`getEmployeeLevel(orgId, userId)`. This is a two-call lookup (level + policy); cache the level on
the AuthContext or request scope to avoid repeated fetches during leave application.

---

## Domain (`@avkash/leave`)

New file `leave/level-policy.ts`:

- `createLevelPolicy(ctx, input)` — ADMIN; validates level + leave type existence.
- `listLevelPolicies(ctx, opts?: { level?, leaveTypeId? })` — ADMIN; returns all level policies.
- `getLevelPolicy(ctx, id)` — ADMIN.
- `updateLevelPolicy(ctx, id, patch, version?)` — ADMIN; concurrency.
- `deactivateLevelPolicy(ctx, id)` — ADMIN; `isActive = false`.

Extend `getBalance`, `applyLeave`, `runAccrualTick`, `runRollover` — wherever `getEffectivePolicy`
is called, also pass `employmentLevel`. These functions already accept `orgId + userId`; level is
one additional fetch.

---

## Accrual tick impact

`runAccrualTick` iterates users × policies. It must now:
1. For each user, resolve their `employmentLevel`.
2. Call `getEffectivePolicy(orgId, teamId, leaveTypeId, level)`.
3. Use the resolved policy (level or team) for the accrual amount and frequency.

If an org has no level policies, behaviour is identical to today — no regression.

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/leave/level-policies` | ADMIN | idempotency |
| GET | `/leave/level-policies` | ADMIN | `?level=&leaveTypeId=` |
| GET | `/leave/level-policies/:id` | ADMIN | ETag |
| PATCH | `/leave/level-policies/:id` | ADMIN | If-Match |
| DELETE | `/leave/level-policies/:id` | ADMIN | soft-deactivate |

---

## Seeding for this org

Example for Earned Leave:

| Level | maxLeaves | accruals | accrualFrequency | encashable |
|-------|-----------|----------|-----------------|------------|
| WORKER | 15 | true | MONTHLY | true |
| EXECUTIVE | 18 | true | MONTHLY | true |
| MANAGEMENT | 24 | false | — | true |
| FIELD | 18 | true | MONTHLY | true |

These are seeded via `createLevelPolicy` calls on org setup, not hardcoded.

---

## Tests

- `getEffectivePolicy` returns level policy when one exists for the user's level.
- `getEffectivePolicy` falls back to team policy when no level policy exists.
- `getBalance` for a WORKER uses WORKER level policy entitlement, not team policy.
- `runAccrualTick` credits the level-policy accrual amount for WORKER, different amount for EXECUTIVE
  in the same team.
- `createLevelPolicy` blocks duplicate `(orgId, employmentLevel, leaveTypeId)`.

---

## Build order

1. Schema (`level_leave_policy`). `db:push`.
2. Extend `getEffectivePolicy` signature + resolver logic.
3. Thread `employmentLevel` through `getBalance`, `applyLeave`, `runAccrualTick`, `runRollover`.
4. Domain CRUD in `leave/level-policy.ts`.
5. Routes + DTOs.
6. Tests.
