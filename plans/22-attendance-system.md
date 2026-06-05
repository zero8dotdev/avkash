# Plan 22 — Attendance system for multi-location businesses (think-first)

Status: **design / thinking doc** — what we must decide _before_ building. Extends plan 19
(the punch spine + `resolveDay`, already shipped) toward a real multi-location, machine-fed,
shift-aware system. No code here — this maps the domain, the hard problems, and the calls to make.

What's already built (plan 19): `AttendancePunch` event log, `recordPunch`, the `resolveDay`
resolver (HOLIDAY > WEEKLY_OFF > ON_LEAVE > PRESENT/WFH > ABSENT), self check-in/out, `/me` +
team-today. This plan adds **devices, locations-as-entities, shifts, and shift-aware status**.

---

## 0. The realization that reshapes everything: location must become an entity

Today a "location" is a **string** (`organisation.location: varchar[]`, `team.location`,
`holiday.location`, `punch.location`). That's fine for tagging. It is **not** enough for what's
being asked: a location that owns _machines_, a _timezone_, _allowed punch windows_, a _geofence_.

So step one is promoting **Location** to a first-class table. Everything else (devices, shifts,
timezone math) hangs off it. Migration concern: existing string locations must map to Location rows
(by name, per org) — a backfill, and the string columns become `locationId` FKs (or we keep the
string as a denormalized label during transition).

**This is the single biggest decision in the plan.** Recommend: do it — a multi-location attendance
system without a Location entity will fight us forever (timezones especially).

---

## 1. Locations — the configuration home

A `Location` per org carries everything machine- and time-related:

- **timezone** (IANA, e.g. `Asia/Kolkata`) — _the_ critical field. Punches store UTC; everything
  human (shift start, "today", allowed windows, the muster grid) is computed in the location's TZ.
- **address / geo** (lat/lng + radius) — for mobile/geofenced punches.
- **allowed punch window(s)** — e.g. gates accept punches 05:00–23:00 local; outside → rejected or
  flagged. Per-location, possibly per-day-of-week.
- **IP allowlist** (optional) — web punches only from the office network.
- **holiday calendar** — already keyed by location string; moves to `locationId`.
- **status** (active/closed).

Open Qs: can one **user** belong to multiple locations (travelling staff, multi-site)? Can a **team**
span locations? Recommend: a user has a _home_ location, but a punch records the location it
_happened at_ (the device's), which may differ — important for the allowed-window check and TZ.

---

## 2. Devices / attendance machines — the new ingest path

Each location has zero or more machines (biometric / RFID / face / tablet-kiosk). Model a `Device`:

- `id`, `locationId`, `name`, `kind` (BIOMETRIC/RFID/FACE/KIOSK/MOBILE), `serial`, `status`.
- **auth secret** — a per-device token/HMAC key. Punch ingest is signed by the device, not a user
  session. (Reuse the `/internal`-token pattern, but **per-device** so we can revoke one machine.)
- `lastSeenAt`, firmware/agent version (for fleet health).

### Enrollment — the mapping problem

A machine knows a person by its own id (a fingerprint template id, a card number, an employee code),
**not** our `userId`. We need a `DeviceEnrollment` / identity map: `(deviceId or locationId, externalId) → userId`.
Without this, a punch can't be attributed. Decisions: enroll per-device or per-org (one badge works
everywhere)? Who manages enrollment (HR UI + a device-admin sync)?

### Ingest — `POST /attendance/punch` (device-authed)

- Payload: `externalId` (or `userId`), `ts` (device clock), optional `direction`, `deviceId`.
- **Direction resolution**: machines often send just "punch" — server infers IN/OUT from the user's
  last punch state that day/shift (toggle). Need a rule for the first punch of a shift (IN) and
  mis-toggles.
- **Idempotency**: dedupe on `(deviceId, externalId, ts)` — a device retrying a batch must not
  double-punch. (We already have the idempotency muscle.)
- **Offline buffering**: machines buffer when the network's down and **push a batch later** with
  _original timestamps_. So ingest must accept backdated punches and **recompute** affected days.
- **Clock trust / skew**: do we trust the device clock or stamp server-time? Recommend trust the
  device `ts` (offline case needs it) but record `receivedAt` too, and flag implausible skew.
- **Time-window enforcement**: reject/flag punches outside the location's allowed window.

### Multiple machines at one location

Two readers, same person double-taps → dedup within a small window (e.g. same user, same direction,
< 60s → one punch). The event log keeps both; the resolver dedups.

---

## 3. The punch model — from events to a worked day

Punches are an **event log** (already). Turning them into a day is where the rules live:

- **Pairing into sessions**: IN→OUT pairs. Lunch/breaks = multiple sessions. Worked hours = Σ
  paired session durations (not just last-out − first-in), unless policy says span-based.
- **Mis-punches**: forgot to punch out → an unclosed session. Rules: auto-close at shift end? cap a
  session at N hours? mark the day "needs regularization"? (Recommend: auto-close at shift end +
  flag for regularization.)
- **Overnight**: a session that crosses midnight belongs to the **shift-day**, not the calendar day
  (see shifts). Worked-hours and "which date" both depend on shift attribution.

---

## 4. Shifts — the second spine

A `Shift` definition (per org, assigned down):

- `name`, `startTime`, `endTime` (local to the location/shift TZ), `breakMinutes`,
  `graceMinutes` (late threshold), `fullDayHours`, `halfDayHours`.
- **`crossesMidnight`** — a night shift 22:00–06:00. Drives day-attribution: a punch at 02:00
  belongs to the _previous_ calendar day's shift.
- **weekly-off pattern** — may differ from the user's `workweek` (shift rosters define their own
  off-days).

### Assignment & rosters — the hard part

- **Static**: `user.shiftId → team.defaultShiftId` cascade (the null-means-inherit pattern, MVP).
- **Rotating rosters**: morning/afternoon/night rotating weekly; a `ShiftAssignment` is
  **effective-dated** (`userId, shiftId, fromDate, toDate`) or a generated schedule per day. This is
  the big v2 lift — a person's shift _on a given date_ becomes a lookup, and the resolver must use
  the shift that applied _that day_, not their current one.
- **Open/flex shift**: no fixed start; only total-hours matters (no LATE mark, just hours).

### How shift changes the resolver

Extend `resolveDay` (today: PRESENT/ABSENT/etc.) with shift-aware **marks** layered on PRESENT:

- **LATE** — first-in > shiftStart + grace.
- **EARLY_DEPARTURE** — last-out < shiftEnd − grace.
- **HALF_DAY** — worked < halfDayHours (and partial-leave interplay).
- **OVERTIME** — worked > fullDayHours (+ policy: only approved OT counts).
- **SHORT / UNDERTIME**, **ON_TIME**.

No shift assigned → present/absent + raw hours only (today's behavior). The status becomes a
**status + marks[]** (a day can be PRESENT + LATE + OVERTIME), not a single enum.

---

## 5. Attendance policy — the knobs, cascaded

A `AttendancePolicy` (org → location → shift → team, inherit-by-null, like our other cascades):

- grace minutes, half-day rule, min-hours-for-present, max auto-close hours.
- **derived penalties**: "3 lates in a month = 1 half-day LOP", consecutive-absence alerting.
- overtime rule (auto vs approved-only), break deduction (paid/unpaid).
- WFH: allowed? self-declared vs pre-approved (plan 19 open Q).

---

## 6. Status resolution — the keystone, evolved

`resolveDay` grows to take **(shift-for-that-date, location TZ, policy, punches, leave, holidays,
workweek)** → `{ status, marks[], firstIn, lastOut, workedHours, overtimeHours, isComplete }`.
Precedence unchanged at the top (HOLIDAY > WEEKLY_OFF > ON_LEAVE > worked > ABSENT); the new work is
**hours + marks under "worked"**, all computed in the location's timezone with shift attribution.
Half-day **leave** + half-day **present** must combine (morning CL + afternoon worked = full day).

---

## 7. Regularization, comp-off, reporting (mostly from plan 19)

- **Regularization** — request to fix a day (missing punch / wrong status) → manager approval (reuse
  `canApprove` + comment thread + escalation). Writes a `REGULARIZATION`-source punch; recompute.
- **Comp-off link** — punches on WEEKLY_OFF/HOLIDAY → comp-off eligible → `earnCompOff` (manager
  approved). Already wired conceptually.
- **Muster / reports** — monthly grid (person × day → P/A/L/HD/WO/H + late/OT), late report,
  absence report, **payroll feed** (present-days, LOP days, OT hours).

---

## 8. Computed-on-read vs materialized — and day finalization

Plan 19 chose **computed-on-read** (always correct). With shifts + many punches + monthly muster +
backdated device batches, two pressures appear:

1. **Reporting cost** — recomputing a 500-person month on every report view.
2. **Payroll needs a frozen truth** — once payroll runs for March, March attendance must be
   **locked** (a later backdated punch can't silently change paid days).

So the likely end-state is a **hybrid**: computed-on-read for live/open days, plus a materialized
**`AttendanceDay`** that gets **finalized/locked** when a period closes (payroll). Backdated changes
after lock go through an _adjustment_, not a silent recompute. Decision: when to introduce the
materialized table (MVP can stay computed-on-read; add it with payroll).

---

## 9. Notifications (reuse the system we just built)

Natural events for the outbox pipeline: missing-punch reminder (end of shift, no OUT), late alert to
manager, regularization requested/decided, absent-without-leave alert, device-offline alert to admin.
Each is a template + a `dispatch` call — the muscle exists.

---

## 10. The genuinely hard problems (call these out loud)

| Problem                                 | Why it bites                                                 | Direction                                                      |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| **Timezones**                           | multi-location across TZs; "today" and shift start are local | store UTC, compute in `location.timezone`; never use server TZ |
| **Overnight shifts**                    | a 02:00 punch belongs to yesterday's shift                   | shift-day attribution, `crossesMidnight`                       |
| **DST**                                 | a shift can be 23h or 25h on switch days                     | TZ-aware duration math (let the TZ lib handle it)              |
| **Mis-punches**                         | forgot to punch out                                          | auto-close at shift end + flag regularization                  |
| **Offline device batches**              | backdated punches arrive late                                | accept backdated `ts`, idempotent, recompute affected days     |
| **Double readers**                      | two machines, one person                                     | dedup same user+direction within N seconds                     |
| **Backdated recompute vs payroll lock** | truth changes after pay                                      | finalize/lock + adjustments                                    |
| **Rotating rosters**                    | shift differs per date                                       | effective-dated shift-for-date lookup                          |
| **Multi-site staff**                    | punch location ≠ home location                               | punch carries its own locationId/TZ                            |

---

## 11. Open decisions (need your call)

1. **Promote `location` to an entity now?** (Recommend **yes** — it's the spine.) Migrate string → FK.
2. **Device auth**: per-device HMAC/token (recommend) vs one org-wide ingest token.
3. **Enrollment scope**: per-device vs per-org identity map (recommend per-org: one badge, all sites).
4. **Direction**: trust device IN/OUT, or server-infer by toggle? (Recommend infer when absent.)
5. **Clock**: trust device `ts` (recommend, needed for offline) + record `receivedAt`.
6. **Worked hours**: Σ paired sessions (recommend) vs span (first-in→last-out).
7. **Shift assignment**: static cascade (MVP) vs effective-dated roster (v2 rotation).
8. **Status shape**: single enum → **status + marks[]** (recommend; a day can be PRESENT+LATE+OT).
9. **Materialized `AttendanceDay`**: defer to payroll, or build with shifts? (Recommend defer.)
10. **Allowed-window violation**: reject the punch, or accept-and-flag? (Recommend accept + flag.)

---

## 12. Suggested phasing

1. **Locations as entities** (+ timezone) and migrate the string columns. _Foundation for the rest._
2. **Devices**: registry + per-device auth + `POST /attendance/punch` ingest (direction infer,
   idempotent, allowed-window check) + enrollment map.
3. **Shifts**: definitions + static assignment cascade + shift-aware `resolveDay` (marks + hours, TZ
   - overnight). _The status engine grows here._
4. **Regularization** + comp-off-on-non-working-day (reuse approval).
5. **Reports**: muster + late/absence + a payroll feed.
6. **v2**: rotating rosters, materialized `AttendanceDay` + period lock, geofence/IP enforcement,
   device-fleet health + offline alerts.

Phases 1–3 are the real "multi-location + machines + shifts" ask; 4–6 round it out.
