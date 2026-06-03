import { Hono } from 'hono';
import { z } from 'zod';
import { getEmployeeProfile, updateProfile, listEmployees } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

// Self-service: only SELF-write fields are exposed in the schema (defence-in-depth on
// top of the domain's assertWritable).
const selfPatchSchema = z.object({
  dateOfBirth: DATE.nullable().optional(),
  gender: z.string().max(32).nullable().optional(),
  maritalStatus: z.string().max(32).nullable().optional(),
  nationality: z.string().max(64).nullable().optional(),
  personalEmail: z.string().max(255).nullable().optional(),
  personalPhone: z.string().max(32).nullable().optional(),
  address: z.string().max(2000).nullable().optional(),
  emergencyContact: z
    .object({ name: z.string().optional(), relation: z.string().optional(), phone: z.string().optional() })
    .nullable()
    .optional(),
});
// HR: self fields + the HR-managed employment fields.
const hrPatchSchema = selfPatchSchema.extend({
  employeeCode: z.string().max(64).nullable().optional(),
  designation: z.string().max(255).nullable().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).nullable().optional(),
  workLocation: z.string().max(255).nullable().optional(),
  reportingManagerId: z.string().nullable().optional(),
  employmentStatus: z
    .enum(['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'RESIGNED', 'TERMINATED', 'ON_LONG_LEAVE'])
    .optional(),
  probationEndsOn: DATE.nullable().optional(),
  confirmedOn: DATE.nullable().optional(),
  exitDate: DATE.nullable().optional(),
  exitReason: z.string().max(500).nullable().optional(),
});
const listQuery = z.object({ teamId: z.string().optional(), status: z.string().optional() });

// /me before /:id so "me" isn't captured as an id.
export const employees = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listQuery), async (c) => c.json({ data: await listEmployees(c.get('auth'), c.get('query')) }))
  .get('/me', async (c) => c.json({ data: await getEmployeeProfile(c.get('auth'), c.get('auth').userId ?? '') }))
  .patch('/me', validateBody(selfPatchSchema), async (c) =>
    c.json({ data: await updateProfile(c.get('auth'), c.get('auth').userId ?? '', c.get('body')) })
  )
  .get('/:id', async (c) => c.json({ data: await getEmployeeProfile(c.get('auth'), c.req.param('id')) }))
  .patch('/:id', validateBody(hrPatchSchema), async (c) =>
    c.json({ data: await updateProfile(c.get('auth'), c.req.param('id'), c.get('body')) })
  );
