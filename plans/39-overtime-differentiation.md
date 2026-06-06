# Plan 39 — Overtime tracking differentiation by employment level

Status: **implementation plan**. Suppresses the OVERTIME mark for executives and management who
stay late for audits or operational reasons — their extra hours are not compensated and should not
appear as overtime on the muster or payroll feed.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 29 (employment
level). Reads: Plan 38 (SEZ threshold).

---

## The gap

`resolveDay` computes an `OVERTIME` mark whenever `workedHours > shift.fullDayHours`. For WORKER-
level employees this is correct — overtime is compensated and tracked. For EXECUTIVE and MANAGEMENT
who stay after 18:30 for a maintenance audit, the extra hours are neither compensated nor clocked as
overtime; the OVERTIME mark would pollute payroll feeds and muster reports with false data.

---

## Design: `trackOvertime` flag on `Shift`

The clearest ownership is the shift definition, not the employee. A "General Shift" for executives
never produces overtime. A "Morning Shift" for workers always does. This avoids per-user overrides
and keeps the resolver logic simple.

```
Shift.trackOvertime: bool   default true
```

When `false`, `resolveDay` does not compute `overtimeHours` and does not add the `OVERTIME` mark,
regardless of how many hours the employee worked.

---

## Schema

`packages/db/src/schema/shift.ts` — add one column:

```
trackOvertime   bool   notNull   default true
```

Default `true` preserves existing behaviour for all current shifts.

---

## Resolver change

`packages/attendance/src/resolver.ts` — in `resolveDay`, in the marks computation:

```ts
// Before (current):
if (workedHours > shift.fullDayHours) marks.push('OVERTIME')
overtimeHours = max(0, workedHours - shift.fullDayHours)

// After:
if (shift.trackOvertime) {
  const threshold = location?.overtimeThresholdHours ?? shift.fullDayHours  // Plan 38
  if (workedHours > threshold) marks.push('OVERTIME')
  overtimeHours = max(0, workedHours - threshold)
} else {
  overtimeHours = 0
}
```

`overtimeHours` in `DayAttendance` is always 0 when `trackOvertime = false`. The field is kept in
the output type — callers that sum overtime across days naturally get 0 for these employees.

---

## Muster report impact (Plan 25)

The muster `summarize(days)` function sums `overtimeHours` from each `DayAttendance`. Since
`overtimeHours` is already 0 for non-tracking employees, the muster naturally shows 0 overtime for
executives — no change to the summary logic needed.

---

## Payroll feed impact (Plan 25, designed-deferred)

The payroll feed design already notes that "OT buffer" is a policy knob. `trackOvertime = false`
means `overtimeHours = 0` enters the feed. Payroll sees no OT to pay. Correct.

---

## Seeding for this org

On setup:

```ts
await updateShift(ctx, generalShiftId, { trackOvertime: false })
await updateShift(ctx, flexibleShiftId, { trackOvertime: false })
// Worker shifts keep trackOvertime = true (default)
```

---

## API surface

`PATCH /shifts/:id` — gains `trackOvertime` as a patchable field. ADMIN only.
`GET /shifts` + `GET /shifts/:id` — `shiftDto` includes `trackOvertime`.

---

## Employment-level override (optional, deferred)

An alternative design lets `employmentLevel` override the shift flag (e.g., a MANAGEMENT-level user
on a WORKER shift still gets no overtime). This is deferred — the shift-level flag covers the
manufacturing use case. If needed later, add `Level.trackOvertime` in the same pattern as Plan 36's
level policies.

---

## Tests

- `resolveDay` with `shift.trackOvertime = false` → `overtimeHours = 0`, no OVERTIME mark, even
  when `workedHours = 10`.
- `resolveDay` with `shift.trackOvertime = true` and SEZ `overtimeThresholdHours = 9` → OVERTIME
  mark only after 9 hours.
- `resolveDay` with `shift.trackOvertime = true` and no SEZ threshold → OVERTIME after `fullDayHours`.
- `summarize(days)` with mixed-level days → correct per-person overtime total.

---

## Build order

1. Add `trackOvertime bool default true` to `shift`. `db:push`.
2. Update `resolveDay` marks block (integrate Plan 38 threshold in same change).
3. Extend `shiftDto`.
4. Tests.
