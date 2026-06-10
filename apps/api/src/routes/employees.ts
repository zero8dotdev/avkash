import { Hono } from 'hono';
import { z } from 'zod';
import { getEmployeeProfile, updateProfile, listEmployees, bulkSetLevel, setUserDepartment, writeSensitiveReadAudit } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { etag, requireIfMatch } from '../concurrency';
import { authzClient } from '@avkash/authz';
import {
  resolveFieldGroups,
  assertWritableFields,
  assertQueryableFields,
  EMPLOYEE_FIELD_GROUPS,
  type QueryParamAnnotation,
} from '@avkash/field-policy';
import { serialize } from '@avkash/shared';
import { db, schema } from '@avkash/db';
import { eq, inArray } from 'drizzle-orm';
import { userDto } from '../dto';

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
  levelId: z.string().min(1).nullable().optional(),
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
const listQuery = z.object({
  teamId: z.string().optional(),
  departmentId: z.string().optional(),
  levelId: z.string().optional(),
  businessUnitId: z.string().optional(),
  status: z.string().optional(),
  // Field-group gated sort param (Plan 51 Piece 3 query side-channel gate).
  sort: z.string().optional(),
});
const bulkLevelSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(500),
  levelId: z.string().min(1),
});
const departmentSchema = z.object({ departmentId: z.string().min(1).nullable() });

// Sensitive sort/filter params for the list endpoint.
// Any ?sort=salary (or other compensation/identity/medical field) is a side-channel.
const LIST_SENSITIVE_PARAMS: QueryParamAnnotation[] = [
  { param: 'sort', value: 'salary',      group: 'compensation' },
  { param: 'sort', value: 'bankAccount', group: 'compensation' },
  { param: 'sort', value: 'bankIfsc',    group: 'compensation' },
  { param: 'sort', value: 'bankName',    group: 'compensation' },
  { param: 'sort', value: 'pan',         group: 'identity' },
  { param: 'sort', value: 'aadhaar',     group: 'identity' },
  { param: 'sort', value: 'passport',    group: 'identity' },
  { param: 'sort', value: 'dateOfBirth', group: 'identity' },
  { param: 'sort', value: 'disability',  group: 'medical' },
  { param: 'sort', value: 'conditions',  group: 'medical' },
  { param: 'sort', value: 'bloodGroup',  group: 'medical' },
];

// Lookup the EmployeeProfile.id for a given userId. Used to construct the FGA
// employee object ref. Returns null when no profile row exists yet.
async function resolveProfileId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: schema.employeeProfile.id })
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

// Resolve extra FGA-derived relations for the field-group resolver.
// These augment ctx.role so that 'subject' and 'hr_admin' groups in
// EMPLOYEE_FIELD_GROUPS.defaults are matched correctly.
async function resolveEmployeeRelations(
  ctx: import('@avkash/shared').AuthContext,
  subjectUserId: string
): Promise<string[]> {
  const relations: string[] = [ctx.role as string];

  // Subject: the employee seeing their own record.
  if (ctx.userId && ctx.userId === subjectUserId) {
    relations.push('subject');
  }

  // hr_admin: ADMIN and OWNER callers already have 'write' on all groups via
  // the ADMIN/OWNER default matrix; they do not need an extra FGA relation key.
  // We still push 'hr_admin' for callers whose FGA user holds the hr_admin
  // relation (e.g. custom org overrides that use the 'hr_admin' key).
  if (ctx.role === 'ADMIN' || ctx.role === 'OWNER') {
    relations.push('hr_admin');
  }

  return relations;
}

// /me before /:id so "me" isn't captured as an id.
export const employees = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listQuery), async (c) => {
    const ctx = c.get('auth');
    const query = c.get('query');

    // Resolve field-group grant for the caller (role-based + FGA-derived relations).
    // /employees list does NOT check per-employee subject relation (caller is viewing
    // a list, not their own record). Subject relation checked in GET /:id only.
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, [ctx.role as string]);

    // Gate sort/filter params that draw on sensitive field groups.
    assertQueryableFields(grant, EMPLOYEE_FIELD_GROUPS.groups, query as Record<string, string | undefined>, LIST_SENSITIVE_PARAMS);

    // FGA list filtering: build the WHERE id IN (...) constraint.
    // Performance escape: ADMIN/OWNER/hr_admin callers see all employees without
    // a ListObjects call (they have full visibility by role; avoiding the FGA round-trip
    // is a deliberate perf choice documented in the WS5 report).
    const isHrAdmin = ctx.role === 'ADMIN' || ctx.role === 'OWNER';
    const rows = await listEmployees(ctx, query);

    let filtered = rows;
    if (!isHrAdmin) {
      // For MANAGER and USER callers, intersect with FGA-accessible employee ids.
      // FGA employee objects use EmployeeProfile.id (not user.id). We must map.
      const accessibleProfileIds = await authzClient.listAccessible(ctx, 'viewer', 'employee');
      if (accessibleProfileIds.length === 0) {
        filtered = [];
      } else {
        // Map the userId-keyed rows against accessible profileIds via a lookup.
        // Build a userId→profileId map for the returned rows.
        const userIds = rows.map((r) => r.userId as string);
        const profileRows =
          userIds.length > 0
            ? await db
                .select({ id: schema.employeeProfile.id, userId: schema.employeeProfile.userId })
                .from(schema.employeeProfile)
                .where(inArray(schema.employeeProfile.userId, userIds))
            : [];
        const profileIdByUserId = new Map(profileRows.map((p) => [p.userId, p.id]));
        const accessibleSet = new Set(accessibleProfileIds);
        filtered = rows.filter((r) => {
          const pid = profileIdByUserId.get(r.userId as string);
          return pid ? accessibleSet.has(pid) : false;
        });
      }
    }

    // Apply field-group projection to each row.
    const projected = filtered.map((row) => serialize(userDto.partial(), row, { grant, groups: EMPLOYEE_FIELD_GROUPS.groups }));
    return c.json({ data: projected });
  })
  .post('/bulk-level', validateBody(bulkLevelSchema), async (c) => {
    const { userIds, levelId } = c.get('body');
    await bulkSetLevel(c.get('auth'), userIds, levelId);
    return c.json({ updated: userIds.length }, 200);
  })
  .get('/me', async (c) => {
    const ctx = c.get('auth');
    const subjectUserId = ctx.userId ?? '';
    const { profile, version } = await getEmployeeProfile(ctx, subjectUserId);
    // /me is always the subject — give them the subject relation for field-group
    // resolution so they see their own compensation group.
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, await resolveEmployeeRelations(ctx, subjectUserId));
    c.header('ETag', etag(version));
    return c.json({ data: serialize(userDto.partial(), profile, { grant, groups: EMPLOYEE_FIELD_GROUPS.groups }) });
  })
  .patch('/me', validateBody(selfPatchSchema), async (c) => {
    const ctx = c.get('auth');
    const subjectUserId = ctx.userId ?? '';
    const body = c.get('body');
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, await resolveEmployeeRelations(ctx, subjectUserId));
    assertWritableFields(grant, EMPLOYEE_FIELD_GROUPS.groups, body as Record<string, unknown>);
    const { profile, version } = await updateProfile(ctx, subjectUserId, body, requireIfMatch(c));
    c.header('ETag', etag(version));
    return c.json({ data: serialize(userDto.partial(), profile, { grant, groups: EMPLOYEE_FIELD_GROUPS.groups }) });
  })
  .get('/:id', async (c) => {
    const ctx = c.get('auth');
    const subjectUserId = c.req.param('id');
    const { profile, version } = await getEmployeeProfile(ctx, subjectUserId);
    // Determine if this is the subject's own record for field visibility.
    const relations = await resolveEmployeeRelations(ctx, subjectUserId);
    // FGA viewer check: ADMIN/OWNER already have access; for others, check
    // the FGA viewer relation via employee profile id.
    const isHrAdmin = ctx.role === 'ADMIN' || ctx.role === 'OWNER';
    if (!isHrAdmin) {
      const profileId = await resolveProfileId(subjectUserId);
      // If profileId exists in FGA, use requireRelation for viewer check.
      // If not (profile not yet synced), domain's assertInOrg already ran in getEmployeeProfile.
      if (profileId) {
        // Only check FGA viewer for non-self, non-hr_admin callers.
        // The subject can always see their own record (checked via resolveEmployeeRelations).
        if (!relations.includes('subject')) {
          await authzClient.requireRelation(ctx, 'viewer', `employee:${profileId}`);
        }
      }
    }
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, relations);
    c.header('ETag', etag(version));
    // Sensitive-read audit (Plan 51 Piece 3): if the grant includes any audited
    // group (identity / medical) and the caller is NOT the subject, emit one audit
    // row per request — batched, never per field. Fire-and-forget (errors logged,
    // must not fail the response).
    const isSubject = relations.includes('subject');
    if (!isSubject) {
      const auditedGroupsRead = (EMPLOYEE_FIELD_GROUPS.auditedGroups ?? []).filter((g) => grant.read.has(g));
      if (auditedGroupsRead.length > 0) {
        writeSensitiveReadAudit(ctx, subjectUserId, auditedGroupsRead).catch((err) => {
          console.error('[authz-audit] sensitive-read audit write failed:', err instanceof Error ? err.message : String(err));
        });
      }
    }
    return c.json({ data: serialize(userDto.partial(), profile, { grant, groups: EMPLOYEE_FIELD_GROUPS.groups }) });
  })
  .patch('/:id', validateBody(hrPatchSchema), async (c) => {
    const ctx = c.get('auth');
    const subjectUserId = c.req.param('id');
    const body = c.get('body');
    const relations = await resolveEmployeeRelations(ctx, subjectUserId);
    const grant = await resolveFieldGroups(ctx, 'employee', EMPLOYEE_FIELD_GROUPS, relations);
    assertWritableFields(grant, EMPLOYEE_FIELD_GROUPS.groups, body as Record<string, unknown>);
    const { profile, version } = await updateProfile(ctx, subjectUserId, body, requireIfMatch(c));
    c.header('ETag', etag(version));
    return c.json({ data: serialize(userDto.partial(), profile, { grant, groups: EMPLOYEE_FIELD_GROUPS.groups }) });
  })
  .patch('/:id/department', validateBody(departmentSchema), async (c) => {
    await setUserDepartment(c.get('auth'), c.req.param('id'), c.get('body').departmentId);
    return c.json({ updated: true });
  });
