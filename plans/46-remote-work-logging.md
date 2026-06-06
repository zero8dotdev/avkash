# Plan 46 — Remote work location logging

Status: **implementation plan**. Extends the WFH boolean on punches to a structured remote context,
so top management and field sales executives can specify where they are working from (which factory,
client site, or home) when punching via the web app.

Referenced by: [Plan 27 master](27-manufacturing-org-master.md). Independent of other plans.

---

## The gap

`AttendancePunch.wfh: boolean` is binary — present or working from home. For top management visiting
different factories, or field sales at client sites globally, the raw `wfh = true` gives HR no
visibility into where leadership actually was on a given day.

This matters for:
- Factory visit logs (did the plant head visit Factory 3 this month?)
- Client visit records for field sales
- Travel expense corroboration
- Compliance (top management presence requirements per factory)

---

## Design: `remoteContext` jsonb on punch

Storing a structured blob on the punch keeps the schema change minimal (one nullable jsonb column)
while allowing the context to evolve without further migrations.

```ts
type RemoteContext =
  | { type: 'WFH' }                                    // home, no further detail
  | { type: 'FACTORY_VISIT'; locationId: string }      // visiting one of the org's factories
  | { type: 'CLIENT_SITE'; clientName: string; city?: string; country?: string }
  | { type: 'FIELD'; city?: string; country?: string } // field sales in the territory
```

`wfh` on the punch is **kept** (not replaced) for backwards compat, and is automatically set to
`true` whenever `remoteContext` is present (they are consistent by definition).

---

## Schema

`packages/db/src/schema/attendance.ts` — add to `attendancePunch`:

```
remoteContext   jsonb?   default null
```

`wfh` remains. When `remoteContext` is set, `wfh` is forced to `true` in `ingestPunch`. When
`remoteContext` is absent but `wfh = true` (old punches, Slack punches), the punch is treated as
`{ type: 'WFH' }` for display purposes — no data loss.

---

## Zod schema for `remoteContext`

`packages/attendance/src/schemas.ts` — a discriminated union schema:

```ts
const remoteContextSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('WFH') }),
  z.object({ type: z.literal('FACTORY_VISIT'), locationId: z.string().uuid() }),
  z.object({ type: z.literal('CLIENT_SITE'), clientName: z.string(), city: z.string().optional(), country: z.string().optional() }),
  z.object({ type: z.literal('FIELD'), city: z.string().optional(), country: z.string().optional() }),
])
```

Validated in `ingestPunch` input. For `FACTORY_VISIT`, `locationId` must belong to the org
(checked against the `location` table).

---

## `ingestPunch` change

```
if input.remoteContext is set:
  validate with remoteContextSchema
  if type === 'FACTORY_VISIT': verify locationId belongs to orgId
  punch.remoteContext = input.remoteContext
  punch.wfh = true           ← force consistent
```

---

## Where `remoteContext` is visible

| Surface | Change |
|---------|--------|
| `GET /attendance/me` daily summary | `punch.remoteContext` in raw punch list |
| `DayAttendance` type | Add `remoteContext?: RemoteContext` (from the IN punch of the day) |
| Muster report | Add `remoteContext` column alongside `wfh`; show "Factory 2 visit" instead of "WFH" |
| `GET /reports/management-presence` (new, optional) | Per management user: factory visit frequency over a date range |

The management presence report is a stretch goal for the initial build — the data is captured; the
report can follow.

---

## API surface

`POST /attendance/punch` — input schema gains optional `remoteContext` field (validated by the Zod
union above). No new routes needed.

`GET /attendance/:userId` — punch list in the response includes `remoteContext` in each punch DTO.

---

## DTO

`attendancePunchDto` gains `remoteContext: RemoteContext | null`.

`DayAttendance` gains `remoteContext?: RemoteContext` — populated from the first `ENTRY_EXIT` IN
punch of the day when `remoteContext` is set.

---

## Tests

- `ingestPunch` with `remoteContext: { type: 'FACTORY_VISIT', locationId: validId }` → persists
  `remoteContext`, sets `wfh = true`.
- `ingestPunch` with `remoteContext: { type: 'FACTORY_VISIT', locationId: wrongOrgId }` →
  `NotFoundError`.
- `ingestPunch` with `remoteContext: { type: 'CLIENT_SITE', clientName: 'ACME' }` → persists.
- `ingestPunch` without `remoteContext`, `wfh: true` → `remoteContext = null`, `wfh = true`
  (old behaviour unchanged).
- `DayAttendance` for a day with `FACTORY_VISIT` punch → `remoteContext` populated in response.

---

## Build order

1. Add `remoteContext jsonb?` to `attendancePunch`. `db:push`.
2. Zod `remoteContextSchema`. Tests.
3. Extend `ingestPunch` validation + wfh auto-set.
4. Extend punch DTO + `DayAttendance` type.
5. Tests.
