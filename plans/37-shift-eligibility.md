# Plan 37 — Shift eligibility rules (level + gender)

Status: **implementation plan**. Prevents invalid shift assignments by enforcing which employment
levels may be rostered to which shifts, composing with the gender restriction from Plan 30.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level), Plan 30 (gender restrictions).

---

## The gap

Currently `assignShift` validates leave conflicts, double-booking, and rest gaps (Plan 24). It does
not check whether a shift is appropriate for the employee's level. An admin can roster a plant head
(MANAGEMENT) onto a WORKER rotating shift, or a desk executive onto the night shift.

---

## Design: `allowedLevels` on `Shift`

Plan 30 introduced `allowedGenders` on `Shift`. The same pattern applies to levels: a shift carries
`allowedLevels: employment_level[]?` — null means all levels may be assigned.

| Shift | allowedLevels |
|-------|--------------|
| Morning (06–14) | `['WORKER']` |
| Afternoon (14–22) | `['WORKER']` |
| Night (22–06) | `['WORKER']` |
| General / Day (10:30–18:30) | `['EXECUTIVE', 'MANAGEMENT', 'FIELD']` |
| Flexible | `['MANAGEMENT']` |

These are defaults at setup time; HR can adjust. `null` on a custom shift = no restriction.

---

## Schema

`packages/db/src/schema/shift.ts` — add one column (alongside the `allowedGenders` from Plan 30):

```
allowedLevels   employment_level[]?   default null   (null = unrestricted)
```

---

## Guard in `assignShift`

`packages/attendance/src/shift.ts` — after the gender check (Plan 30), add:

```
1. Fetch shift → if shift.allowedLevels is null, skip check.
2. Fetch employmentLevel for userId via getEmployeeLevel().
3. If employmentLevel is not null AND allowedLevels does not include employmentLevel:
     throw BusinessRuleError('SHIFT_LEVEL_RESTRICTED', { shiftId, employmentLevel })
4. If employmentLevel is null (unclassified):
     skip check (null = permissive, per Plan 29 decision).
```

`force=true` **does** bypass this check (unlike gender — level restriction is policy, not law).
When forced, the audit log records the override.

---

## Guard in `validateAssignment` (dry-run, Plan 24)

Same check runs in `validateAssignment`. Level conflicts appear as **warnings** (not hard conflicts)
because they can be force-overridden, unlike gender conflicts which are always hard.

```json
{
  "type": "LEVEL_RESTRICTED",
  "severity": "WARNING",
  "userId": "...",
  "shiftId": "...",
  "message": "General shift is not typically assigned to WORKER-level employees."
}
```

---

## Guard in the roster generator

`generateRoster` skips a user for a shift if their level is not in `allowedLevels`. The coverage
report does not count level-ineligible users in the available pool for a shift.

---

## DTO extension

`shiftDto` gains `allowedLevels` alongside `allowedGenders` — the roster builder UI can show both
restrictions at a glance.

---

## API: updating a shift's eligibility

`PATCH /shifts/:id` (existing) — `allowedLevels` is a patchable field. ADMIN only.

---

## Seeding for this org

On setup, for each shift definition:

```ts
await updateShift(ctx, morningShiftId, { allowedLevels: ['WORKER'] })
await updateShift(ctx, afternoonShiftId, { allowedLevels: ['WORKER'] })
await updateShift(ctx, nightShiftId, { allowedLevels: ['WORKER'], allowedGenders: ['MALE'] })
await updateShift(ctx, generalShiftId, { allowedLevels: ['EXECUTIVE', 'MANAGEMENT'] })
await updateShift(ctx, flexibleShiftId, { allowedLevels: ['MANAGEMENT'], isFlexible: true })
```

---

## Tests

- `assignShift` throws `SHIFT_LEVEL_RESTRICTED` when EXECUTIVE is assigned to a WORKER-only shift.
- `assignShift` succeeds with `force=true` for a level-restricted shift.
- `assignShift` does NOT succeed with `force=true` for a gender-restricted shift (Plan 30).
- `validateAssignment` returns level conflict as WARNING, gender conflict as hard CONFLICT.
- `assignShift` with `allowedLevels = null` accepts any level.
- Unclassified user (level = null) is accepted on any shift.
- Roster generator skips EXECUTIVE from morning/afternoon/night slots.

---

## Build order

1. Add `allowedLevels employment_level[]?` to `shift`. `db:push`.
2. Add level check in `assignShift` (after gender check).
3. Propagate to `validateAssignment` as WARNING.
4. Extend `generateRoster` eligibility filter.
5. Extend `shiftDto`.
6. Tests.
