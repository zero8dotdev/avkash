# Plan 18 — Employee records

Status: design locked (MVP spine). Goal: the system-of-record for a person — separate from
the auth `user` identity, with **field-level access control** as the load-bearing decision.

## Scope

**In (the spine):** a 1:1 `EmployeeProfile`, identity/personal + employment fields, an
**employment-status lifecycle** with an offboarding hook, **field-level read/write tiers**
(self / manager / HR), and the self-service vs HR-managed split.

**Deferred (each its own domain):** compensation/bank/tax → `@avkash/payroll`; documents →
`@avkash/documents`; govt-IDs/statutory (region-aware, encrypted) → later; effective-dated
**job-history timeline** → v2; **custom fields** → v2; encashment-on-exit automation + access
revocation → offboarding v2.

## Model: identity vs. record

`user` stays the Better Auth identity + the *operational* fields the app reads (role, teamId,
workweek, joinedOn, language). A new **`EmployeeProfile`** (1:1, `userId` unique, `orgId`) holds
the HR record. Why separate: keeps auth uncoupled from HR data, and makes "HR-only PII" enforceable
at the table boundary. Created lazily (upsert on first write; reads LEFT JOIN so a missing profile
shows identity + nulls).

## The access model — lock this first

Each field has a **read tier** and a **write tier**. The viewer's relationship to the subject is
one of `SELF | MANAGER | HR | PEER` (HR = ADMIN/OWNER; MANAGER = subject's reportingManager or a
manager of their team).

Read eligibility:

| Read tier | Readable by |
|---|---|
| `PUBLIC` | everyone in the org |
| `MANAGER` | SELF, MANAGER, HR |
| `SELF` | SELF, HR |
| `HR` | HR only |

Write tiers: `SELF` (the employee or HR) · `HR` (HR only).

### Field matrix

| Field | Read | Write |
|---|---|---|
| employeeCode | PUBLIC | HR |
| designation | PUBLIC | HR |
| employmentType (FULL_TIME/PART_TIME/CONTRACT/INTERN) | MANAGER | HR |
| workLocation | MANAGER | HR |
| reportingManagerId | MANAGER | HR |
| employmentStatus | MANAGER | HR |
| probationEndsOn, confirmedOn | MANAGER | HR |
| exitDate, exitReason | HR | HR |
| dateOfBirth, gender, maritalStatus, nationality | SELF | SELF |
| personalEmail, personalPhone, address, emergencyContact | SELF | SELF |

Implementation: a single `FIELD_TIERS` map + `projectProfile(profile, relationship)` that returns
only readable fields (the response projector — like a DTO, but viewer-aware), and
`assertWritable(fields, relationship)` on update. Every read/write of a non-PUBLIC field is audited.

## Employment status lifecycle

`employmentStatus`: `ACTIVE | PROBATION | NOTICE_PERIOD | RESIGNED | TERMINATED | ON_LONG_LEAVE`
— distinct from auth role. HR sets it. Drives:
- **Leave eligibility** — a `RESIGNED`/`TERMINATED` employee past `exitDate` can't apply leave
  (a check added to `applyLeave`). This is the one cross-domain hook in the MVP.
- **Offboarding (MVP)** — HR sets status + `exitDate`/`exitReason`. *Follow-ups (v2):* auto-encash
  remaining leave (reuses the encashment engine), revoke sessions/deactivate.

## Self-service vs HR-managed

Two write paths over one record:
- `PATCH /employees/me` — the employee edits their **SELF-write** fields (address, contact, …).
- `PATCH /employees/:userId` — HR edits **any** field.

## API surface

| Method | Route | Notes |
|---|---|---|
| GET | `/employees` | roster — identity + PUBLIC profile fields, filters (team, status) |
| GET | `/employees/me` | own record (SELF + below) |
| PATCH | `/employees/me` | self-service (SELF-write fields only) |
| GET | `/employees/:userId` | record, **field-filtered by the viewer's relationship** |
| PATCH | `/employees/:userId` | HR update (all fields, incl. status/exit) |

`@avkash/users` owns the domain (it's "the people"); `EmployeeProfile` table in `@avkash/db`.

## Build sequence

1. Schema: `EmployeeProfile` + `employmentType`/`employmentStatus` enums. `db:push`.
2. `FIELD_TIERS` + `projectProfile` + `assertWritable` + relationship resolver (reuse the
   `resolveManagedTeams`/reportingManager logic).
3. Domain: `getEmployeeProfile` (viewer-aware), `updateOwnProfile`, `updateEmployeeProfile`,
   `listEmployees`, `setEmploymentStatus` (offboarding).
4. Leave-eligibility hook in `applyLeave` (block exited employees).
5. Routes + audit on sensitive field access/change.

## Open decisions (defaults chosen; flag if you disagree)

1. **`reportingManagerId`** — a *direct* manager pointer on the profile, **in addition to**
   `team.managers[]` (a person can have a 1:1 manager distinct from team approvers). Default: yes.
2. **Self sees their own `exitReason`?** Default: **no** (HR-tier) for the MVP.
3. **DOB/address encryption** — PII but not encrypted-at-rest in the MVP; encryption lands with the
   statutory/comp fields. Default: plaintext now, audited.
