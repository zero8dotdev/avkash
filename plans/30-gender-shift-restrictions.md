# Plan 30 — Gender-based shift restrictions

Status: **implementation plan**. Enforces the SEZ legal prohibition on female workers being rostered
to the night shift. The restriction is data-driven (stored on the shift), not hardcoded, so it can
accommodate any future gender-shift rule without a code change.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level), Plan 38 (SEZ flag).

---

## Legal context

Under the factories' SEZ regulations, females are prohibited from working the night shift on SEZ
premises. This is not a preference — it is a statutory requirement. The system must **block** the
assignment, not warn. An accidental roster by an admin must not be possible.

---

## Design: restriction on the Shift, not on the user

Two options considered:

1. **Blocklist on user** — `user.forbiddenShiftIds[]`. Problem: HR would have to maintain this for
   every female employee; it's operationally fragile and doesn't survive shift additions.

2. **Allowlist on shift** (chosen) — `shift.allowedGenders: varchar[]` (null = unrestricted). The
   night shift carries `['MALE']`; any shift carrying a gender restriction is checked at assignment
   time against the employee's `EmployeeProfile.gender`. Night shift added, female constraint
   automatically applies to everyone — zero per-user maintenance.

---

## Schema

`packages/db/src/schema/shift.ts` — add one column:

```
allowedGenders   varchar[]?   default null   (null = all genders allowed)
```

Values match `EmployeeProfile.gender` strings exactly (e.g. `'MALE'`, `'FEMALE'`). Using varchar[]
rather than an enum preserves flexibility for non-binary / unspecified categories in the future.

No join table needed. Shift is already a small entity; the array column is sufficient.

---

## Guard in `assignShift`

`packages/attendance/src/shift.ts` — `assignShift(ctx, userId, shiftId, fromDate, toDate)`:

```
1. Fetch shift → if shift.allowedGenders is null, skip check.
2. Fetch EmployeeProfile for userId → read gender.
3. If gender is not null and allowedGenders does not include gender:
     throw new BusinessRuleError('SHIFT_GENDER_RESTRICTED', { shiftId, gender })
4. If gender is null (not recorded):
     accept the assignment but set AttendancePunch.flagged = true on any punches
     (don't block — unrecorded gender shouldn't lock out onboarding).
```

`force=true` (used in Plan 24 for hard conflicts) does **not** bypass this check. Gender restriction
is statutory; no admin override. This is the one guard that ignores `force`.

---

## Guard in the roster generator (Plan 24, Phase C)

`generateRoster` calls `validateAssignment` before persisting. The same gender check runs inside
`validateAssignment`, surfacing as a `conflict` (hard) in the result, not a `warning`. Affected
slots are left unassigned; the coverage report (Plan 24, Phase B) will surface the gap.

---

## Validation route

`POST /shifts/assignments/validate` (existing dry-run from Plan 24) — the response body already
returns `conflicts[]` and `warnings[]`. Gender conflicts appear as:

```json
{
  "type": "GENDER_RESTRICTED",
  "userId": "...",
  "shiftId": "...",
  "message": "Night shift is restricted to MALE employees (SEZ regulation)"
}
```

---

## Shift management API extension

`PATCH /shifts/:id` (existing) — `allowedGenders` is now a patchable field. ADMIN only.

On creation of the Night shift, HR sets `allowedGenders: ['MALE']`. No other configuration needed.

---

## DTO

`shiftDto` gains `allowedGenders` in the output so the UI can show the restriction badge on the
roster builder without a separate fetch.

---

## SEZ coupling (Plan 38)

`assignShift` only enforces `allowedGenders` when the shift is used at an SEZ location. This is
resolved through the user's `effectiveLocation` (from Plan 34's resolver, or `user.locationId`):

```
if shift.allowedGenders != null:
  location = effectiveLocation(userId, fromDate)
  if location.laborRegime == 'SEZ' OR shift.allowedGenders set explicitly:
    enforce the check
```

If Plan 38 has not yet shipped, treat `allowedGenders != null` as always enforced (conservative
default — better to over-enforce than to violate SEZ law).

---

## Tests

- `assignShift` throws `SHIFT_GENDER_RESTRICTED` when female user is assigned to a shift with
  `allowedGenders: ['MALE']`.
- `assignShift` succeeds when gender is not in `allowedGenders` but `force=true` — wait, no:
  gender restriction ignores `force`. Test that `force=true` does NOT bypass the guard.
- `assignShift` succeeds when `allowedGenders = null` (no restriction set).
- `assignShift` accepts the assignment (with no gender error) when `EmployeeProfile.gender = null`
  (gender not recorded) — but does not throw.
- `validateAssignment` returns a `GENDER_RESTRICTED` hard conflict, not a warning.

---

## Build order

1. Add `allowedGenders varchar[]?` to `shift`. `db:push`.
2. Add gender check in `assignShift` (before the existing leave/double-booking checks).
3. Propagate to `validateAssignment`.
4. Extend `shiftDto`.
5. Tests.
