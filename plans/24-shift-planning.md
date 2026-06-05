# Plan 24 — Shift planning (make a roster that actually works)

Status: **implementation plan**. Turns the roster store (plan 23, Phase 3) into a planning tool:
it **refuses bad assignments** and **shows coverage gaps**, so a manager builds a schedule that
holds up. Same patterns as everywhere (Zod validate, DomainError, requireRole, bun-test pure logic).

## The two jobs of a planner

1. **Don't let a broken assignment in.** When you roster someone, validate against reality:
   - **Leave conflict** (hard) — they have an APPROVED leave covering that date. _Block._
   - **Double-booking** (hard) — they're already assigned a shift on that date. _Block._
   - **Min-rest** (warn) — too few hours between yesterday's shift end and today's start.
   - **Weekly-off** (warn) — the date is outside their workweek.
     Hard conflicts block unless `force=true`; warnings inform but don't block. A `validate` dry-run
     returns `{ conflicts[], warnings[] }` without writing — the UI calls it as you build the roster.

2. **Show the gaps.** Each shift gets a target headcount (`minStaff`). A **coverage** view over a
   location × date range reports, per (date, shift): assigned vs target, and flags **understaffed**
   (gap) or overstaffed. That's how you see "Friday Evening at Rajur has 0 of 2" before it bites.

## Increments

- **A — Validated assignment** (this build): `shift.minStaff`; pure `restMinutes(prev, next)`
  (tested); `validateAssignment(ctx, input) → { conflicts, warnings }`; `assignShift` blocks hard
  conflicts unless `force`; `POST /shifts/assignments/validate` (dry-run) + `?force` on assign.
- **B — Coverage** (this build): `coverage(ctx, locationId, from, to)` → per (date, shift) assigned
  vs `minStaff` + gap; `GET /shifts/coverage`.
- **C — Roster generator** (next): `POST /shifts/roster/generate` — given users + shifts + a date
  range, produce a fair rotation that already respects leave / weekly-off / min-rest (the sim's
  `(i+day)%n` rotation, but constraint-aware and persisted as assignments).
- **D — Swaps** (later): staff request a shift swap → manager approves (reuse the leave approval
  engine: `canApprove` + comments + escalation).

## Notes

- Validation reuses data we already have — leave (approved ranges), workweek, shift times — so it's
  reads + pure checks, no new dependencies.
- `restMinutes` is pure (shift A end → shift B start, TZ-agnostic in minutes, overnight-aware) →
  unit-tested like the other shift math.
- Coverage scopes "who's at this location" by `user.locationId`, resolving each person's effective
  shift per day via `shiftForDate`.
