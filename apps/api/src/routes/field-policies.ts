// Field-policy admin routes (tenant-facing CRUD).
//
// OWNER/ADMIN-guarded. Mounting point: /field-policies.
// These routes let a tenant admin flip a field_policy row so that, say,
// HRBP (Plants BU) can read compensation — without a deploy (demo beat 4).
//
// All writes call invalidateFieldPolicy (via the crud helpers) so the resolver
// cache drops immediately; the next resolve picks up the new row.
//
// Pattern follows blackouts.ts: validateBody/validateQuery, serialize DTOs,
// ETag / If-Match on PATCH (table has a `version` column).

import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { listFieldPolicies, upsertFieldPolicy, updateFieldPolicy, deleteFieldPolicy } from '@avkash/field-policy';
import { requireRole } from '@avkash/auth';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { fieldPolicyDto } from '../dto';

const ACCESS_VALUES = ['read', 'write', 'none'] as const;

const upsertSchema = z.object({
  resource: z.string().min(1).max(128),
  fieldGroup: z.string().min(1).max(128),
  relation: z.string().min(1).max(128),
  access: z.enum(ACCESS_VALUES),
});

const patchSchema = z.object({
  access: z.enum(ACCESS_VALUES),
});

const listQuery = z.object({
  resource: z.string().min(1).max(128).optional(),
});

export const fieldPolicies = new Hono<AppEnv>()
  .use(requireAuth)
  // Tenant admin must be OWNER or ADMIN — field visibility is a sensitive
  // platform-level setting; MANAGER is not enough.
  .get('/', validateQuery(listQuery), async (c) => {
    const ctx = c.get('auth');
    requireRole(ctx, 'ADMIN');
    const rows = await listFieldPolicies(ctx, c.get('query'));
    return c.json({ data: serialize(fieldPolicyDto.array(), rows) });
  })
  // POST creates or replaces (upsert on unique key). An Idempotency-Key is
  // required so retry-on-network-error does not create duplicate rows.
  .post('/', idempotency, validateBody(upsertSchema), async (c) => {
    const ctx = c.get('auth');
    requireRole(ctx, 'ADMIN');
    const row = await upsertFieldPolicy(ctx, c.get('body'));
    c.header('ETag', etag(row.version));
    return c.json(serialize(fieldPolicyDto, row), 201);
  })
  // PATCH is version-checked (optimistic concurrency). Caller must supply
  // If-Match: "<version>" header (428 if missing, 412 if stale).
  .patch('/:id', validateBody(patchSchema), async (c) => {
    const ctx = c.get('auth');
    requireRole(ctx, 'ADMIN');
    const row = await updateFieldPolicy(ctx, c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(row.version));
    return c.json(serialize(fieldPolicyDto, row));
  })
  .delete('/:id', async (c) => {
    const ctx = c.get('auth');
    requireRole(ctx, 'ADMIN');
    await deleteFieldPolicy(ctx, c.req.param('id'));
    return c.body(null, 204);
  });
