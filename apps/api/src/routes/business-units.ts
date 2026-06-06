import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  createBusinessUnit,
  listBusinessUnits,
  getBusinessUnit,
  updateBusinessUnit,
  archiveBusinessUnit,
} from '@avkash/org';
import { setUserBusinessUnit } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { businessUnitDto } from '../dto';

const HEX6 = z.string().regex(/^[0-9a-fA-F]{6}$/).optional();
const createSchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).nullish(),
  logoUrl: z.string().max(1000).nullish(),
  brandColor: HEX6,
});
const patchSchema = createSchema.partial();
const setUnitSchema = z.object({ businessUnitId: z.string().min(1).nullable() });

export const businessUnits = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) =>
    c.json({ data: serialize(businessUnitDto.array(), await listBusinessUnits(c.get('auth'))) })
  )
  .post('/', idempotency, validateBody(createSchema), async (c) => {
    const row = await createBusinessUnit(c.get('auth'), c.get('body'));
    return c.json(serialize(businessUnitDto, row), 201);
  })
  .get('/:id', async (c) => {
    const row = await getBusinessUnit(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(row.version));
    return c.json(serialize(businessUnitDto, row));
  })
  .patch('/:id', validateBody(patchSchema), async (c) => {
    const row = await updateBusinessUnit(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(row.version));
    return c.json(serialize(businessUnitDto, row));
  })
  .delete('/:id', async (c) => {
    await archiveBusinessUnit(c.get('auth'), c.req.param('id'));
    return c.body(null, 204);
  });

// Nested under /employees/:userId/business-unit — set/clear the user's branding unit.
export const employeeBusinessUnit = new Hono<AppEnv>()
  .use(requireAuth)
  .patch('/', validateBody(setUnitSchema), async (c) => {
    const userId = c.req.param('userId') ?? '';
    await setUserBusinessUnit(c.get('auth'), userId, c.get('body').businessUnitId);
    return c.json({ updated: true });
  });
