# Plan 29 — Employment level / grade

Status: **implementation plan**. Adds a formal `employmentLevel` field to `EmployeeProfile`. This is
the load-bearing field for Plans 30, 31, 36, 37, 39, 43, 44, and 45 — it must land first.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md).

---

## Why the existing model falls short

`User.role` = `OWNER | MANAGER | USER | ADMIN | ANON` — this is a **system access role**, not an
employment classification. `EmployeeProfile.employmentType` = `FULL_TIME | PART_TIME | CONTRACT |
INTERN` — this describes the contract nature, not the organisational tier.

Neither answers "is this person a shop-floor worker, a desk executive, or a plant head?" That
question drives shift eligibility, overtime tracking, leave policy selection, attendance source
enforcement, and more.

---

## Enum

New Postgres enum `employment_level` in `packages/db/src/schema/enums.ts`:

```
WORKER       — blue-collar / shop-floor (production, maintenance workers)
EXECUTIVE    — middle management / desk staff (HR, logistics, accounts, compliance, NPD, sales executives)
MANAGEMENT   — top leadership (plant heads, CEO, MD, central sales head)
FIELD        — remote / field staff (field sales executives working in different states/countries)
```

`FIELD` is separate from `EXECUTIVE` because its attendance source, approval chain, and location
context are all different. A field sales executive is an `EXECUTIVE` by designation but `FIELD` by
operational behaviour.

---

## Schema

`packages/db/src/schema/employee-profile.ts` — add one column:

```
employmentLevel   employment_level?   (nullable — null = not yet classified)
```

**Access tier** (following Plan 18's field-tier matrix):

| Field | Read | Write |
|-------|------|-------|
| `employmentLevel` | MANAGER | HR |

This means a manager can see their report's level; only HR/ADMIN can change it.

---

## Domain (`@avkash/users`)

- `updateEmployeeProfile` (existing) — add `employmentLevel` to the HR-writable field set. The
  existing `assertWritable` call in `users/profile.ts` gains one line.
- `getEmployeeLevel(orgId, userId): Promise<EmploymentLevel | null>` — lightweight single-column
  fetch, **cached in the request context** by the caller (several guards in Plans 30/31/37/39 need
  it; we do not want N profile fetches per request).
- `listEmployees` gains optional `?level=WORKER|EXECUTIVE|MANAGEMENT|FIELD` filter.

No new routes needed — `PATCH /employees/:userId` already exists and will carry `employmentLevel`
once it's in the writable field set.

---

## Default value policy

- `null` = not classified. All guards added by downstream plans treat `null` as **permissive** (no
  restriction) — this preserves backwards compatibility for any users already in the system.
- HR sets the level during onboarding or via a bulk update on the employee roster page.
- Probationers at all levels carry the same `employmentLevel` as confirmed employees (the level
  describes the role, not the confirmation status).

---

## Bulk assignment

For initial rollout across hundreds of workers, expose:

`POST /employees/bulk-level` (ADMIN only):
```json
{ "userIds": ["uuid", ...], "employmentLevel": "WORKER" }
```
Updates `employmentLevel` in a single SQL batch. Audited. Idempotent (same level → no-op).

---

## Downstream impact checklist

Once this plan ships, the following plans can be unblocked:

- **Plan 30** — gender shift restrictions (checks `gender` from profile, but level gates which
  shifts are even offered to the user)
- **Plan 31** — attendance source enforcement (WEB allowed for MANAGEMENT/FIELD; DEVICE for WORKER)
- **Plan 36** — leave policy lookup adds level dimension
- **Plan 37** — `assignShift` validates `shift.allowedLevels` against user's level
- **Plan 39** — overtime mark suppressed for EXECUTIVE/MANAGEMENT
- **Plan 43** — probation policy overlay requires level + employmentStatus
- **Plan 44** — shift supervisor can only be assigned to WORKER-level staff
- **Plan 45** — half-day interpretation changes for WORKER vs EXECUTIVE

---

## Tests

- `getEmployeeLevel` returns null for a user with no profile row (LEFT JOIN → null, not an error).
- `updateEmployeeProfile` rejects `employmentLevel` write from a USER/MANAGER role (assertWritable).
- `listEmployees({ level: 'WORKER' })` returns only WORKER-level employees.
- `bulkSetLevel` is idempotent (run twice with same payload → same state, no duplicate audit rows).

---

## Build order

1. Add `employment_level` enum to `enums.ts`. Add `employmentLevel` nullable column to
   `employee_profile`. `db:push`.
2. Extend `assertWritable` + field-tier map in `users/profile.ts`.
3. Add `getEmployeeLevel` helper.
4. Add `?level=` filter to `listEmployees`.
5. Add `POST /employees/bulk-level` route.
6. Tests.
