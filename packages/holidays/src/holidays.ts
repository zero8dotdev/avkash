import { and, eq, or, gte, lt } from 'drizzle-orm';
import { db, schema, type Holiday } from '@avkash/db';
import { type AuthContext, NotFoundError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

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
