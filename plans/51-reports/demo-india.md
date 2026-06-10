# Demo report — India HR educational demo

Status: **complete, live-verified**. Seed runs idempotently; all items except noted below verified
against the live Postgres + API stack (2026-06-10, plan51/integration branch).

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

## Live verification evidence (2026-06-10, plan51/integration)

Stable seeded IDs (all UUID idempotent across runs):
```
loc:Coimbatore   4990b22b-3693-4bb5-8c22-2894d569b4a8
loc:Bengaluru    9d87c34d-280d-4161-9616-a7c68fec052e
lt:CL            c9fcb140-5506-4535-bc82-4c92150e7ed7
lt:SL            ba802a41-42ba-4632-8f97-4c0fc7197b15
lt:EL            4889510e-e6b1-468e-a237-83a2256ed9c9
lt:ML            16cba39a-10e1-411c-82ec-9c02febb58e2
lt:CompOff       f89c7c8d-fe55-4d19-a2b5-03d2328bc9e3
pat:AltSat       fb9eced4-ec7f-4865-a7f0-5ddad765c8f2  (Assembly team workweekPatternId)
pat:MonFri       edb6bd87-a734-4e5b-ab67-215523d7271c
compOff:Sara     1eb0cd13-2f49-4c77-9920-5e2f84fe85d9  (status=PENDING)
blackout:Q2      aebb7e03-bbeb-4653-9156-238b54e0ffcd  (Sep 25–30 2026, Coimbatore only)
reg:Sara         1dd9ede3-676c-44d1-94de-16fb395e7101  (status=PENDING)
```

Live query results:
- Idempotency: second run produced **25 "existing" hits, zero new rows**; IDs stable
- `Holiday` table: 8 rows total — 5 null location (org-wide), 2 location=Coimbatore, 1 location=Bengaluru
- `LeavePolicy` for Assembly: CL(12/yr,no accrual), SL(12/yr), EL(15/yr,accruals=t,rollOver=t,rollOverLimit=30,rollOverExpiry=03/31,encashable=t,encashmentMaxDays=15,probationAccruals=f,probationMaxLeaves=0), ML(182d proxy), CompOff(compOffExpiryDays=90)
- `CompOff`: Sara `status=PENDING, workedOn=2026-06-07, days=1.00`
- `Team` JOIN `WorkweekPattern`: Assembly → "Alternate Saturday (1st/3rd working)", cycleLength=2, weeks=[Mon-Sat],[Mon-Fri]
- `LeaveBlackout`: name="Q2 FY2027 Quarter-End Freeze", startDate=2026-09-25, endDate=2026-09-30, locationId=Coimbatore
- `AttendanceRegularization`: Sara date=2026-06-05, requestedIn/Out set, status=PENDING
- `pnpm typecheck`: 24/24 tasks successful (cache hit), 0 errors
- `pnpm lint`: 24/24 tasks successful, 0 errors

## Caveats

- Statutory claims in the runbook are deliberately qualitative (acts named, no thresholds/amounts).
- Chapter "Show it" curls marked **[session]** need a logged-in user; server-side state shown in the doc
  was verified via SQL against the live stack instead — same honesty convention as the Meridian runbook.
- The seed enriches the Meridian org; `pnpm demo:seed` must run first (the script enforces this).
