import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  suggestHolidays,
  supportedCountries,
  listHolidays,
  importHolidays,
  addCustomHoliday,
  updateHoliday,
  deleteHoliday,
} from '@avkash/holidays';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { holidayDto } from '../dto';

const YEAR = z.coerce.number().int().min(2000).max(2100);
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

const suggestQuery = z.object({ country: z.string().length(2), year: YEAR });
const listQuery = z.object({ location: z.string().optional(), year: YEAR.optional() });
const importSchema = z.object({
  location: z.string().min(2).max(50),
  year: YEAR,
  holidays: z.array(z.object({ name: z.string().min(1).max(255), date: DATE, fixed: z.boolean() })),
});
const addSchema = z.object({
  name: z.string().min(1).max(255),
  date: DATE,
  location: z.string().max(50).optional(),
  isRecurring: z.boolean().optional(),
});
const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  date: DATE.optional(),
  isRecurring: z.boolean().optional(),
});

// Holiday calendar. Suggestions are computed live from date-holidays; the org's chosen
// set + custom entries live in the Holiday table. Writes are HR-only (enforced in domain).
export const holidays = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/countries', (c) => c.json({ data: supportedCountries() }))
  .get('/suggestions', validateQuery(suggestQuery), (c) => {
    const { country, year } = c.get('query');
    return c.json({ data: suggestHolidays(country, year) });
  })
  .get('/', validateQuery(listQuery), async (c) =>
    c.json({ data: serialize(z.array(holidayDto), await listHolidays(c.get('auth'), c.get('query'))) })
  )
  .post('/import', validateBody(importSchema), async (c) =>
    c.json({ data: serialize(z.array(holidayDto), await importHolidays(c.get('auth'), c.get('body'))) }, 201)
  )
  .post('/', validateBody(addSchema), async (c) =>
    c.json(serialize(holidayDto, await addCustomHoliday(c.get('auth'), c.get('body'))), 201)
  )
  .patch('/:id', validateBody(updateSchema), async (c) =>
    c.json(serialize(holidayDto, await updateHoliday(c.get('auth'), c.req.param('id'), c.get('body'))))
  )
  .delete('/:id', async (c) => {
    await deleteHoliday(c.get('auth'), c.req.param('id'));
    return c.json({ deleted: true });
  });
