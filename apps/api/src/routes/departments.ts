import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  archiveDepartment,
  assignDepartmentToLocation,
  removeDepartmentFromLocation,
  setDepartmentHead,
  getDepartmentLocations,
} from '@avkash/org';
import { listTeamsByDepartment } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { departmentDto, departmentLocationDto, teamDto } from '../dto';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(32),
  description: z.string().max(500).nullish(),
});
const updateSchema = createSchema.partial();
const listQuery = z.object({
  locationId: z.string().min(1).optional(),
  activeOnly: z.coerce.boolean().optional(),
});
const locationAssignSchema = z.object({
  locationId: z.string().min(1),
  headUserId: z.string().min(1).nullish(),
});
const headSchema = z.object({ headUserId: z.string().min(1) });

export const departments = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(createSchema), async (c) => {
    const dept = await createDepartment(c.get('auth'), c.get('body'));
    return c.json(serialize(departmentDto, dept), 201);
  })
  .get('/', validateQuery(listQuery), async (c) => {
    const q = c.get('query');
    const list = await listDepartments(c.get('auth'), q);
    return c.json({ data: serialize(departmentDto.array(), list) });
  })
  .get('/:id', async (c) => {
    const dept = await getDepartment(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(dept.version));
    return c.json(serialize(departmentDto, dept));
  })
  .patch('/:id', validateBody(updateSchema), async (c) => {
    const dept = await updateDepartment(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(dept.version));
    return c.json(serialize(departmentDto, dept));
  })
  .delete('/:id', async (c) => {
    const dept = await archiveDepartment(c.get('auth'), c.req.param('id'));
    return c.json(serialize(departmentDto, dept));
  })
  // Department ↔ Location assignments
  .post('/:id/locations', validateBody(locationAssignSchema), async (c) => {
    const { locationId, headUserId } = c.get('body');
    const dl = await assignDepartmentToLocation(c.get('auth'), c.req.param('id'), locationId, headUserId);
    return c.json(serialize(departmentLocationDto, dl), 201);
  })
  .get('/:id/locations', async (c) => {
    const list = await getDepartmentLocations(c.get('auth'), c.req.param('id'));
    return c.json({ data: serialize(departmentLocationDto.array(), list) });
  })
  .delete('/:id/locations/:locationId', async (c) => {
    await removeDepartmentFromLocation(c.get('auth'), c.req.param('id'), c.req.param('locationId'));
    return c.json({ deleted: true });
  })
  .patch('/:id/locations/:locationId/head', validateBody(headSchema), async (c) => {
    const dl = await setDepartmentHead(
      c.get('auth'),
      c.req.param('id'),
      c.req.param('locationId'),
      c.get('body').headUserId
    );
    return c.json(serialize(departmentLocationDto, dl));
  })
  // Org-chart: teams that belong to this department, each with member headcount.
  .get('/:id/teams', async (c) => {
    const teams = await listTeamsByDepartment(c.get('auth'), c.req.param('id'));
    const teamWithCountDto = teamDto.extend({ memberCount: z.number() });
    return c.json({ data: serialize(teamWithCountDto.array(), teams) });
  });
