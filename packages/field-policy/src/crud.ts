import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import type { FieldPolicy, NewFieldPolicy } from '@avkash/db';
import type { AuthContext } from '@avkash/shared';
import { NotFoundError, PreconditionFailedError, PreconditionRequiredError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { invalidateFieldPolicy } from './resolver';

export type { FieldPolicy };

export interface UpsertFieldPolicyInput {
  resource: string;
  fieldGroup: string;
  relation: string;
  access: 'read' | 'write' | 'none';
}

export interface UpdateFieldPolicyInput {
  access: 'read' | 'write' | 'none';
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listFieldPolicies(ctx: AuthContext, opts?: { resource?: string }): Promise<FieldPolicy[]> {
  requireRole(ctx, 'MANAGER');
  const conditions = [eq(schema.fieldPolicy.orgId, ctx.orgId)];
  if (opts?.resource) conditions.push(eq(schema.fieldPolicy.resource, opts.resource));
  return db
    .select()
    .from(schema.fieldPolicy)
    .where(and(...conditions));
}

// ── Upsert (create or replace) ────────────────────────────────────────────────

export async function upsertFieldPolicy(ctx: AuthContext, input: UpsertFieldPolicyInput): Promise<FieldPolicy> {
  requireRole(ctx, 'MANAGER');

  const insert: NewFieldPolicy = {
    orgId: ctx.orgId,
    resource: input.resource,
    fieldGroup: input.fieldGroup,
    relation: input.relation,
    access: input.access,
    createdBy: ctx.userId ?? undefined,
    updatedBy: ctx.userId ?? undefined,
  };

  const [row] = await db
    .insert(schema.fieldPolicy)
    .values(insert)
    .onConflictDoUpdate({
      target: [
        schema.fieldPolicy.orgId,
        schema.fieldPolicy.resource,
        schema.fieldPolicy.fieldGroup,
        schema.fieldPolicy.relation,
      ],
      set: {
        access: input.access,
        updatedAt: new Date(),
        updatedBy: ctx.userId ?? undefined,
        version: sql`${schema.fieldPolicy.version} + 1`,
      },
    })
    .returning();

  invalidateFieldPolicy(ctx.orgId, input.resource);
  return row;
}

// ── Update (version-checked) ──────────────────────────────────────────────────

export async function updateFieldPolicy(
  ctx: AuthContext,
  id: string,
  patch: UpdateFieldPolicyInput,
  ifMatch: number | undefined
): Promise<FieldPolicy> {
  requireRole(ctx, 'MANAGER');

  if (ifMatch === undefined) throw new PreconditionRequiredError('PRECONDITION_REQUIRED');

  // CAS update: bumps version only if the current version matches If-Match.
  const [row] = await db
    .update(schema.fieldPolicy)
    .set({
      access: patch.access,
      updatedAt: new Date(),
      updatedBy: ctx.userId ?? undefined,
      version: ifMatch + 1,
    })
    .where(
      and(
        eq(schema.fieldPolicy.id, id),
        eq(schema.fieldPolicy.orgId, ctx.orgId),
        eq(schema.fieldPolicy.version, ifMatch)
      )
    )
    .returning();

  if (!row) {
    // Determine if not found or stale.
    const existing = await db
      .select({ id: schema.fieldPolicy.id })
      .from(schema.fieldPolicy)
      .where(and(eq(schema.fieldPolicy.id, id), eq(schema.fieldPolicy.orgId, ctx.orgId)))
      .limit(1);
    if (!existing.length) throw new NotFoundError('FIELD_POLICY_NOT_FOUND');
    throw new PreconditionFailedError('PRECONDITION_FAILED');
  }

  invalidateFieldPolicy(ctx.orgId, row.resource);
  return row;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteFieldPolicy(ctx: AuthContext, id: string): Promise<void> {
  requireRole(ctx, 'MANAGER');

  const [row] = await db
    .delete(schema.fieldPolicy)
    .where(and(eq(schema.fieldPolicy.id, id), eq(schema.fieldPolicy.orgId, ctx.orgId)))
    .returning({ resource: schema.fieldPolicy.resource });

  if (!row) throw new NotFoundError('FIELD_POLICY_NOT_FOUND');

  invalidateFieldPolicy(ctx.orgId, row.resource);
}
