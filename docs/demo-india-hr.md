# Avkash for Indian HR — an educational demo

**Audience:** Indian HR managers, HRBPs, and plant HR officers evaluating an HRMS.
**Format:** every chapter first explains *how Indian companies actually run this HR practice*, then shows
the practice live in Avkash. You should learn (or recognize) something about your own field in each
chapter — the product demo is the proof, not the pitch.

**Setup** (one time): `docker compose up -d` → `pnpm db:push` → `pnpm demo:seed` → `pnpm demo:seed:india`.
The org is **Meridian Manufacturing**: a Coimbatore factory (Plants BU) and a Bengaluru HQ (Corporate BU).
Personas: Priya (HR admin, Bengaluru) · Rohan (shift manager, Assembly line) · Sara (operator, Assembly) ·
Dev (manager, Logistics) · Anita (HRBP for the Plants BU).

Endpoints marked **[session]** need a logged-in user (cookie); endpoints marked **[internal]** use
`-H 'X-Internal-Token: dev-cron-token'`. Where a session is required, the runbook shows the exact call and
the verified server-side state instead — same honesty rule as the enterprise authz runbook
([demo-enterprise-authz.md](demo-enterprise-authz.md)).

---

## Chapter 1 — Org structure, Indian style

**The Indian context.** A mid-size Indian company is rarely one flat office. The classic shape is a
registered office or HQ in a metro plus one or more plants in industrial towns — and the two run under
*different* labour regimes: the factory under the Factories Act lineage, the office under the state's
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
*Presenter note:* point at the Assembly team's `locationId` — every India feature below hangs off this link.

---

## Chapter 2 — Leave: CL, SL, EL

**The Indian context.** Indian leave policy is a three-letter alphabet. **CL (Casual Leave)** — short,
unplanned, use-it-or-lose-it. **SL (Sick Leave)** — illness, often needing a certificate beyond 2–3 days.
**EL (Earned Leave, also called PL/Privilege Leave)** — the only one that behaves like an asset: it
*accrues* with service (the Factories Act lineage entitles factory workers to leave earned against days
worked), it **carries forward** across years up to a cap, and the balance is **encashable** — at year-end
in some companies, at Full & Final settlement everywhere. The annual carry-forward reckoning happens at
the **Indian financial year boundary, March 31** — not December 31. Maternity leave is a separate paid
statutory entitlement under the Maternity Benefit Act.

**How Avkash models it.** Leave types are org-defined; per-team policies set the numbers: annual caps,
monthly accrual, rollover with limit and expiry date, encashability with a max, and separate probation
rules (a probationer commonly gets capped CL and **no** EL accrual until confirmation).

**Show it.** Seeded policies on the Assembly team (live values):

| Type | Cap | Accrues | Carry-forward | Encashable | Probation |
| --- | --- | --- | --- | --- | --- |
| Casual Leave | 12/yr | no | no | no | capped at 6 |
| Sick Leave | 12/yr | no | no | no | — |
| Earned Leave | 15/yr | monthly | up to 30, expiry **03/31** | yes, max 15 | no accrual |
| Maternity Leave | 182 days | no | no | no | — |

```bash
# [session] the policy objects behind the table
curl http://localhost:3001/leave-types
curl "http://localhost:3001/leave-policies?teamId=9829047a-23a6-4e8d-b431-1b516190a60e"
```
*Presenter note:* the `rollOverExpiry: "03/31"` field is the line to pause on — the system thinks in
Indian financial years, not calendar years.

---

## Chapter 3 — Holidays: one company, two calendars

**The Indian context.** There is no single Indian holiday list. Three national days (Republic Day,
Independence Day, Gandhi Jayanti) are near-universal; everything else is state and culture. A Tamil Nadu
plant closes for **Pongal** in January; the Bengaluru office works that day but closes for **Karnataka
Rajyotsava** on November 1. Festival dates (Holi, Diwali) move with the lunar calendar every year. HR
publishes the calendar per *location* at the start of the year — and gets it audited by everyone.

**How Avkash models it.** Holidays are org-wide by default; setting a `location` scopes them to one site.
One org, per-site calendars, no duplication of the national list.

**Show it.** Verified seeded calendar (2026):

```
Pongal                2026-01-14   Coimbatore Plant only
Republic Day          2026-01-26   all locations
Holi                  2026-03-03   all locations
Tamil New Year        2026-04-14   Coimbatore Plant only
Independence Day      2026-08-15   all locations
Gandhi Jayanti        2026-10-02   all locations
Diwali                2026-10-19   all locations
Karnataka Rajyotsava  2026-11-01   Bengaluru HQ only
```
```bash
# [session] same org, two different answers:
curl "http://localhost:3001/holidays?location=<coimbatore-location-id>"
curl "http://localhost:3001/holidays?location=<bengaluru-location-id>"
```
*Presenter note:* run both curls back to back — the differing lists land the point better than any slide.

---

## Chapter 4 — Workweek & attendance: alternate Saturdays

**The Indian context.** The five-day week is a metro-office privilege. Indian factories typically run
six days, and the widespread compromise is the **alternate Saturday**: 1st and 3rd Saturdays working, 2nd
and 4th off (or the reverse). Attendance itself is punch-based — the muster roll tradition — and the most
common HR ticket in any Indian plant is the **missed punch**: badge reader offline, forgot to tap out,
went out the cargo gate. The fix is **regularization**: the employee declares the actual in/out times,
the supervisor approves, the record is corrected *with an audit trail* — never silently edited.

**How Avkash models it.** Workweek patterns are first-class: an N-week repeating cycle assigned per team
(or per employee, with inherit-by-null). Leave day-counting and attendance both consult the pattern — a
2nd-Saturday leave day doesn't burn balance. Regularization requests carry requested in/out times, a
reason, and a PENDING → approve/reject flow.

**Show it.** Verified live: Assembly team runs **“Alternate Saturday (1st/3rd working)”** — a 2-week
cycle `[Mon–Sat], [Mon–Fri]` anchored to 2026-01-05; HQ teams run Mon–Fri. And Sara has a pending
regularization for 2026-06-05: *“Badge reader offline at factory gate — forgot to tap out”* (requested
8:30am–5:30pm IST).
```bash
# [session] the patterns and the pending request
curl http://localhost:3001/workweek-patterns
curl "http://localhost:3001/attendance/regularizations?status=PENDING"   # Rohan's approval queue
```
*Presenter note:* open the calendar view for two consecutive Saturdays — one working, one off — that's
the alternate-Saturday engine doing day-math the HR team otherwise does in Excel.

---

## Chapter 5 — Comp-off & encashment

**The Indian context.** When a factory runs a Sunday shift for a dispatch deadline, the operator earns a
**compensatory off** — a day in lieu. Comp-off culture has two iron rules HR enforces: it must be
*approved* (worked-on date verified by the supervisor), and it **expires** — commonly in 60–90 days —
or it quietly becomes an unfunded liability on the books. Encashment is the other side of the same coin:
unused EL converted to pay, capped, typically at year-end or F&F.

**How Avkash models it.** Comp-off is a credit ledger: a grant references the worked date, lands PENDING,
and on approval becomes usable balance with a policy-driven expiry (`compOffExpiryDays: 90` seeded).
Encashment requests draw against the EL policy's `encashmentMaxDays`.

**Show it.** Verified live: Sara has **1.00 day PENDING** for working Sunday **2026-06-07**.
```bash
# [session: Rohan] the pending grant, then approve it
curl http://localhost:3001/comp-off
curl -X POST http://localhost:3001/comp-off/<id>/approve -H 'If-Match: "<version>"'
```
*Presenter note:* the 90-day expiry field is the compliance hook — say "no more comp-offs from 2019 on
anyone's books."

---

## Chapter 6 — Blackouts: the quarter-end freeze

**The Indian context.** Indian financial quarters end Jun/Sep/Dec/Mar, and the last week of each is
sacred in plants (dispatch targets) and in finance (closing). Most companies operate an informal "no
leave in the last week of the quarter" rule — informally enforced, inconsistently waived, and the source
of endless grievance. Making the freeze *explicit, scoped, and dated* is fairer than the unwritten rule.

**How Avkash models it.** A blackout names a date window and optionally scopes to a location and/or a
leave type; applications inside the window are rejected at submission with a clear error, not at the
manager's discretion.

**Show it.** Verified live: **“Q2 FY2027 Quarter-End Freeze”**, Sep 25–30 2026, Coimbatore Plant only,
all leave types.
```bash
# [session] list, then watch an application bounce
curl http://localhost:3001/blackouts
# Sara applies for Sep 28 → 422 with the blackout's name in the error envelope
```
*Presenter note:* Bengaluru HQ staff can still take leave that week — the freeze is scoped to the plant,
which is exactly how the informal rule was always meant to work.

---

## Chapter 7 — Approvals follow the org chart

**The Indian context.** Indian approval culture is hierarchical and delegation-heavy: the RM approves,
the RM's manager escalates, and when the RM is on leave someone *acts* for them — usually via a forwarded
email that no system remembers. Auditors later ask "who approved this and under what authority?" and the
answer lives in an inbox.

**How Avkash models it.** The org chart itself is the authorization policy (OpenFGA relationship graph):
Rohan can approve Sara's leave because he *manages her team* — not because someone ticked an "approver"
checkbox. Delegation is a first-class, time-bounded grant that expires by itself.

**Show it.** This is the enterprise authz demo, beats 1–2 — run them from
[demo-enterprise-authz.md](demo-enterprise-authz.md): Rohan approves Sara's leave (200), Dev gets
403 `FORBIDDEN_RELATION`, then one delegation call lets Dev act for exactly the dates of Rohan's
vacation.
*Presenter note:* `pnpm demo:smoke --beat 1` and `--beat 2` run these as scripted assertions.

---

## Chapter 8 — DPDP & data dignity: Aadhaar, PAN, salary

**The Indian context.** The **Digital Personal Data Protection Act, 2023** changed the default for
Indian HR data: Aadhaar, PAN, bank details, and health information are no longer "HR records everyone in
HR can see" — access needs purpose, and access needs a trail. Salary secrecy is also cultural: in most
Indian companies compensation visibility *is* the org chart's most sensitive edge. The practical HR
question is no longer "is the data stored safely" but "**who saw it, and why were they allowed to?**"

**How Avkash models it.** Field groups: every employee field belongs to a sensitivity class
(`basic / contact / employment / compensation / identity / medical`). A per-org policy matrix decides
which *relationship* sees which class — and the API **omits** what you may not see (it doesn't mask it,
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
*Presenter note:* that four-line answer is what you hand a DPDP auditor instead of a meeting.

---

## Chapter 9 — The honest failure story

Every HRMS demo shows the happy path. Ask the vendor what happens when the authorization service is
*down*. Avkash's answer, executed live in this stack: requests are **denied with a clean 503**
(`AUTHZ_UNAVAILABLE`) — never silently allowed — readiness reporting flips, and a nightly reconciler
repairs any drift between the HR database and the authorization graph (last live run: `repairs=0,
expected=31` — in sync). Run it: [demo-enterprise-authz.md](demo-enterprise-authz.md) beat 8.

---

## Glossary

| Term | Meaning |
| --- | --- |
| CL / SL / EL (PL) | Casual / Sick / Earned (Privilege) Leave — the standard Indian leave triad |
| Comp-off | Compensatory off — a day in lieu of working a weekly off or holiday; expires if unused |
| Sandwich rule | Counting weekends/holidays *between* leave days as leave — policy-dependent |
| Muster roll | The statutory attendance register tradition behind punch-based attendance |
| Regularization | Supervisor-approved correction of a missed/wrong attendance punch, with audit trail |
| RM | Reporting Manager — the approval atom of Indian org culture |
| F&F | Full & Final settlement — where EL encashment and recoveries reconcile at exit |
| FY | Indian financial year, April–March; leave carry-forward reckons at March 31 |
| DPDP Act | Digital Personal Data Protection Act, 2023 — India's personal-data law |

## What we did NOT show (honesty section)

- **Payroll, PF / ESI / PT / TDS** — not built; payroll is a planned commercial module (Plan 49/50).
  Statutory filings are an integration story, not a tick-box claim.
- **Maternity leave week-semantics** — modeled as a 182-day cap (26 weeks × 7); the policy schema has no
  weeks-based field yet.
- **Sandwich-rule toggle** — day-counting consults workweek + holidays; an explicit per-policy sandwich
  on/off switch is not yet a field.
- **Statutory numbers** — this document deliberately avoids quoting thresholds and amounts (they change);
  it names the Acts and shows the *mechanisms*.
