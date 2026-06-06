# Plan 16 — Holidays

Status: design. Goal: a complete holiday system — country-suggested + custom + recurring —
that the working-day engine can trust.

## 1. The UX we're building toward

Onboarding "Locations" step (and later, org settings):

1. Org picks a **country** it operates in (a "location").
2. We **suggest** that country's public holidays for the year.
3. HR **checks the ones they observe** (companies don't take every public holiday).
4. HR can **add custom** holidays (founder's day, extra company-off).
5. Holidays may be **recurring** (every year) or **one-off**.
6. A multi-country org repeats this per location; an employee's working days use **their** location's set.

## 2. What v2 already has (don't rebuild)

- **Schema** — `Holiday` (org-specific: name, date, `location`, `isRecurring`, `isCustom`, orgId)
  and `PublicHolidays` (global catalog: country, iso, year, date, name, type). Both exist.
- **Org `location` array** on the organisation (the countries it operates in).
- **Working-day matching** — `working-days.ts` already excludes holidays, matching **recurring by
  month+day** and one-offs by exact date. The core calc is done.

So the gap is everything _around_ the table: no domain functions, no routes, no catalog data, no
onboarding flow — and two correctness issues below.

## 3. How the OLD app did it (and why it's incomplete)

- Hardcoded **5 countries** (IN/DE/GB/US/NL) in the UI.
- `fetchPublicHolidays(iso)` read `PublicHolidays WHERE iso = ? AND year = currentYear` — a **static
  seed**, only the current year.
- `updateHolidaysList` deleted the org's holidays for that location and re-inserted the chosen set.
- Recurring expanded by month+day across the range.

Two things make this incomplete for a real product:

- **The catalog goes stale.** A static seed filtered to `year = currentYear` is wrong next January,
  and only covered 5 countries.
- **🐛 Movable holidays break the recurring model.** Christmas (Dec 25) and Independence Day
  (Aug 15) are _fixed_ — month+day recurrence is correct. But **Easter, Good Friday, Diwali, Eid,
  Thanksgiving (4th Thu), UK bank holidays** move every year. Storing Diwali `2024-11-01` with
  `isRecurring=true` wrongly marks **Nov 1 every year**. The current model silently corrupts
  working-day counts for any movable holiday flagged recurring.

## 4. Design decisions

### 4.1 Catalog source → the `date-holidays` library (recommended)

Replace the static seed with the **`date-holidays`** npm package:

- Computes holidays for **~200 countries**, any **year**, including **movable feasts** and
  **regional/state** holidays (German Bundesland, US states, Indian states).
- **Offline** — no API key, no rate limit, no request-time external dependency.
- Tells us each holiday's **type/rule**, so we know fixed vs movable.

Suggestions are then **computed on demand** for `(country, year[, region])` — always current, no seed
job, no staleness. **`PublicHolidays` becomes redundant** (drop it, or keep as an optional cache).

_Alternatives considered:_ Nager.Date (free API, external dep + rate limits); Calendarific (paid).
The library wins for an offline, all-country, movable-aware source.

### 4.2 Fixed vs movable recurrence → the model fix

Stop overloading one `isRecurring` boolean. A chosen holiday is one of:

- **FIXED** — recurs on the same month+day forever (Christmas, Aug 15). Store once, match by
  month+day. `isRecurring = true`.
- **OBSERVED** — a specific date for a specific year (every movable holiday). `isRecurring = false`,
  stored per year, re-materialized annually from the library.

When saving suggestions, the library's type drives the flag: fixed → recurring row; movable → a
per-year `OBSERVED` row. This keeps the existing month+day match correct (fixed only) and never
mis-marks a movable date.

### 4.3 Keeping movable holidays fresh → a year-end job

Because movable holidays are per-year, next year's dates must appear. Reuse the **`/internal` cron
infra** (already built, token-guarded): a `materializeHolidays(year)` job that, for each org +
location, asks the library for that year's movable holidays the org observes and inserts the rows.
Idempotent (skip existing). Runs each December for the upcoming year.

_(Alternative: compute working-day holidays fully on demand from the library each request and store
only the org's *selection*. Cleaner staleness story, but a bigger change to working-days and custom
holidays. Materialize-+-cron reuses what exists; recommended for v1.)_

### 4.4 Multi-location resolution → working-days must filter by location 🐛

Today `working-days.ts` loads **all** org holidays regardless of location — so a German employee
would get India's holidays. Fix: resolve holidays by the **target user's location** (user/team
location → fall back to org default), and by **year**. Needs a per-user or per-team `location`
(org has `location[]`; pick where an individual's location lives — see open questions).

## 5. API surface

| Method | Route                                                  | Purpose                                                       |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------- |
| GET    | `/holidays/suggestions?country=IN&year=2026[&region=]` | compute suggestions (library)                                 |
| GET    | `/holidays?year=2026[&location=IN]`                    | org's saved holidays                                          |
| POST   | `/holidays/import`                                     | bulk-save chosen suggestions `{ location, year, holidays[] }` |
| POST   | `/holidays`                                            | add one custom holiday                                        |
| PATCH  | `/holidays/:id`                                        | edit a custom holiday                                         |
| DELETE | `/holidays/:id`                                        | remove a holiday                                              |
| GET    | `/countries`                                           | supported countries (from library; replaces hardcoded 5)      |

Authz: writes = ADMIN/OWNER (HR); reads = any member. Validation via `validateBody`/`validateQuery`;
responses via a `holidayDto`. Bulk import is a natural **idempotency-key** candidate.

## 6. Missing pieces — build sequence

1. Add `date-holidays`; a thin `@avkash/holidays` (or `holidays.ts` in a domain pkg) wrapping
   `suggest(country, year, region)` and `supportedCountries()`.
2. Holiday domain fns: `listHolidays`, `importHolidays` (bulk, fixed/movable split),
   `addCustomHoliday`, `updateHoliday`, `deleteHoliday`.
3. Routes + `holidayDto` + validation.
4. **Fix working-days**: filter holidays by location + year; keep month+day match for FIXED only.
5. `materializeHolidays(year)` job on `/internal` + the year-end trigger.
6. Org locations management (add/remove countries).
7. Web onboarding "Locations" step (after web app exists) — API is ready before the UI.
8. Drop/repurpose `PublicHolidays` (now redundant).

## 7. Open decisions (need your call)

1. **Catalog source** — `date-holidays` library (recommended) vs keep a seeded `PublicHolidays`?
2. **Materialize-per-year + cron** (recommended, reuses infra) vs **compute-on-demand**?
3. **An individual's location** — does it live on `user`, on `team`, or inherit org default? This
   decides how working-days picks a holiday set for a person.
4. **Regional/sub-country holidays** (US states, German Bundesländer, Indian states) — support now or
   country-level only for v1? (Library supports it.)
