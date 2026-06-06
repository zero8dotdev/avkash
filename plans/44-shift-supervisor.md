# Plan 44 — Shift supervisor role

Status: **implementation plan**. Adds a shift supervisor as a scoped authority — someone who can
approve regularizations, confirm attendance, and view muster data for a specific shift at a specific
location, without being a team manager or org admin.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 28 (departments
— supervisor scope includes department), Plan 29 (employment level — supervisors manage WORKERs).

---

## Why existing roles are insufficient

| Role | Scope | Can do |
|------|-------|--------|
| MANAGER | Team (cross-shift) | Approve leave, view team attendance |
| ADMIN | Org-wide | Everything |
| Shift supervisor (needed) | Shift × Location × Department | Approve regularizations for their shift only; view shift muster; mark manual attendance |

A shift supervisor in a factory is a floor-level authority. They are not a "manager" in the leave-
approval sense (they may not even manage people on paper), but they have operational authority over
a specific shift's workers.

---

## Design: capability-based assignment (not a new role enum)

Adding a new value to the `role` enum would give supervisors system-wide access comparable to
MANAGER — too broad. Instead, `ShiftSupervisor` is a scoped assignment:

```
shift_supervisor
  id             uuid PK
  orgId          uuid FK
  userId         uuid FK → user    (the supervisor)
  shiftId        uuid FK → shift
  locationId     uuid FK → location
  departmentId   uuid? FK → department   (null = all departments at this location/shift)
  isActive       bool default true
  createdAt / createdBy
  unique(orgId, userId, shiftId, locationId)
```

A helper predicate:
```ts
function isShiftSupervisor(
  ctx: AuthContext,
  shiftId: string,
  locationId: string,
  departmentId?: string
): Promise<boolean>
```

Used wherever we need to gate supervisor-specific actions, alongside the existing `canApprove` and
`requireRole` checks.

---

## Schema

`packages/db/src/schema/attendance.ts` — new table `shift_supervisor` (as above).

---

## What a shift supervisor can do

| Action | Existing gate | Extended gate |
|--------|--------------|--------------|
| View muster for their shift | MANAGER | OR `isShiftSupervisor(shiftId, locationId)` |
| Approve regularization for their shift | `canApprove(teamId)` | OR `isShiftSupervisor(shiftId, locationId)` |
| Mark manual attendance (supervisor override) | ADMIN | OR `isShiftSupervisor(shiftId, locationId)` |
| View attendance of a specific worker | MANAGER | OR supervisor of that worker's shift/location |

No new routes are added — existing routes get an OR-gate extension.

---

## Manual attendance by supervisor

A shift supervisor may need to mark a worker as present when the biometric fails (the HR-head-
authorization flow in the org — the supervisor initiates, HR head confirms via regularization).

`POST /attendance/regularization` (Plan 23, Phase 4) — supervisors can submit a regularization
request on behalf of a worker. The existing `approveRegularization` requires `canApprove || isShiftSupervisor`.

This keeps the authorization HR-head-in-the-loop by design: supervisor submits, HR approves.

---

## Domain (`@avkash/attendance`)

New file `attendance/supervisor.ts`:

- `assignShiftSupervisor(ctx, input)` — ADMIN; creates the assignment.
- `removeShiftSupervisor(ctx, id)` — ADMIN; `isActive = false`.
- `listShiftSupervisors(ctx, opts?: { shiftId?, locationId? })` — ADMIN + MANAGER.
- `isShiftSupervisor(ctx, shiftId, locationId, departmentId?)` — predicate for guards.
- `supervisorScope(ctx)` — returns all `{ shiftId, locationId, departmentId }` tuples for the
  current user's active supervisor assignments (used to filter muster queries).

---

## Muster access

`GET /reports/muster` currently requires MANAGER. Extended guard:

```
if requireRole(ctx, 'MANAGER') fails:
  check supervisorScope(ctx) includes the queried (locationId, shiftId)
  if not → 403
```

The muster query filters to only workers on the supervisor's assigned shift.

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/shift-supervisors` | ADMIN | assign supervisor |
| GET | `/shift-supervisors` | ADMIN | `?shiftId=&locationId=` |
| DELETE | `/shift-supervisors/:id` | ADMIN | soft-remove |

---

## Tests

- `isShiftSupervisor` returns true when user has an active assignment matching the scope.
- `isShiftSupervisor` returns false when assignment is for a different shift or location.
- Supervisor can submit a regularization for a worker on their shift.
- Supervisor cannot submit a regularization for a worker on a different shift.
- Supervisor can view muster for their shift; 403 for a different shift.
- Supervisor cannot approve leave (that still requires `canApprove`).

---

## Build order

1. Schema (`shift_supervisor`). `db:push`.
2. Domain functions in `attendance/supervisor.ts`. Tests.
3. Extend `approveRegularization` guard.
4. Extend muster route guard.
5. Routes + DTOs.
