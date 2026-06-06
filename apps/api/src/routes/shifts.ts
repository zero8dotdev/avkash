import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  createShift,
  listShifts,
  getShift,
  updateShift,
  assignShift,
  validateAssignment,
  listAssignments,
  clearAssignment,
  coverage,
  generateRoster,
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
  minStaff: z.number().int().min(0).optional(),
  // Plan 30: gender restriction (SEZ). Level restrictions managed via /shifts/:id/levels.
  allowedGenders: z.array(z.string().max(32)).nullish(),
});
const updateShiftSchema = createShiftSchema.partial();
const assignSchema = z.object({
  userId: z.string().min(1),
  shiftId: z.string().min(1),
  fromDate: DATE,
  toDate: DATE.nullish(),
});
const assignQuery = z.object({ userId: z.string().optional() });
const coverageQuery = z.object({ locationId: z.string().min(1), from: DATE, to: DATE });
const generateSchema = z
  .object({
    userIds: z.array(z.string()).optional(),
    locationId: z.string().optional(),
    shiftIds: z.array(z.string()).min(1),
    from: DATE,
    to: DATE,
    replace: z.boolean().optional(),
  })
  .refine((b) => b.userIds?.length || b.locationId, { message: 'userIds or locationId required' });

// Shift definitions + the roster (effective-dated assignments). ADMIN write, MANAGER
// read. Assignment routes are static (declared before /:id).
export const shifts = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(createShiftSchema), async (c) =>
    c.json(serialize(shiftDto, await createShift(c.get('auth'), c.get('body'))), 201)
  )
  .get('/', async (c) => c.json({ data: serialize(z.array(shiftDto), await listShifts(c.get('auth'))) }))
  // Validate-only (dry-run) — the UI calls this while building the roster.
  .post('/assignments/validate', validateBody(assignSchema), async (c) =>
    c.json(await validateAssignment(c.get('auth'), c.get('body')))
  )
  // Assign. Hard conflicts (leave, double-booking) block with 409 unless ?force=true.
  .post('/assignments', idempotency, validateBody(assignSchema), async (c) => {
    const force = c.req.query('force') === 'true';
    return c.json(serialize(shiftAssignmentDto, await assignShift(c.get('auth'), c.get('body'), force)), 201);
  })
  .get('/assignments', validateQuery(assignQuery), async (c) =>
    c.json({
      data: serialize(z.array(shiftAssignmentDto), await listAssignments(c.get('auth'), c.get('query').userId)),
    })
  )
  .delete('/assignments/:id', async (c) => {
    await clearAssignment(c.get('auth'), c.req.param('id'));
    return c.json({ deleted: true });
  })
  // Coverage / gap view for a location over a date range.
  .get('/coverage', validateQuery(coverageQuery), async (c) => {
    const q = c.get('query');
    return c.json({ data: await coverage(c.get('auth'), q.locationId, q.from, q.to) });
  })
  // Generate a fair, constraint-aware rotation and persist it (replaces in-range days).
  .post('/roster/generate', idempotency, validateBody(generateSchema), async (c) =>
    c.json(await generateRoster(c.get('auth'), c.get('body')), 201)
  )
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
