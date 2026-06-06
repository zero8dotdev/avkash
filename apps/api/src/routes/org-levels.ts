import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { createOrgLevel, listOrgLevels, getOrgLevel, updateOrgLevel, archiveOrgLevel } from '@avkash/org';
import { setShiftLevelRestrictions, getShiftLevelRestrictions } from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { orgLevelDto } from '../dto';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(64),
  description: z.string().max(500).nullish(),
  rank: z.number().int(),
  isFloating: z.boolean().optional(),
  requiresPunchConfirmation: z.boolean().optional(),
});
const patchSchema = createSchema.partial();
const listQuery = z.object({ includeInactive: z.coerce.boolean().optional() });

const levelIdsSchema = z.object({ levelIds: z.array(z.string().min(1)) });

export const orgLevels = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listQuery), async (c) => {
    const q = c.get('query');
    return c.json({ data: serialize(orgLevelDto.array(), await listOrgLevels(c.get('auth'), q.includeInactive)) });
  })
  .post('/', idempotency, validateBody(createSchema), async (c) => {
    const row = await createOrgLevel(c.get('auth'), c.get('body'));
    return c.json(serialize(orgLevelDto, row), 201);
  })
  .get('/:id', async (c) => {
    const row = await getOrgLevel(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(row.version));
    return c.json(serialize(orgLevelDto, row));
  })
  .patch('/:id', validateBody(patchSchema), async (c) => {
    const row = await updateOrgLevel(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(row.version));
    return c.json(serialize(orgLevelDto, row));
  })
  .delete('/:id', async (c) => {
    await archiveOrgLevel(c.get('auth'), c.req.param('id'));
    return c.body(null, 204);
  });

// Shift-level restriction management nested under /shifts/:shiftId/levels.
// Mounted separately in app.ts as /shifts/:shiftId/levels.
export const shiftLevelRestrictions = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) => {
    const shiftId = c.req.param('shiftId') ?? '';
    const rows = await getShiftLevelRestrictions(c.get('auth'), shiftId);
    return c.json({ data: rows });
  })
  .put('/', validateBody(levelIdsSchema), async (c) => {
    const shiftId = c.req.param('shiftId') ?? '';
    await setShiftLevelRestrictions(c.get('auth'), shiftId, c.get('body').levelIds);
    return c.body(null, 204);
  });
