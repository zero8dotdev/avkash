import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  createWorkweekPattern,
  listWorkweekPatterns,
  getWorkweekPattern,
  updateWorkweekPattern,
  archiveWorkweekPattern,
} from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { workweekPatternDto } from '../dto';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

const createSchema = z.object({
  name: z.string().min(1).max(255),
  cycleLength: z.number().int().min(1).max(52),
  weeks: z.array(z.array(z.enum(DAYS))),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
});
const patchSchema = createSchema.partial();

export const workweekPatterns = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) =>
    c.json({ data: serialize(workweekPatternDto.array(), await listWorkweekPatterns(c.get('auth'))) })
  )
  .post('/', idempotency, validateBody(createSchema), async (c) => {
    const row = await createWorkweekPattern(c.get('auth'), c.get('body'));
    return c.json(serialize(workweekPatternDto, row), 201);
  })
  .get('/:id', async (c) => {
    const row = await getWorkweekPattern(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(row.version));
    return c.json(serialize(workweekPatternDto, row));
  })
  .patch('/:id', validateBody(patchSchema), async (c) => {
    const row = await updateWorkweekPattern(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(row.version));
    return c.json(serialize(workweekPatternDto, row));
  })
  .delete('/:id', async (c) => {
    await archiveWorkweekPattern(c.get('auth'), c.req.param('id'));
    return c.body(null, 204);
  });
