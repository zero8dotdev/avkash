import Holidays from 'date-holidays';

export interface HolidaySuggestion {
  name: string;
  date: string; // YYYY-MM-DD (the actual date in the requested year)
  type: string; // 'public' | 'bank' | 'optional' | ...
  fixed: boolean; // true = recurs on the same month+day every year; false = movable
}

// A date-holidays rule that's just a month-day ("12-25", "01-26") is a fixed-date
// holiday safe to recur by month+day. Anything referencing easter/lunar/nth-weekday
// ("easter -2", "4th thursday in November") is movable and must be stored per-year.
const isFixedRule = (rule: string): boolean => /^\d{1,2}-\d{1,2}(\s|$)/.test(rule.trim());

export function suggestHolidays(country: string, year: number): HolidaySuggestion[] {
  const hd = new Holidays(country);
  const list = hd.getHolidays(year) ?? [];
  return list
    .filter((h) => h.type === 'public' || h.type === 'bank')
    .map((h) => ({
      name: h.name,
      date: h.date.slice(0, 10),
      type: h.type,
      fixed: isFixedRule(h.rule),
    }));
}

export function supportedCountries(): { code: string; name: string }[] {
  const hd = new Holidays();
  const countries = hd.getCountries() as Record<string, string>;
  return Object.entries(countries).map(([code, name]) => ({ code, name }));
}
