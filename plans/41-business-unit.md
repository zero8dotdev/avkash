# Plan 41 — Business unit / subsidiary brand entity

Status: **implementation plan**. Allows a subset of employees (the sales subsidiary) to be
associated with a different brand name and logo, which surfaces on employee-facing documents and
communications without creating a separate org.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Independent of other plans.

---

## Context

The sales arm operates under a subsidiary brand name (different from the parent company) for
marketing purposes, but is legally the same employer. Employees in this unit expect their offer
letters, payslips, and email footers to carry the subsidiary brand — not the factory's parent name.
A separate Avkash org would mean duplicate user management and no shared HR data. A `BusinessUnit`
entity solves this within the same org.

---

## Design

A `BusinessUnit` is a branding overlay. It carries:
- Display name (brand name for documents)
- Legal name (same as parent, or slightly different formal name)
- Logo URL
- Brand colour (hex, for emails/letterheads)

A user has at most one business unit (`User.businessUnitId`). When generating any document or
communication for that user, the system substitutes the business unit's name/logo for the org's
name/logo where applicable.

---

## Schema

`packages/db/src/schema/org.ts` — new table:

```
business_unit
  id           uuid PK
  orgId        uuid FK → organisation
  name         varchar  notNull    (brand/display name, e.g. "Avkash Sales Co.")
  legalName    varchar?            (formal legal name; null = same as org)
  logoUrl      varchar?
  brandColor   char(6)?            (hex without #)
  isActive     bool default true
  version      integer default 0
  createdAt / updatedAt / createdBy / updatedBy
  unique(orgId, name)
```

`packages/db/src/schema/user.ts` — add:

```
businessUnitId   uuid? FK → business_unit   (null = parent org branding)
```

---

## Domain (`@avkash/org`)

New file `org/business-units.ts`:

- `createBusinessUnit(ctx, input)` — ADMIN only; unique name guard.
- `listBusinessUnits(ctx)` — ADMIN; returns all units.
- `getBusinessUnit(ctx, id)` — ADMIN.
- `updateBusinessUnit(ctx, id, patch, version?)` — ADMIN; concurrency.
- `archiveBusinessUnit(ctx, id)` — ADMIN; `isActive = false`.

Extend `@avkash/users`:
- `setUserBusinessUnit(ctx, userId, businessUnitId)` — ADMIN; sets `user.businessUnitId`.
- `listEmployees` gains optional `?businessUnitId=` filter.

Helper (pure, used by document generation):

```ts
function resolveOrgBrand(
  org: Organisation,
  businessUnit?: BusinessUnit | null
): { name: string; legalName: string; logoUrl?: string; brandColor?: string }
```

Returns business unit fields when set, falls back to org fields. This is the single source of
truth for branding in templates.

---

## Where it surfaces

| Surface | Change |
|---------|--------|
| Offer letters / documents (`@avkash/documents`, future) | Use `resolveOrgBrand(org, user.businessUnit)` |
| React Email templates (`@avkash/emails`) | Pass brand context; footer shows unit name/logo |
| Employee profile DTO | Includes `businessUnit: { name, logoUrl, brandColor }?` |
| Payslip header (future `@avkash/payroll`) | Brand name on letterhead |

The API itself never changes branding — it is a document/template concern. `resolveOrgBrand` is
exported from `@avkash/org` for use by downstream packages.

---

## API surface

| Method | Route | Guard | Notes |
|--------|-------|-------|-------|
| POST | `/business-units` | ADMIN | idempotency |
| GET | `/business-units` | ADMIN | |
| GET | `/business-units/:id` | ADMIN | ETag |
| PATCH | `/business-units/:id` | ADMIN | If-Match |
| DELETE | `/business-units/:id` | ADMIN | soft-archive |
| PATCH | `/employees/:userId/business-unit` | ADMIN | set user's unit |

---

## DTO

`businessUnitDto` = `createSelectSchema(business_unit).omit({ orgId, createdBy, updatedBy })`.

`employeeDto` (existing `listEmployees`) gains `businessUnit: { id, name, logoUrl }?` (joined from
`business_unit` via `user.businessUnitId`).

---

## Tests

- `resolveOrgBrand` returns business unit fields when `businessUnit` is provided.
- `resolveOrgBrand` falls back to org fields when `businessUnit` is null.
- `createBusinessUnit` blocks duplicate names within the same org.
- `setUserBusinessUnit` with a unit from a different org → `NotFoundError`.
- `listEmployees({ businessUnitId })` returns only users in that unit.

---

## Build order

1. Schema (`business_unit`, `user.businessUnitId`). `db:push`.
2. `resolveOrgBrand` pure helper.
3. Domain CRUD in `org/business-units.ts`.
4. Extend `listEmployees` filter + `employeeDto`.
5. Routes + DTOs.
6. Tests.
