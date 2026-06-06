# Plan 33 — Leave blackout / lock-in periods

Status: **implementation plan**. Allows HR to define date ranges during which leave applications
are blocked — for production peak seasons, audits, or factory shutdown periods.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 28 (departments,
for scoping blackouts to specific factory-department combos).

---

## What it solves

The organisation has lock-in periods (audit seasons, peak production) where leave cannot be taken.
Currently `applyLeave` has no mechanism to block applications during these periods — an employee
can apply and get approved regardless of the calendar.

---

## Design decisions

**Scope**: a blackout can be scoped at any of these levels (narrowest wins):
- Org-wide (all employees)
- By location (factory-specific audit)
- By department (only Production is locked, Accounts can still leave)
- By employment level (only WORKERs locked; EXECUTIVEs can still leave)

Multiple scope dimensions can be combined (e.g. "Factory 2, Production department, WORKER level").

**Exemptions**: some leave types should never be blocked (e.g. maternity leave, bereavement). A
`blackout` carries an `exemptLeaveTypeIds[]` list.

**Hard vs advisory**: for this org, blackouts are hard blocks. A `force` override exists but
requires ADMIN (not MANAGER) — HR head can override, a department manager cannot.

---

## Schema

`packages/db/src/schema/leave.ts` — new table:

```
leave_blackout
  id                  uuid PK
  orgId               uuid FK → organisation
  name                varchar        (e.g. "Q4 Audit Lock — Factory 2")
  startDate           date notNull
  endDate             date notNull
  locationId          uuid? FK → location     (null = all locations)
  departmentId        uuid? FK → department   (null = all departments)
  employmentLevels    employment_level[]?     (null = all levels)
  exemptLeaveTypeIds  uuid[]?                 (leave types not blocked)
  isActive            bool default true
  reason              varchar?
  createdAt / updatedAt / createdBy / updatedBy
  version             integer default 0
  CHECK (startDate <= endDate)
```

---

## Guard in `applyLeave`

`packages/leave/src/leave.ts` — after the overlap check, before balance check:

```
1. Load active blackouts for orgId where:
   - startDate <= leave.endDate AND endDate >= leave.startDate  (date overlap)
   - isActive = true
   - locationId IS NULL OR locationId = user's effective location
   - departmentId IS NULL OR departmentId = user's departmentId
   - employmentLevels IS NULL OR user's level IN employmentLevels

2. Filter out blackouts where leaveTypeId is in exemptLeaveTypeIds.

3. If any blackout remains: throw BusinessRuleError('LEAVE_BLACKOUT_ACTIVE', {
     blackoutId, name, startDate, endDate
   })
```

The check is reads-only; the hot path only fires this query if there are active blackouts (a count
query first — most of the time, zero blackouts means one cheap COUNT, then skip).

**Force override**: `applyLeave(ctx, input, { force: boolean })` — when `force=true` and caller is
ADMIN, skip the blackout check. Log to audit with `forcedBy: userId`. A MANAGER cannot force.

---

## Domain (`@avkash/leave`)

New file `leave/blackout.ts`:

- `createBlackout(ctx, input)` — ADMIN only; validates date range, location/dept existence.
- `listBlackouts(ctx, opts?: { locationId?, active? })` — MANAGER+; returns all blackouts the
  caller's scope overlaps with.
- `updateBlackout(ctx, id, patch, version?)` — ADMIN; concurrency.
- `deactivateBlackout(ctx, id)` — ADMIN; sets `isActive = false`.
- `activeBlackoutsForUser(orgId, userId, startDate, endDate)` — internal; called by `applyLeave`.

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/leave/blackouts` | ADMIN | idempotency |
| GET | `/leave/blackouts` | MANAGER | `?locationId=&active=true` |
| GET | `/leave/blackouts/:id` | MANAGER | ETag |
| PATCH | `/leave/blackouts/:id` | ADMIN | If-Match |
| DELETE | `/leave/blackouts/:id` | ADMIN | deactivates (soft) |

`applyLeave` POST gains an optional `?force=true` query param, ADMIN-only — rejected with 403 for
non-ADMIN callers.

---

## Error response

```json
{
  "error": {
    "code": "LEAVE_BLACKOUT_ACTIVE",
    "message": "Leave applications are blocked from Jan 15 to Jan 31 (Q4 Audit period).",
    "details": {
      "blackoutId": "...",
      "blackoutName": "Q4 Audit Lock — Factory 2",
      "startDate": "2026-01-15",
      "endDate": "2026-01-31"
    }
  }
}
```

---

## Tests

- `applyLeave` blocked when leave dates fall within an active blackout for the user's scope.
- Blackout scoped to a different location does not block a user in another location.
- Blackout with `exemptLeaveTypeIds` including Maternity does not block a maternity leave application.
- `force=true` with ADMIN caller bypasses the check and posts an audit entry.
- `force=true` with MANAGER caller → 403.
- Deactivated blackout (`isActive=false`) does not block.

---

## Build order

1. Schema (`leave_blackout`). `db:push`.
2. `activeBlackoutsForUser` + guard in `applyLeave`.
3. Domain CRUD in `leave/blackout.ts`.
4. Routes + DTOs.
5. Tests.
