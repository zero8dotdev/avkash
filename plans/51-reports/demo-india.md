# Demo report — India HR educational demo

Status: **complete, live-verified**. Note on authorship: two agent attempts died on API connection
errors; the second wrote the full seed script (`scripts/seed-india.ts`) before dying. The orchestrator
completed the work: installed root deps, ran the seed live (twice — idempotency proven), verified the
data, and wrote `docs/demo-india-hr.md` + this report.

## Files

- `scripts/seed-india.ts` — idempotent enrichment of the Meridian org (`pnpm demo:seed:india`)
- `docs/demo-india-hr.md` — 9-chapter educational runbook + glossary + honesty section
- root `package.json` — `demo:seed:india` script, `@avkash/attendance` + `@avkash/holidays` root deps

## Seeded vs skipped

| Item | Status | Notes |
| --- | --- | --- |
| Locations: Coimbatore Plant, Bengaluru HQ | ✅ seeded | via `createLocation` (`@avkash/org`); Assembly team linked to Coimbatore |
| Leave types CL / SL / EL / ML / Comp-off | ✅ seeded | `createLeaveType`; Comp-off uses `kind: COMP_OFF` (required by `earnCompOff`) |
| Policies (Assembly): CL 12, SL 12, EL 15 accrued+rollover(30, 03/31)+encashable(15), ML 182d, CompOff 90d expiry | ✅ seeded | probation rules set on CL (cap 6) and EL (no accrual) |
| Holidays 2026: 5 org-wide + Pongal/Tamil New Year (Coimbatore) + Rajyotsava (Bengaluru) | ✅ seeded | `Holiday.location` is a varchar, not an FK — Location UUID stored as the string (documented in seed header) |
| Workweek: Alternate Saturday (2-week cycle) on Assembly; Mon–Fri pattern for HQ | ✅ seeded | `createWorkweekPattern` (`@avkash/attendance`); team assignment via direct update (no domain setter exists) |
| Comp-off: Sara worked Sun 2026-06-07 → PENDING | ✅ seeded | granted by Rohan (manager ctx) via `earnCompOff` |
| Blackout: Q2 FY2027 Sep 25–30, Coimbatore only | ✅ seeded | `createBlackout`, `leaveTypeId: null` = all types |
| Regularization: Sara missed punch-out 2026-06-05 → PENDING | ✅ seeded | direct insert — `requestRegularization` is self-only (reads ctx.userId); seeding on behalf required bypass (documented in seed) |
| ML 26-week semantics | ⚠️ proxy | no weeks-based column on LeavePolicy; `maxLeaves: 182` (26×7) used |
| Sandwich-rule toggle | ❌ skipped | no per-policy field exists; noted in runbook honesty section |
| Sunday attendance punch backing the comp-off | ❌ skipped | punch ingestion needs a registered device; comp-off grant carries the workedOn date instead |

## Live verification evidence (2026-06-10, this stack)

- Idempotency: third run produced **25 "existing" hits, zero new rows**; IDs stable across runs
- Holidays query: 8 rows — 5 `(all)`, 2 scoped to Coimbatore location id, 1 to Bengaluru location id
- Policy join (Assembly): CL 12 / SL 12 / EL 15 `accruals=t rollOver=t encashable=t` / ML 182 / CompOff `compOffExpiryDays=90`
- CompOff: `status=PENDING, workedOn=2026-06-07, days=1.00` for Sara
- Team join: `Assembly | Alternate Saturday (1st/3rd working)`

## Caveats

- Statutory claims in the runbook are deliberately qualitative (acts named, no thresholds/amounts).
- Chapter "Show it" curls marked **[session]** need a logged-in user; server-side state shown in the doc
  was verified via SQL against the live stack instead — same honesty convention as the Meridian runbook.
- The seed enriches the Meridian org; `pnpm demo:seed` must run first (the script enforces this).
