# Plan 28 — Department entity + factory matrix

Status: **implementation plan**. Introduces `Department` as a first-class structural entity distinct
from `Team`. A `Team` is an approval-routing unit; a `Department` is an org-chart unit that exists in
some locations but not all. Users gain a `departmentId` FK alongside their existing `teamId`.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md) · used by Plans 33, 34, 44.

---

## Why Team ≠ Department

`Team` drives leave approval (managers[], escalation SLA, shift default, notification prefs). It
cannot model the factory-department matrix because:

- A team cannot be present-in/absent-from specific locations.
- A department head needs visibility across **all shifts** in their department — a different authority
  scope than a team manager who approves leave for their direct reports.
- The same department name (e.g., "Maintenance") maps to different headcounts in different factories,
  all under one department entity.

Both concepts coexist. Users keep `teamId` (for leave/notifications) and gain `departmentId` (for
org-chart/reporting).

---

## Schema

**`schema/department.ts`** (new, owned by `@avkash/org`):

```
department
  id           uuid PK
  orgId        uuid FK → organisation
  name         varchar  notNull
  code         varchar  (short mnemonic, e.g. "PROD", "MAINT", "SALES")
  description  varchar?
  isActive     bool     default true
  version      integer  default 0
  createdAt    timestamp
  updatedAt    timestamp
  createdBy    uuid
  updatedBy    uuid
  unique(orgId, code)
  unique(orgId, name)

department_location             ← which departments exist in which factories
  id             uuid PK
  orgId          uuid FK
  departmentId   uuid FK → department  [on delete: cascade]
  locationId     uuid FK → location    [on delete: cascade]
  headUserId     uuid? FK → user       ← department head at this location
  createdAt      timestamp
  createdBy      uuid
  unique(departmentId, locationId)
```

**`user` additions** (`schema/user.ts`):

```
departmentId   uuid? FK → department   (nullable; backfill = null)
```

**`employeeProfile` additions** (`schema/employee-profile.ts`):
- No new columns — `departmentId` lives on `user` (operational) not profile (HR record). The profile
  already carries `workLocation` (a free-text label); the FK is on user for runtime resolution.

---

## Domain (`@avkash/org`)

New file `org/departments.ts`:

- `createDepartment(ctx, { name, code, description? })` — ADMIN only; unique code guard.
- `listDepartments(ctx, opts?: { locationId?, activeOnly? })` — MANAGER+; joins `department_location`
  when `locationId` is supplied to filter departments present at that factory.
- `getDepartment(ctx, id)` — MANAGER+.
- `updateDepartment(ctx, id, patch, version?)` — ADMIN; concurrency.
- `archiveDepartment(ctx, id)` — ADMIN; sets `isActive = false` (soft delete — users may still ref it).
- `assignDepartmentToLocation(ctx, departmentId, locationId, headUserId?)` — ADMIN; upsert into
  `department_location`.
- `removeDepartmentFromLocation(ctx, departmentId, locationId)` — ADMIN; hard delete of the join row.
- `setDepartmentHead(ctx, departmentId, locationId, headUserId)` — ADMIN; updates `headUserId` in the
  join row.
- `getDepartmentHead(orgId, departmentId, locationId)` — pure lookup; used by Plan 44 (shift
  supervisor) and leave escalation.

Extend `@avkash/users`:
- `setUserDepartment(ctx, userId, departmentId)` — ADMIN; sets `user.departmentId`.
- `listUsers` gains optional `departmentId` filter.

Access control:
- Department CRUD → ADMIN (same as location CRUD).
- Department head at location → can see all users in `(departmentId, locationId)`.
- The new `isDepartmentHead(ctx, departmentId, locationId)` predicate sits alongside the existing
  `canApprove` — used in Plans 44 and 47.

---

## DTO & API surface

`departmentDto` = `createSelectSchema(department).omit({ orgId, createdBy, updatedBy })`.

`departmentLocationDto` = `{ departmentId, locationId, headUserId, headName? }` (join query).

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/departments` | ADMIN | idempotency key |
| GET | `/departments` | MANAGER | `?locationId=` filter |
| GET | `/departments/:id` | MANAGER | ETag |
| PATCH | `/departments/:id` | ADMIN | If-Match |
| DELETE | `/departments/:id` | ADMIN | soft-archive |
| POST | `/departments/:id/locations` | ADMIN | assign to factory |
| DELETE | `/departments/:id/locations/:locationId` | ADMIN | remove from factory |
| PATCH | `/departments/:id/locations/:locationId/head` | ADMIN | set dept head |
| GET | `/locations/:id/departments` | MANAGER | which depts at this factory |
| PATCH | `/employees/:userId/department` | ADMIN | set user's department |

---

## Migration & backfill

- All existing users get `departmentId = null` (nullable FK, no constraint violation).
- HR then bulk-assigns departments via `PATCH /employees/:userId/department` or a one-off import.
- No data is lost; the feature is additive.

---

## Tests

- `listDepartments({ locationId })` returns only departments present at that location.
- `assignDepartmentToLocation` blocks duplicate join rows (unique constraint or upsert).
- `archiveDepartment` does not cascade-delete users; they keep the FK, `isActive = false` is visible
  on reads.
- `getDepartmentHead` returns null gracefully when no head is set.

---

## Build order

1. Schema (`department`, `department_location`, `user.departmentId`). `db:push`.
2. Domain functions in `org/departments.ts`.
3. Extend `listUsers` with `departmentId` filter.
4. Routes + DTOs. Audit on every mutation.
5. Tests.
