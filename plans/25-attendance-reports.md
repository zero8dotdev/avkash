# Plan 25 — Attendance reports (muster + summaries) · payroll feed designed, deferred

Status: **implementation plan**. Phase 5 turns the resolver's per-day output into the things a
business reads. Scope decision: **build the report layer now; design — but do not build — the
payroll feed** (that lands when `@avkash/payroll` is built, so the wage model and the feed ship
together rather than half-built).

## Build now — the report layer (no money, no policy)

Pure read-only rollups of the resolver we already trust (`listAttendance` → `DayAttendance`),
role-gated (MANAGER for a team, ADMIN wider). No new resolution logic.

- **Muster roll** — `GET /reports/muster?teamId=&from=&to=`. Per member: the resolved day grid
  (status + marks + hours) **plus a per-person summary**: present / absent / on-leave / weekly-off /
  holiday / wfh counts, half-days, late-days, early-departures, worked-hours, overtime-hours. This is
  the compliance register HR/auditors ask for — and the summary already answers "who's late a lot,
  who's absent, who's racking up OT" without a separate report.
- **Pure `summarize(days)`** — the counting is a pure fold over `DayAttendance[]` → unit-tested like
  the rest of the attendance math.
- (Thin follow-ups if wanted) org-wide late / absence lists are just the muster summary filtered;
  add on demand.

## Designed, deferred — the payroll feed (build with `@avkash/payroll`)

The numbers payroll multiplies by salary. Captured here so it's not lost; **not implemented now**.

`GET /reports/payroll?period=YYYY-MM&locationId=` → per person:

- `payableDays` — present + paid-leave + holidays + weekly-offs (paid for monthly-salaried)
- `lopDays` — **loss of pay**: absent-without-leave + unpaid-leave
- `overtimeHours`, `halfDays`, and the raw counts (present/leave/off/holiday)

**The feed gives counts; payroll turns them into rupees.** It deliberately stops at counts so the
wage model (salaried vs daily-wage, half-day-pay, OT rate) lives in payroll, not attendance.

### The hard decisions it forces (why it waits for payroll)

- **What's payable is policy, not math.** Paid weekly-offs/holidays? (yes salaried, no daily-wage.)
  Half-day = half-pay? Unapproved absence → LOP? → an **attendance/payroll policy** (org → location
  cascade, the inherit-by-null pattern). This belongs with the wage model.
- **LOP is a salary deduction** — must be exact and auditable; it literally removes pay.
- **OT buffer** — the cafe sim caught OT firing at 8.03h (2 min over). A payroll-grade feed needs an
  OT threshold (count only beyond `fullDay + buffer`, and/or **approved-only**), else you pay OT for
  rounding noise. This is a policy knob that ships with payroll.
- **Daily-wage vs salaried** are different worlds; the feed exposes counts and lets the wage model
  decide.

### Why deferred (the call we made)

Building a payroll *feed* without the payroll *consumer* means guessing the policy shape twice. The
feed, the payable/LOP policy, and the OT buffer all want to ship together with `@avkash/payroll` so
they're designed against a real wage model — not stubbed and reworked.

## Performance note (motivates Phase 6)

Muster/payroll over a whole-org month is many `resolveDay` calls. Computed-on-read is correct and
fine for a team; for an org month it's heavy. That's exactly what **Phase 6's materialized
`AttendanceDay` + period lock** is for (also gives payroll a *frozen* truth — once a month is paid, a
late device punch can't silently change paid days). Phase 5 stays computed-on-read; Phase 6 makes it
fast and immutable.

## Build order

1. **Muster + `summarize`** (now) — pure rollups, `GET /reports/muster`, unit-tested.
2. (Later, with payroll) the payroll feed + payable/LOP policy + OT buffer.
