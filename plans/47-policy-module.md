# Plan 47 — Policy module (`@avkash/policy`)

Status: **implementation plan**. Implements the `@avkash/policy` package (currently a placeholder)
as an HR document management system for standing orders, factory rules, codes of conduct, and other
regulatory policies — with lifecycle management and employee acknowledgement tracking.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 28 (departments
— policies can be scoped to departments), Plan 29 (employment level — policies can target specific
levels).

---

## Scope

**In:** Policy documents (text-based), lifecycle (DRAFT → ACTIVE → ARCHIVED), scoped applicability
(by location, department, employment level), employee acknowledgement tracking, version history.

**Out:** Document file uploads (PDFs, Word docs — those go to `@avkash/documents`), digital
signatures (a future feature), policy enforcement automation (leave/attendance rules are in their
own plans, not here), payroll policies (owned by `@avkash/payroll`).

---

## What a "policy" is here

A policy is a named HR document with a body (markdown/text), an effective date, and a defined
audience. Examples:
- "Standing Orders — Factory Operations" (applies to WORKERs at all 4 factories)
- "Code of Conduct" (applies to all levels, all locations)
- "Travel & Expense Policy" (applies to EXECUTIVE, MANAGEMENT, FIELD levels)
- "Night Shift Safety Protocol" (applies to WORKERs at SEZ locations on Night shift)

Employees must acknowledge that they have read the policy. HR tracks who has acknowledged and who
has not.

---

## Schema

`packages/db/src/schema/policy.ts` (new, in `packages/db`):

```
policy
  id                  uuid PK
  orgId               uuid FK → organisation
  title               varchar  notNull
  slug                varchar  (url-safe, unique per org — e.g. "code-of-conduct")
  body                text     (markdown)
  version             integer  default 1   (policy version, not DB concurrency version)
  status              policy_status  default 'DRAFT'
  effectiveFrom       date?    (null = immediate on activation)

  -- Applicability scope (all null = applies to everyone)
  locationIds         uuid[]?  (null = all locations)
  departmentIds       uuid[]?  (null = all departments)
  employmentLevels    employment_level[]?  (null = all levels)

  requiresAck         bool default true    (must employees acknowledge?)
  ackDeadlineDays     integer?             (days after activation to acknowledge)

  publishedAt         timestamp?
  publishedBy         uuid? FK → user
  archivedAt          timestamp?
  archivedBy          uuid? FK → user

  dbVersion           integer default 0   (optimistic concurrency, distinct from policy version)
  createdAt / updatedAt / createdBy / updatedBy
  unique(orgId, slug)
```

New enum `policy_status` in `enums.ts`:
```
DRAFT | ACTIVE | ARCHIVED
```

```
policy_version_history               ← immutable log of prior versions
  id             uuid PK
  policyId       uuid FK → policy  [on delete: cascade]
  version        integer
  body           text
  publishedAt    timestamp
  publishedBy    uuid FK → user
  createdAt      timestamp
```

```
policy_acknowledgement
  id             uuid PK
  orgId          uuid FK
  policyId       uuid FK → policy  [on delete: cascade]
  policyVersion  integer
  userId         uuid FK → user
  acknowledgedAt timestamp
  ipAddress      varchar?
  unique(policyId, userId, policyVersion)
```

---

## Lifecycle

```
DRAFT → ACTIVE   (HR publishes — sets publishedAt, copies body to version_history)
ACTIVE → DRAFT   (HR unpublishes — revert to editable state; acknowledgements are NOT deleted)
ACTIVE → ARCHIVED (HR archives — no new acknowledgements expected)
```

When a policy body is updated while ACTIVE:
1. The old body is snapshotted to `policy_version_history` with the current version number.
2. `policy.version` increments.
3. Existing acknowledgements remain valid (they acknowledged the prior version).
4. A notification is sent to applicable employees: "Policy updated — please re-read."
5. HR can require re-acknowledgement (by setting a new `ackDeadlineDays`).

---

## Applicability resolver

```ts
function isPolicyApplicable(
  policy: Policy,
  user: { locationId: string; departmentId?: string; employmentLevel?: EmploymentLevel }
): boolean
```

```
if policy.locationIds != null AND user.locationId NOT IN policy.locationIds → false
if policy.departmentIds != null AND user.departmentId NOT IN policy.departmentIds → false
if policy.employmentLevels != null AND user.employmentLevel NOT IN policy.employmentLevels → false
return true
```

Pure function, tested. Used by:
- `listPoliciesForUser(orgId, userId)` — returns only applicable policies.
- Acknowledgement reporting — count of applicable employees who have not acknowledged.

---

## Domain (`@avkash/policy`)

The placeholder package becomes real:

`policy/policies.ts`:
- `createPolicy(ctx, input)` — ADMIN; slug unique check.
- `getPolicy(ctx, id)` — MANAGER+ for full body; USER for applicable policies they can read.
- `listPolicies(ctx, opts?)` — ADMIN sees all; USER sees applicable active policies only.
- `updatePolicy(ctx, id, patch, version?)` — ADMIN; concurrency on `dbVersion`.
- `publishPolicy(ctx, id)` — ADMIN; DRAFT → ACTIVE; snapshots version history; triggers notification.
- `unpublishPolicy(ctx, id)` — ADMIN; ACTIVE → DRAFT.
- `archivePolicy(ctx, id)` — ADMIN; ACTIVE → ARCHIVED.
- `getPolicyVersionHistory(ctx, id)` — ADMIN.

`policy/acknowledgements.ts`:
- `acknowledgePolicy(ctx, policyId)` — USER; records acknowledgement for current policy version.
  Idempotent (unique constraint on `(policyId, userId, policyVersion)`).
- `listAcknowledgements(ctx, policyId)` — ADMIN; who has and has not acknowledged.
- `pendingAcknowledgements(ctx, userId?)` — USER sees their own; ADMIN sees all pending.
- `ackComplianceReport(ctx, policyId)` — ADMIN; for each applicable employee: acknowledged? When?
  Who has not?

---

## Notifications

On `publishPolicy`:
- Send `policy.published` notification to all applicable employees.
- Channel: IN_APP + EMAIL.
- Template in `@avkash/emails`: "A new policy is available for your review."

On policy version update (while ACTIVE):
- Send `policy.updated` notification.
- Template: "The [Policy Name] has been updated. Please re-read."

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/policies` | ADMIN | idempotency |
| GET | `/policies` | USER | ADMIN sees all; USER sees applicable active |
| GET | `/policies/:id` | USER | full body |
| PATCH | `/policies/:id` | ADMIN | If-Match on dbVersion |
| POST | `/policies/:id/publish` | ADMIN | DRAFT → ACTIVE |
| POST | `/policies/:id/unpublish` | ADMIN | ACTIVE → DRAFT |
| POST | `/policies/:id/archive` | ADMIN | ACTIVE → ARCHIVED |
| GET | `/policies/:id/history` | ADMIN | version snapshots |
| POST | `/policies/:id/acknowledge` | USER | record acknowledgement |
| GET | `/policies/:id/acknowledgements` | ADMIN | compliance report |
| GET | `/policies/pending` | USER | policies I haven't acknowledged |

---

## Tests

- `isPolicyApplicable` returns false when user's location not in `locationIds`.
- `isPolicyApplicable` returns true when `locationIds = null` (all locations).
- `publishPolicy` snapshots body to `policy_version_history`, increments `policy.version`.
- `acknowledgePolicy` is idempotent (second call → no error, same row).
- `ackComplianceReport` correctly identifies employees who have not acknowledged.
- `listPolicies` for a USER returns only applicable ACTIVE policies.

---

## Build order

1. Enums (`policy_status`). Schema (`policy`, `policy_version_history`, `policy_acknowledgement`).
   `db:push`.
2. `isPolicyApplicable` pure function. Tests.
3. Domain functions in `policy/policies.ts` + `policy/acknowledgements.ts`.
4. Notifications (`policy.published`, `policy.updated`) — templates + dispatch.
5. Routes + DTOs.
6. Tests (full suite).
