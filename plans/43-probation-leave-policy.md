# Plan 43 — Probation-specific leave policies

Status: **implementation plan**. Overlays reduced leave entitlements or accrual rates on employees
in probation, without creating separate teams or leave types.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level — probation applies across all levels, resolved via `employmentStatus`).

---

## The gap

A probationer and a confirmed employee in the same team currently receive identical `LeavePolicy`
entitlements. In practice, probationers often have restricted leave — for example, no earned leave
accrual during probation, or a lower CL balance — as per company policy or the Factories Act.

Plan 36 introduces level-based policy overlays. This plan adds a status-based overlay (probation),
which is orthogonal to level (a WORKER probationer and an EXECUTIVE probationer both need it).

---

## Design: probation overlay fields on existing policies

Rather than a third policy table, add probation-specific fields directly to both `LeavePolicy` and
`LevelLeavePolicy` (Plan 36). These fields override the base policy values **only when the
employee's `employmentStatus = 'PROBATION'`**.

Fields added to both tables:

```
probationMaxLeaves       integer?   (null = same as maxLeaves)
probationAccruals        bool?      (null = same as accruals — inherit base setting)
probationAccrualRate     numeric(5,2)?  (override daily/monthly accrual amount; null = same rate)
probationEncashable      bool?      (null = same as encashable)
```

This keeps policy tables flat and avoids a third table. The probation override is a narrow delta,
not a full policy clone.

---

## Schema

`packages/db/src/schema/leave.ts` — add four columns to **both** `leave_policy` and
`level_leave_policy`:

```
probationMaxLeaves       integer?
probationAccruals        bool?
probationAccrualRate     numeric(5,2)?
probationEncashable      bool?
```

`db:push` — no data migration needed; all new columns are nullable (null = no override).

---

## Resolution logic

`getEffectivePolicy` (extended in Plan 36) returns a policy object. Add a second function:

```ts
function applyProbationOverlay(
  policy: LeavePolicy | LevelLeavePolicy,
  employmentStatus: EmploymentStatus
): LeavePolicy | LevelLeavePolicy
```

```
if employmentStatus !== 'PROBATION': return policy unchanged.

return {
  ...policy,
  maxLeaves:    policy.probationMaxLeaves   ?? policy.maxLeaves,
  accruals:     policy.probationAccruals    ?? policy.accruals,
  encashable:   policy.probationEncashable  ?? policy.encashable,
  // probationAccrualRate is used by accrual tick — passed through as a separate field
}
```

This is a pure function, easily tested.

---

## Where overlay is applied

| Caller | Change |
|--------|--------|
| `getBalance` | Fetch `employmentStatus` from profile; call `applyProbationOverlay` on resolved policy |
| `applyLeave` | Same — balance check uses overlaid `maxLeaves` |
| `runAccrualTick` | If `probationAccruals = false`, skip accrual for PROBATION employees; if `probationAccrualRate` is set, use it as the per-period credit |
| `runRollover` | Probation employees follow same rollover rules unless `probationMaxLeaves` implies a lower cap |

`employmentStatus` is already on `EmployeeProfile` (Plan 18). It is fetched alongside `employmentLevel` (Plan 29) — same profile read, no extra query.

---

## `probationEndsOn` hook

`EmployeeProfile.probationEndsOn` (Plan 18) exists. Add a cron job:

`runProbationCompletion(now?)` — daily; finds profiles where `employmentStatus = 'PROBATION'` AND
`probationEndsOn <= today`. Transitions them to `ACTIVE`. Optionally posts an OPENING ledger entry
if the policy says "start earning full leave from confirmation date".

This cron is new but small — a single UPDATE + optional ledger posts. Owned by `@avkash/leave`
(it posts ledger entries) or `@avkash/jobs` (as a scheduled worker).

---

## API surface

No new routes. Changes to existing:

- `POST /leave/policies` + `PATCH /leave/policies/:id` — gain probation overlay fields.
- `POST /leave/level-policies` + `PATCH /leave/level-policies/:id` — same (Plan 36 routes).
- DTOs for both policy types include the probation fields.

---

## Example setup for this org

Earned Leave policy for WORKER:
```json
{
  "maxLeaves": 15,
  "accruals": true,
  "accrualFrequency": "MONTHLY",
  "probationAccruals": false,
  "probationMaxLeaves": 0
}
```

Result: probationer WORKERs earn no earned leave; confirmed WORKERs accrue monthly.

---

## Tests

- `applyProbationOverlay` with `employmentStatus = 'PROBATION'` returns `probationMaxLeaves` in
  place of `maxLeaves` when set.
- `applyProbationOverlay` with `employmentStatus = 'ACTIVE'` returns policy unchanged.
- `applyProbationOverlay` with `probationAccruals = false` → `accruals = false` for probationer.
- `runAccrualTick` skips a PROBATION employee when their effective policy has `accruals = false`.
- `runProbationCompletion` transitions `PROBATION → ACTIVE` for employees past `probationEndsOn`.

---

## Build order

1. Add four probation columns to `leave_policy` + `level_leave_policy`. `db:push`.
2. `applyProbationOverlay` pure function + tests.
3. Thread overlay through `getBalance`, `applyLeave`, `runAccrualTick`, `runRollover`.
4. `runProbationCompletion` cron in `@avkash/jobs`.
5. Extend DTOs and routes.
