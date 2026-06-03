# Plan 19 — Attendance

Status: design (for review). Goal: capture who actually worked when, resolve it against the
calendar we already model (workweek + holidays + leave), and feed comp-off. Lives in the
existing `@avkash/attendance` package (currently a stub).

## The core idea: attendance is a _resolution_, not just a punch

We already know what a day is _supposed_ to be — workweek says which days are working days,
holidays says which are off, the leave engine says who's approved off. Attendance fills in **what
actually happened**. So the heart of this domain is one function:

```
statusForDay(user, date) precedence:
  HOLIDAY            (resolveHolidays — built)
  > WEEKLY_OFF       (not in workweek — built)
  > ON_LEAVE         (an APPROVED leave covers it — built)
  > PRESENT / WFH    (punches exist)  + marks: LATE / EARLY_OUT / HALF_DAY (from shift)
  > ABSENT           (a working day, no punches, no leave)
```

Everything below feeds that resolver. The cross-domain reuse is the point — we're not rebuilding
the calendar, just layering actuals on it.

## Model

- **Shift** (org-level definition): name, startTime, endTime, graceMinutes, fullDayHours,
  halfDayHours, timezone (falls back to team.timeZone). "Each person a different shift" → assigned
  per person.
- **Shift assignment**: `shiftId` cascade `user → team.defaultShiftId` (same null-means-inherit
  pattern as workweek/holidays). No shift → present/absent only, no late/early marks.
- **AttendancePunch** (the event log): userId, orgId, ts, type (`IN`/`OUT`), source
  (`WEB`/`SLACK`/`DEVICE`/`REGULARIZATION`), location?, wfh?. Raw events — biometric devices push
  individual punches, people take lunch, etc. The daily record is **derived** from them.
- **Daily record** = derived, not primary: first-in, last-out, hoursWorked, resolved status. Either
  computed on read or materialized per-day for reporting (see open decisions).

## Capture — transport-agnostic, like the rest

One domain fn `recordPunch(ctx, {type, ts, source, wfh?, location?})`; many edges feed it:

- **Self** check-in/out (web/app/Slack) → `POST /attendance/check-in|check-out`.
- **Device/biometric** → a token-guarded ingest `POST /attendance/punch` (userId + ts + type), same
  shape, machine-auth (reuse the `/internal` token pattern).
- **Geofence/GPS** validation → deferred (location is captured, not yet enforced).

## Shift-derived marks

With a resolved shift: `LATE` if first-in > start + grace; `EARLY_OUT` if last-out < end − grace;
`HALF_DAY` if hoursWorked < halfDayHours; full if ≥ fullDayHours. Timezone from shift/team — punches
compare in local time.

## Regularization — reuse the approval pattern

People forget to punch. A **regularization** is a request to correct a day (add/fix punches or set a
status) with a reason → approved by the team manager (the exact `canApprove` + comment-thread +
escalation machinery the leave engine already has). On approval, a `REGULARIZATION`-source punch is
written. This is leave-approval's twin — almost no new authz.

## The comp-off link (attendance → leave)

Working on a `WEEKLY_OFF` or `HOLIDAY` (punches on a non-working day) makes the day **comp-off
eligible** → creates a `CompOff` via the existing `earnCompOff` (manual confirm, or auto on a
manager's nod). This is the §1B promise: comp-off earning _derived from real attendance_ rather than
self-asserted.

## API surface

| Method         | Route                                              | Purpose                                 |
| -------------- | -------------------------------------------------- | --------------------------------------- |
| POST           | `/attendance/check-in` · `/check-out`              | self punch (wfh?, location?)            |
| POST           | `/attendance/punch`                                | device/biometric ingest (token-guarded) |
| GET            | `/attendance/me?from=&to=`                         | my daily records (resolved)             |
| GET            | `/attendance/:userId?from=&to=`                    | a person's (manager/HR, scoped)         |
| GET            | `/attendance/today?teamId=`                        | team's live status (manager)            |
| POST           | `/attendance/regularizations`                      | request a correction                    |
| GET            | `/attendance/regularizations`                      | pending for approval                    |
| POST           | `/attendance/regularizations/:id/{approve,reject}` | decision                                |
| POST/GET/PATCH | `/shifts`, `/shifts/:id`                           | shift definitions (HR)                  |
| GET            | `/reports/attendance?month=&teamId=`               | muster roll                             |

DTOs + `{ data }` envelope + validation + idempotency on punches + optimistic concurrency on shift
edits — all per the standards we just made uniform.

## What we reuse (the architectural payoff)

workweek + holidays (the expected calendar) · leave (ON_LEAVE precedence + comp-off earning) ·
employee status (only ACTIVE employees are expected) · `canApprove` + comment thread + escalation
(regularization approval) · team.timeZone · the transport-agnostic edge (web/Slack/device).

## Build sequence

1. Schema: `Shift`, `AttendancePunch`, shift assignment (user/team), regularization table + enums
   (punch type/source, attendance status). `db:push`.
2. `recordPunch` + the **`statusForDay` resolver** (the keystone — combine punches + holidays +
   workweek + leave + shift).
3. Self check-in/out + device ingest routes.
4. Read: `/attendance/me`, `/:userId` (scoped), `/today`.
5. Regularization (request → approve, reuse the pattern) + comp-off-on-non-working-day.
6. Shifts CRUD + assignment.
7. Muster report.

## Open decisions (need your call)

1. **Daily record: computed-on-read vs materialized.** Recommend **computed-on-read** for the MVP
   (always correct, no sync), add a materialized cache when reports get heavy.
2. **Shift assignment home**: `user.shiftId → team.defaultShiftId` cascade (recommend) vs a
   dedicated effective-dated roster (defer — that's shift _rotation_, v2).
3. **WFH**: self-declared flag at check-in (recommend, MVP) vs a pre-approval request (v2).
4. **Comp-off on a non-working day**: auto-create on manager approval vs always manual `earnCompOff`.
   Recommend **manager-approved** (avoids gaming).
5. **Device auth**: reuse the `/internal` cron-token style for the ingest endpoint? (recommend yes.)

## Deferred (v2+)

Biometric hardware specifics (we expose the ingest endpoint; integration is theirs) · geofence/GPS
enforcement · shift rotation/rosters · WFH pre-approval · break/multi-session nuance · overtime pay.
