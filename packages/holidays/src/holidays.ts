import { and, eq, or, gte, lt, isNull } from 'drizzle-orm';
import { db, schema, type Holiday } from '@avkash/db';
import { type AuthContext, NotFoundError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { suggestHolidays } from './source';

const toDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const yearStart = (year: number) => new Date(`${year}-01-01T00:00:00Z`);
const nextYearStart = (year: number) => new Date(`${year + 1}-01-01T00:00:00Z`);

// Recurring (fixed) holidays apply to every year; observed (movable) holidays only to
// the year they're stored for. This predicate selects "the set in effect for `year`".
const inYear = (year: number) =>
  or(
    eq(schema.holiday.isRecurring, true),
    and(gte(schema.holiday.date, yearStart(year)), lt(schema.holiday.date, nextYearStart(year)))
  );

export interface ImportHolidaysInput {
  location: string; // country code
  year: number;
  holidays: { name: string; date: string; fixed: boolean }[];
}

// Bulk-save the public holidays an org observes for a (location, year). Replaces that
// location's non-custom set in effect for the year (fixed ones + this year's movable);
// custom holidays are never touched. fixed → recurring row; movable → per-year row.
export async function importHolidays(ctx: AuthContext, input: ImportHolidaysInput): Promise<Holiday[]> {
  requireRole(ctx, 'ADMIN');
  await db
    .delete(schema.holiday)
    .where(
      and(
        eq(schema.holiday.orgId, ctx.orgId),
        eq(schema.holiday.location, input.location),
        eq(schema.holiday.isCustom, false),
        inYear(input.year)
      )
    );
  if (!input.holidays.length) return [];
  const rows = input.holidays.map((h) => ({
    name: h.name,
    date: toDate(h.date),
    location: input.location,
    isRecurring: h.fixed,
    isCustom: false,
    orgId: ctx.orgId,
    createdBy: ctx.userId,
  }));
  return db.insert(schema.holiday).values(rows).returning();
}

export async function listHolidays(ctx: AuthContext, opts?: { location?: string; year?: number }): Promise<Holiday[]> {
  const conds = [eq(schema.holiday.orgId, ctx.orgId)];
  if (opts?.location) conds.push(eq(schema.holiday.location, opts.location));
  if (opts?.year) conds.push(inYear(opts.year)!);
  return db
    .select()
    .from(schema.holiday)
    .where(and(...conds))
    .orderBy(schema.holiday.date);
}

export interface AddHolidayInput {
  name: string;
  date: string; // YYYY-MM-DD
  location?: string;
  isRecurring?: boolean;
}

export async function addCustomHoliday(ctx: AuthContext, input: AddHolidayInput): Promise<Holiday> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.holiday)
    .values({
      name: input.name,
      date: toDate(input.date),
      location: input.location ?? null,
      isRecurring: input.isRecurring ?? true,
      isCustom: true,
      orgId: ctx.orgId,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function updateHoliday(
  ctx: AuthContext,
  holidayId: string,
  patch: { name?: string; date?: string; isRecurring?: boolean }
): Promise<Holiday> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.holiday)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.date !== undefined && { date: toDate(patch.date) }),
      ...(patch.isRecurring !== undefined && { isRecurring: patch.isRecurring }),
      updatedBy: ctx.userId,
      updatedOn: new Date(),
    })
    .where(and(eq(schema.holiday.holidayId, holidayId), eq(schema.holiday.orgId, ctx.orgId)))
    .returning();
  if (!row) throw new NotFoundError('HOLIDAY_NOT_FOUND');
  return row;
}

export async function deleteHoliday(ctx: AuthContext, holidayId: string): Promise<void> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .delete(schema.holiday)
    .where(and(eq(schema.holiday.holidayId, holidayId), eq(schema.holiday.orgId, ctx.orgId)))
    .returning({ id: schema.holiday.holidayId });
  if (!row) throw new NotFoundError('HOLIDAY_NOT_FOUND');
}

// The holidays in effect for a person, used by the working-day engine. Returns the
// set for `location` across [fromYear..toYear]: recurring (fixed) holidays plus that
// span's observed (movable) ones. A holiday with no location is org-wide (custom) and
// always applies; a location additionally pulls in that country's holidays. No orgId
// scoping is done by the caller's ctx here — this is an internal resolver, so it takes
// orgId explicitly.
export async function resolveHolidays(
  orgId: string,
  location: string | null,
  fromYear: number,
  toYear: number
): Promise<{ date: string; isRecurring: boolean }[]> {
  const span = and(gte(schema.holiday.date, yearStart(fromYear)), lt(schema.holiday.date, nextYearStart(toYear)));
  const locationMatch = location
    ? or(eq(schema.holiday.location, location), isNull(schema.holiday.location))
    : isNull(schema.holiday.location);
  const rows = await db
    .select({ date: schema.holiday.date, isRecurring: schema.holiday.isRecurring })
    .from(schema.holiday)
    .where(and(eq(schema.holiday.orgId, orgId), or(eq(schema.holiday.isRecurring, true), span), locationMatch));
  // date is a timestamp (Date); the working-day engine wants a clean YYYY-MM-DD —
  // String(Date) gives a locale string that breaks its slice(0,10), so normalise here.
  return rows.map((h) => ({ date: new Date(h.date).toISOString().slice(0, 10), isRecurring: h.isRecurring }));
}

// Year-end job: movable (observed) holidays are stored per-year, so next year's dates
// must be materialised. For every (org, location) that has chosen movable holidays,
// recompute those same holidays' dates for `year` from date-holidays and insert the
// missing ones. Idempotent — skips names already present for the year. Cron-triggered.
export async function materializeHolidays(year: number): Promise<{ inserted: number }> {
  const chosen = await db
    .selectDistinct({ orgId: schema.holiday.orgId, location: schema.holiday.location, name: schema.holiday.name })
    .from(schema.holiday)
    .where(and(eq(schema.holiday.isCustom, false), eq(schema.holiday.isRecurring, false)));

  const byLocation = new Map<string, { orgId: string; location: string; names: Set<string> }>();
  for (const c of chosen) {
    if (!c.location) continue;
    const key = `${c.orgId}|${c.location}`;
    const entry = byLocation.get(key) ?? { orgId: c.orgId, location: c.location, names: new Set<string>() };
    entry.names.add(c.name);
    byLocation.set(key, entry);
  }

  const present = await db
    .select({ orgId: schema.holiday.orgId, location: schema.holiday.location, name: schema.holiday.name })
    .from(schema.holiday)
    .where(
      and(
        eq(schema.holiday.isCustom, false),
        eq(schema.holiday.isRecurring, false),
        gte(schema.holiday.date, yearStart(year)),
        lt(schema.holiday.date, nextYearStart(year))
      )
    );
  const presentKeys = new Set(present.map((p) => `${p.orgId}|${p.location}|${p.name}`));

  const rows: {
    name: string;
    date: Date;
    location: string;
    isRecurring: boolean;
    isCustom: boolean;
    orgId: string;
    createdBy: string;
  }[] = [];
  for (const { orgId, location, names } of byLocation.values()) {
    const computed = new Map(suggestHolidays(location, year).map((h) => [h.name, h]));
    for (const name of names) {
      if (presentKeys.has(`${orgId}|${location}|${name}`)) continue;
      const hit = computed.get(name);
      if (!hit || hit.fixed) continue; // not a movable public holiday this year
      rows.push({
        name,
        date: toDate(hit.date),
        location,
        isRecurring: false,
        isCustom: false,
        orgId,
        createdBy: 'system',
      });
    }
  }
  if (rows.length) await db.insert(schema.holiday).values(rows);
  return { inserted: rows.length };
}
