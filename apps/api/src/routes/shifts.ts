import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  createShift,
  listShifts,
  getShift,
  updateShift,
  assignShift,
  listAssignments,
  clearAssignment,
} from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { shiftDto, shiftAssignmentDto } from '../dto';

const TIME = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'expected HH:MM');
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const NUM = z.string().regex(/^\d+(\.\d+)?$/, 'expected a number');

const createShiftSchema = z.object({
  name: z.string().min(1).max(255),
  startTime: TIME,
  endTime: TIME,
  crossesMidnight: z.boolean().optional(),
  breakMinutes: z.number().int().min(0).optional(),
  graceMinutes: z.number().int().min(0).optional(),
  fullDayHours: NUM.optional(),
  halfDayHours: NUM.optional(),
  isFlexible: z.boolean().optional(),
});
const updateShiftSchema = createShiftSchema.partial();
const assignSchema = z.object({
  userId: z.string().min(1),
  shiftId: z.string().min(1),
  fromDate: DATE,
  toDate: DATE.nullish(),
});
const assignQuery = z.object({ userId: z.string().optional() });

// Shift definitions + the roster (effective-dated assignments). ADMIN write, MANAGER
// read. Assignment routes are static (declared before /:id).
export const shifts = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(createShiftSchema), async (c) =>
    c.json(serialize(shiftDto, await createShift(c.get('auth'), c.get('body'))), 201)
  )
  .get('/', async (c) => c.json({ data: serialize(z.array(shiftDto), await listShifts(c.get('auth'))) }))
  .post('/assignments', idempotency, validateBody(assignSchema), async (c) =>
    c.json(serialize(shiftAssignmentDto, await assignShift(c.get('auth'), c.get('body'))), 201)
  )
  .get('/assignments', validateQuery(assignQuery), async (c) =>
    c.json({
      data: serialize(z.array(shiftAssignmentDto), await listAssignments(c.get('auth'), c.get('query').userId)),
    })
  )
  .delete('/assignments/:id', async (c) => {
    await clearAssignment(c.get('auth'), c.req.param('id'));
    return c.json({ deleted: true });
  })
  .get('/:id', async (c) => {
    const s = await getShift(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(s.version));
    return c.json(serialize(shiftDto, s));
  })
  .patch('/:id', validateBody(updateShiftSchema), async (c) => {
    const s = await updateShift(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(s.version));
    return c.json(serialize(shiftDto, s));
  });
