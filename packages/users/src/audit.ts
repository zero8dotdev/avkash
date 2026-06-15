// Sensitive-read audit helper.
//
// When a caller reads an employee record and the serialized grant includes
// groups in EMPLOYEE_FIELD_GROUPS.auditedGroups (identity / medical), we emit
// ONE audit row per request — never one per field — as required by HR compliance
// frameworks (DPDP/GDPR data-minimization audit trail).
//
// The row follows the same shape as the domain's direct activityLog inserts
// (see employee.ts updateProfile → db.insert(schema.activityLog)).
// keyword: 'employee.sensitive_fields.read'
// changedColumns: { groups: string[], targetUserId: string }

import { db, schema } from '@avkash/db';
import type { AuthContext } from '@avkash/shared';

/**
 * Write a single audit row recording that `callerCtx` read sensitive field
 * groups of the employee identified by `targetUserId`.
 *
 * ONLY call this when:
 *   1. The grant includes at least one audited group (identity / medical).
 *   2. The caller is NOT the subject (subject reading own record is not audited).
 *
 * The call is fire-and-forget best-effort: a failure must not fail the HTTP
 * response. Callers wrap with try/catch accordingly.
 */
export async function writeSensitiveReadAudit(
  ctx: AuthContext,
  targetUserId: string,
  auditedGroupsRead: string[]
): Promise<void> {
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'EmployeeProfile',
    keyword: 'employee.sensitive_fields.read',
    userId: targetUserId,
    changedColumns: {
      groups: auditedGroupsRead,
      targetUserId,
    },
    changedBy: ctx.userId ?? null,
  });
}
