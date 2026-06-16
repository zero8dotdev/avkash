# Avkash for Indian HR — an educational demo

**Audience:** Indian HR managers, HRBPs, and plant HR officers evaluating an HRMS.
**Format:** every chapter first explains _how Indian companies actually run this HR practice_, then shows
the practice live in Avkash. You should learn (or recognize) something about your own field in each
chapter — the product demo is the proof, not the pitch.

**Setup** (one time): `docker compose up -d` → `pnpm db:push` → `pnpm demo:seed` → `pnpm demo:seed:india`.
The org is **Meridian Manufacturing**: a Coimbatore factory (Plants BU) and a Bengaluru HQ (Corporate BU).
Personas: Priya (HR admin, Bengaluru) · Rohan (shift manager, Assembly line) · Sara (operator, Assembly) ·
Dev (manager, Logistics) · Anita (HRBP for the Plants BU).

**Stable seeded IDs** (set these as env vars for the curl examples below):

```bash
export ORG_ID=6a5109da-bad7-4515-9b0c-7ecff8dc9448
export TEAM_ASSEMBLY_ID=9829047a-23a6-4e8d-b431-1b516190a60e
export PRIYA_ID=157a55a6-e7b5-4474-9f48-44fae5bb6814
export ROHAN_ID=f45b7018-e4c0-4be4-aaed-25b7b65cd09f
export SARA_ID=e208de76-cb76-4b2e-a562-318092def28f
export LOC_COIMBATORE=4990b22b-3693-4bb5-8c22-2894d569b4a8
export LOC_BENGALURU=9d87c34d-280d-4161-9616-a7c68fec052e
export LT_EL=4889510e-e6b1-468e-a237-83a2256ed9c9
export COMP_OFF_ID=1eb0cd13-2f49-4c77-9920-5e2f84fe85d9
export BLACKOUT_ID=aebb7e03-bbeb-4653-9156-238b54e0ffcd
export REG_ID=1dd9ede3-676c-44d1-94de-16fb395e7101
export INTERNAL_API_TOKEN=dev-cron-token
```

Endpoints marked **[session]** need a logged-in user (cookie); endpoints marked **[internal]** use
`-H 'X-Internal-Token: dev-cron-token'`. Where a session is required, the runbook shows the exact call and
the verified server-side state instead — same honesty rule as the enterprise authz runbook
([demo-enterprise-authz.md](demo-enterprise-authz.md)).

---

## Chapter 1 — Org structure, Indian style

**The Indian context.** A mid-size Indian company is rarely one flat office. The classic shape is a
registered office or HQ in a metro plus one or more plants in industrial towns — and the two run under
_different_ labour regimes: the factory under the Factories Act lineage, the office under the state's
Shops & Establishments Act. HR structures mirror this: business units per site, departments inside them,
and the **reporting manager** as the atom of all approvals. "Who is your RM?" decides whose queue your
leave lands in — not your job title.

**How Avkash models it.** Business Unit → Department → Team → Employee, with locations carrying a
`laborRegime` field (STANDARD / SEZ / SHOP_ESTABLISHMENT). Teams link to a location and a reporting
manager; every approval flow follows that chain.

**Show it.**

```bash
# [session: Priya] the org tree
curl http://localhost:3001/business-units
curl http://localhost:3001/teams
```

Seeded state (verified): Plants BU → Manufacturing dept → **Assembly** (Coimbatore Plant) and
**Logistics**; Corporate BU → Finance dept (Bengaluru HQ).
_Presenter note:_ point at the Assembly team's `locationId` — every India feature below hangs off this link.

---

## Chapter 2 — Leave: CL, SL, EL

**The Indian context.** Indian leave policy is a three-letter alphabet. **CL (Casual Leave)** — short,
unplanned, use-it-or-lose-it. **SL (Sick Leave)** — illness, often needing a certificate beyond 2–3 days.
**EL (Earned Leave, also called PL/Privilege Leave)** — the only one that behaves like an asset: it
_accrues_ with service (the Factories Act lineage entitles factory workers to leave earned against days
worked), it **carries forward** across years up to a cap, and the balance is **encashable** — at year-end
in some companies, at Full & Final settlement everywhere. The annual carry-forward reckoning happens at
the **Indian financial year boundary, March 31** — not December 31. Maternity leave is a separate paid
statutory entitlement under the Maternity Benefit Act.

**How Avkash models it.** Leave types are org-defined; per-team policies set the numbers: annual caps,
monthly accrual, rollover with limit and expiry date, encashability with a max, and separate probation
rules (a probationer commonly gets capped CL and **no** EL accrual until confirmation).

**Show it.** Seeded policies on the Assembly team (live values):

| Type            | Cap      | Accrues | Carry-forward              | Encashable  | Probation   |
| --------------- | -------- | ------- | -------------------------- | ----------- | ----------- |
| Casual Leave    | 12/yr    | no      | no                         | no          | capped at 6 |
| Sick Leave      | 12/yr    | no      | no                         | no          | —           |
| Earned Leave    | 15/yr    | monthly | up to 30, expiry **03/31** | yes, max 15 | no accrual  |
| Maternity Leave | 182 days | no      | no                         | no          | —           |

```bash
# [session] the policy objects behind the table
curl http://localhost:3001/leave-types
curl "http://localhost:3001/leave-policies?teamId=9829047a-23a6-4e8d-b431-1b516190a60e"
```

_Presenter note:_ the `rollOverExpiry: "03/31"` field is the line to pause on — the system thinks in
Indian financial years, not calendar years.

---

## Chapter 3 — Holidays: one company, two calendars

**The Indian context.** There is no single Indian holiday list. Three national days (Republic Day,
Independence Day, Gandhi Jayanti) are near-universal; everything else is state and culture. A Tamil Nadu
plant closes for **Pongal** in January; the Bengaluru office works that day but closes for **Karnataka
Rajyotsava** on November 1. Festival dates (Holi, Diwali) move with the lunar calendar every year. HR
publishes the calendar per _location_ at the start of the year — and gets it audited by everyone.

**How Avkash models it.** Holidays are org-wide by default; setting a `location` scopes them to one site.
One org, per-site calendars, no duplication of the national list. The `location` field on the Holiday
entity stores the Location UUID — `listHolidays` with `?location=<id>` returns the org-wide set plus
that location's own holidays.

**Show it.** Verified seeded calendar (2026, from live database):

```
Pongal                2026-01-14   4990b22b… (Coimbatore Plant only)
Republic Day          2026-01-26   null      (all locations)
Holi                  2026-03-03   null      (all locations)
Tamil New Year        2026-04-14   4990b22b… (Coimbatore Plant only)
Independence Day      2026-08-15   null      (all locations)
Gandhi Jayanti        2026-10-02   null      (all locations)
Diwali                2026-10-19   null      (all locations)
Karnataka Rajyotsava  2026-11-01   9d87c34d… (Bengaluru HQ only)
```

```bash
# [session] same org, two different answers:
# Coimbatore: 7 holidays (national + Pongal + Tamil New Year)
curl "http://localhost:3001/holidays?location=4990b22b-3693-4bb5-8c22-2894d569b4a8&year=2026" \
  -H "Cookie: <priya-session>"
# Bengaluru: 6 holidays (national + Karnataka Rajyotsava)
curl "http://localhost:3001/holidays?location=9d87c34d-280d-4161-9616-a7c68fec052e&year=2026" \
  -H "Cookie: <priya-session>"
```

_Presenter note:_ run both curls back to back — the differing lists land the point better than any slide.
Bengaluru count: 6. Coimbatore count: 7 (Tamil Nadu has Pongal AND Tamil New Year as plant holidays).

---

## Chapter 4 — Workweek & attendance: alternate Saturdays

**The Indian context.** The five-day week is a metro-office privilege. Indian factories typically run
six days, and the widespread compromise is the **alternate Saturday**: 1st and 3rd Saturdays working, 2nd
and 4th off (or the reverse). Attendance itself is punch-based — the muster roll tradition — and the most
common HR ticket in any Indian plant is the **missed punch**: badge reader offline, forgot to tap out,
went out the cargo gate. The fix is **regularization**: the employee declares the actual in/out times,
the supervisor approves, the record is corrected _with an audit trail_ — never silently edited.

**How Avkash models it.** Workweek patterns are first-class: an N-week repeating cycle assigned per team
(or per employee, with inherit-by-null). Leave day-counting and attendance both consult the pattern — a
2nd-Saturday leave day doesn't burn balance. Regularization requests carry requested in/out times, a
reason, and a PENDING → approve/reject flow.

**Show it.** Verified live: Assembly team (`9829047a…`) runs **”Alternate Saturday (1st/3rd working)”**
(`fb9eced4…`) — a 2-week cycle `[Mon–Sat], [Mon–Fri]` anchored to 2026-01-05; HQ teams run Mon–Fri
(`edb6bd87…`). Sara has a pending regularization for 2026-06-05: _”Badge reader offline at factory gate
— forgot to tap out”_ (`1dd9ede3…`, requested 08:30–17:30 IST).

```bash
# [session: Priya or Rohan] the patterns
curl http://localhost:3001/workweek-patterns -H “Cookie: <rohan-session>”
# Expected: two patterns: “Alternate Saturday (1st/3rd working)” (cycleLength=2) + “Mon–Fri (HQ)” (cycleLength=1)

# [session: Rohan] Rohan's approval queue — Sara's regularization
curl “http://localhost:3001/attendance/regularizations?status=PENDING” -H “Cookie: <rohan-session>”
# Expected: {id:”1dd9ede3…”, date:”2026-06-05”, reason:”Badge reader offline…”, status:”PENDING”}

# [session: Rohan] approve it → writes REGULARIZATION-source punch, writes audit log
curl -s -X POST “http://localhost:3001/attendance/regularizations/1dd9ede3-676c-44d1-94de-16fb395e7101/approve” \
  -H “Cookie: <rohan-session>” \
  -H “Content-Type: application/json” \
  -d '{“note”:”Badge reader outage confirmed on maintenance log”}'
```

_Presenter note:_ open the calendar view for two consecutive Saturdays — one working, one off — that's
the alternate-Saturday engine doing day-math the HR team otherwise does in Excel.

---

## Chapter 5 — Comp-off & encashment

**The Indian context.** When a factory runs a Sunday shift for a dispatch deadline, the operator earns a
**compensatory off** — a day in lieu. Comp-off culture has two iron rules HR enforces: it must be
_approved_ (worked-on date verified by the supervisor), and it **expires** — commonly in 60–90 days —
or it quietly becomes an unfunded liability on the books. Encashment is the other side of the same coin:
unused EL converted to pay, capped, typically at year-end or F&F.

**How Avkash models it.** Comp-off is a credit ledger: a grant references the worked date, lands PENDING,
and on approval becomes usable balance with a policy-driven expiry (`compOffExpiryDays: 90` seeded).
Encashment requests draw against the EL policy's `encashmentMaxDays`.

**Show it.** Verified live: Sara has **1.00 day PENDING** for working Sunday **2026-06-07**
(comp-off ID `1eb0cd13…`). Comp-off leave type is `Compensatory Off` (`f89c7c8d…`, kind=COMP_OFF).

```bash
# [session: Rohan] list pending comp-offs
curl "http://localhost:3001/comp-off" -H "Cookie: <rohan-session>"
# Expected: [{id:"1eb0cd13…", userId:"e208de76…", workedOn:"2026-06-07", days:"1", status:"PENDING"}]

# [session: Rohan] approve → posts COMP_OFF_CREDIT to leave ledger with expiresOn = workedOn + 90d
curl -s -X POST "http://localhost:3001/comp-off/1eb0cd13-2f49-4c77-9920-5e2f84fe85d9/approve" \
  -H "Cookie: <rohan-session>"
# Expected: {status:"APPROVED", expiresOn:"2026-09-05", approvedBy:"f45b7018-…"}
```

_Presenter note:_ the 90-day expiry field is the compliance hook — say "no more comp-offs from 2019 on
anyone's books." After approval, Sara's comp-off balance goes up by 1 in the ledger. She redeems it by
applying a `Compensatory Off` leave type — which posts a LEAVE_TAKEN debit against the COMP_OFF_CREDIT.

---

## Chapter 6 — Blackouts: the quarter-end freeze

**The Indian context.** Indian financial quarters end Jun/Sep/Dec/Mar, and the last week of each is
sacred in plants (dispatch targets) and in finance (closing). Most companies operate an informal "no
leave in the last week of the quarter" rule — informally enforced, inconsistently waived, and the source
of endless grievance. Making the freeze _explicit, scoped, and dated_ is fairer than the unwritten rule.

**How Avkash models it.** A blackout names a date window and optionally scopes to a location and/or a
leave type; applications inside the window are rejected at submission with a clear error, not at the
manager's discretion.

**Show it.** Verified live: **”Q2 FY2027 Quarter-End Freeze”** (`aebb7e03…`), Sep 25–30 2026,
`locationId = 4990b22b…` (Coimbatore Plant only), all leave types (leaveTypeId = null).

```bash
# [session: Rohan] list blackouts for the plant
curl “http://localhost:3001/blackouts?locationId=4990b22b-3693-4bb5-8c22-2894d569b4a8” \
  -H “Cookie: <rohan-session>”
# Expected: [{id:”aebb7e03…”, name:”Q2 FY2027 Quarter-End Freeze”,
#              startDate:”2026-09-25”, endDate:”2026-09-30”, leaveTypeId:null}]

# [session: Sara] apply for leave inside the blackout → 409 LEAVE_BLACKOUT_PERIOD
curl -s -X POST http://localhost:3001/leaves \
  -H “Cookie: <sara-session>” \
  -H “Content-Type: application/json” \
  -d '{“leaveTypeId”:”4889510e-e6b1-468e-a237-83a2256ed9c9”,”startDate”:”2026-09-28”,”endDate”:”2026-09-28”,”reason”:”Personal work”}'
# Expected: {“error”:{“code”:”LEAVE_BLACKOUT_PERIOD”,”details”:{“name”:”Q2 FY2027 Quarter-End Freeze”}}}
```

_Presenter note:_ Bengaluru HQ staff can still take leave that week — the freeze is scoped to the plant,
which is exactly how the informal rule was always meant to work. Switch the same curl to a Bengaluru
user and it succeeds.

---

## Chapter 7 — Approvals follow the org chart

**The Indian context.** Indian approval culture is hierarchical and delegation-heavy: the RM approves,
the RM's manager escalates, and when the RM is on leave someone _acts_ for them — usually via a forwarded
email that no system remembers. Auditors later ask "who approved this and under what authority?" and the
answer lives in an inbox.

**How Avkash models it.** The org chart itself is the authorization policy (OpenFGA relationship graph):
Rohan can approve Sara's leave because he _manages her team_ — not because someone ticked an "approver"
checkbox. Delegation is a first-class, time-bounded grant that expires by itself.

**Show it.** This is the enterprise authz demo, beats 1–2 — run them from
[demo-enterprise-authz.md](demo-enterprise-authz.md): Rohan approves Sara's leave (200), Dev gets
403 `FORBIDDEN_RELATION`, then one delegation call lets Dev act for exactly the dates of Rohan's
vacation.
_Presenter note:_ `pnpm demo:smoke --beat 1` and `--beat 2` run these as scripted assertions.

---

## Chapter 8 — DPDP & data dignity: Aadhaar, PAN, salary

**The Indian context.** The **Digital Personal Data Protection Act, 2023** changed the default for
Indian HR data: Aadhaar, PAN, bank details, and health information are no longer "HR records everyone in
HR can see" — access needs purpose, and access needs a trail. Salary secrecy is also cultural: in most
Indian companies compensation visibility _is_ the org chart's most sensitive edge. The practical HR
question is no longer "is the data stored safely" but "**who saw it, and why were they allowed to?**"

**How Avkash models it.** Field groups: every employee field belongs to a sensitivity class
(`basic / contact / employment / compensation / identity / medical`). A per-org policy matrix decides
which _relationship_ sees which class — and the API **omits** what you may not see (it doesn't mask it,
it isn't on the wire at all). Reads of `identity`/`medical` write an audit row. The `?sort=salary`
side-channel is closed too. And for the auditor's "why does Priya see salaries?" there is a live answer:
the explain endpoint returns the actual grant path through the org graph.

**Show it.** Run beats 4, 5, 7 from [demo-enterprise-authz.md](demo-enterprise-authz.md). The verified
explain output for "who can view Sara's profile":

```
(via employee:…#subject)                                   — Sara herself
(via employee:…#team → team:…#approver)                    — her reporting chain
(via employee:…#team → team:…#hr_admin)                    — org HR admin
(via employee:…#team → team:…#hrbp)                        — the Plants HRBP
```

_Presenter note:_ that four-line answer is what you hand a DPDP auditor instead of a meeting.

---

## Chapter 9 — The honest failure story

Every HRMS demo shows the happy path. Ask the vendor what happens when the authorization service is
_down_. Avkash's answer, executed live in this stack: requests are **denied with a clean 503**
(`AUTHZ_UNAVAILABLE`) — never silently allowed — readiness reporting flips, and a nightly reconciler
repairs any drift between the HR database and the authorization graph (last live run: `repairs=0,
expected=31` — in sync). Run it: [demo-enterprise-authz.md](demo-enterprise-authz.md) beat 8.

---

## Glossary

| Term              | Meaning                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| CL / SL / EL (PL) | Casual / Sick / Earned (Privilege) Leave — the standard Indian leave triad             |
| Comp-off          | Compensatory off — a day in lieu of working a weekly off or holiday; expires if unused |
| Sandwich rule     | Counting weekends/holidays _between_ leave days as leave — policy-dependent            |
| Muster roll       | The statutory attendance register tradition behind punch-based attendance              |
| Regularization    | Supervisor-approved correction of a missed/wrong attendance punch, with audit trail    |
| RM                | Reporting Manager — the approval atom of Indian org culture                            |
| F&F               | Full & Final settlement — where EL encashment and recoveries reconcile at exit         |
| FY                | Indian financial year, April–March; leave carry-forward reckons at March 31            |
| DPDP Act          | Digital Personal Data Protection Act, 2023 — India's personal-data law                 |

## What we did NOT show (honesty section)

- **Payroll, PF / ESI / PT / TDS** — not built; payroll is a planned commercial module.
  Statutory filings are an integration story, not a tick-box claim.
- **Maternity leave week-semantics** — modeled as a 182-day cap (26 weeks × 7); the policy schema has no
  weeks-based field yet.
- **Sandwich-rule toggle** — day-counting consults workweek + holidays; an explicit per-policy sandwich
  on/off switch is not yet a field.
- **Statutory numbers** — this document deliberately avoids quoting thresholds and amounts (they change);
  it names the Acts and shows the _mechanisms_.
