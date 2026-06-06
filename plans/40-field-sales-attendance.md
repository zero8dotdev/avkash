# Plan 40 — Field sales self-declaration approval

Status: **implementation plan**. Adds a manager-confirmation step to WEB-source punches from FIELD-
level employees, so a regional sales manager can review and approve their team's self-declared
attendance before it becomes authoritative.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Depends on: Plan 31 (attendance
source enforcement — establishes that FIELD employees use WEB only).

---

## The problem

A FIELD sales executive self-declares present via the web app. There is no fraud check, no manager
visibility, and the punch goes straight into the resolver as confirmed attendance. At scale, with
globally distributed field staff, self-declaration without a review loop is an audit liability.

---

## Design: confirmation flag on punches from FIELD employees

Two options considered:

1. **Separate approval table** — a `PunchApproval` entity. Clean separation, but adds joins
   everywhere the resolver reads punches.
2. **Status column on `AttendancePunch`** (chosen) — a `confirmationStatus` column that resolvers
   treat differently based on value. No schema joins added to the hot read path; the existing
   punch table gains one nullable column.

---

## Schema

`packages/db/src/schema/attendance.ts` — add to `attendancePunch`:

```
confirmationStatus   punch_confirmation?   default null
confirmedBy          uuid? FK → user
confirmedAt          timestamp?
```

New enum `punch_confirmation` in `enums.ts`:
```
PENDING_CONFIRMATION
CONFIRMED
REJECTED
```

`null` = no confirmation required (all existing punches, DEVICE/SLACK sources, non-FIELD employees).

---

## When confirmation is required

In `ingestPunch`, after the source-enforcement check (Plan 31):

```
if source === 'WEB' AND employmentLevel === 'FIELD':
  punch.confirmationStatus = 'PENDING_CONFIRMATION'
else:
  punch.confirmationStatus = null  (no confirmation needed)
```

This means MANAGEMENT-level WEB punches (Plan 35) are NOT held for confirmation — they are
auto-confirmed. Only FIELD employees' WEB punches wait.

---

## Resolver behaviour for pending punches

In `resolveDay`, when pairing punches into sessions:

- Punches with `confirmationStatus = 'PENDING_CONFIRMATION'` are **excluded from session pairing**.
- Punches with `confirmationStatus = 'CONFIRMED'` or `null` are included as normal.
- Punches with `confirmationStatus = 'REJECTED'` are excluded (treated as if they never arrived).

Effect: a FIELD employee who has not had their punch confirmed for the day appears as **ABSENT**
(or the existing status if they have a leave or holiday). Once the manager confirms, the resolver
re-runs and shows PRESENT. Since the resolver is computed-on-read, no backfill is needed.

A new `AttendanceStatus` variant is **not** introduced — the status reads ABSENT until confirmed.
This is intentional: ambiguity resolves to absent for payroll safety.

---

## Confirmation flow

**Manager confirms punches** — a regional manager reviewing their team's attendance for the week:

```
POST /attendance/confirm
Body: { punchIds: ["uuid", ...], action: "CONFIRM" | "REJECT", note?: string }
```

Guard: `canApprove(ctx, teamId)` — same predicate used by leave approval. The regional manager can
confirm punches for employees in their managed teams.

Bulk: confirms up to 100 punches per call. Each confirmation writes:
- `confirmationStatus = 'CONFIRMED'` (or `'REJECTED'`)
- `confirmedBy = ctx.userId`
- `confirmedAt = now()`

Audit entry per batch.

**Manager views pending punches** — a dashboard showing all unconfirmed punches for the manager's
FIELD employees:

```
GET /attendance/pending-confirmation?teamId=&from=&to=
```

Returns `AttendancePunch[]` where `confirmationStatus = 'PENDING_CONFIRMATION'`, scoped to teams
the caller manages.

---

## Notification

When a FIELD employee's punch awaits confirmation for more than N hours (configurable on the team,
default 24h), a notification is sent to the regional manager. Reuse the existing notification
dispatch pattern — new event `attendance.punch.awaiting_confirmation`.

---

## Daily summary for FIELD employee

`GET /attendance/me` or `GET /attendance/:userId` — the `DayAttendance` for a FIELD employee with
a PENDING punch shows:

```json
{
  "status": "ABSENT",
  "marks": ["PUNCH_PENDING_CONFIRMATION"],
  "pendingPunches": 1
}
```

The `PUNCH_PENDING_CONFIRMATION` mark is informational (not a hard status). The employee sees why
they appear absent.

---

## DTO

`attendancePunchDto` gains `confirmationStatus`, `confirmedBy`, `confirmedAt` in the output when
the caller is the employee or their manager.

---

## Tests

- FIELD WEB punch → `confirmationStatus = 'PENDING_CONFIRMATION'`.
- MANAGEMENT WEB punch → `confirmationStatus = null`.
- DEVICE punch (any level) → `confirmationStatus = null`.
- `resolveDay` excludes PENDING punches; employee shows ABSENT.
- `resolveDay` includes CONFIRMED punches; employee shows PRESENT.
- Confirmation by a manager of their team's FIELD employee → accepted.
- Confirmation by a manager of a different team's employee → `ForbiddenError`.
- `GET /attendance/pending-confirmation` returns only PENDING punches for the manager's teams.

---

## Build order

1. Enum (`punch_confirmation`). Add `confirmationStatus`, `confirmedBy`, `confirmedAt` to
   `attendancePunch`. `db:push`.
2. Modify `ingestPunch` to set `PENDING_CONFIRMATION` for FIELD WEB punches.
3. Modify `resolveDay` punch pairing to skip PENDING and REJECTED punches.
4. `POST /attendance/confirm` + `GET /attendance/pending-confirmation` routes.
5. Notification event + template.
6. Extend `attendancePunchDto`.
7. Tests.
