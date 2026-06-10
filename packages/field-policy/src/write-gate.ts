import { ForbiddenError } from '@avkash/shared';
import type { FieldGroupGrant } from '@avkash/shared';

/**
 * Write gate: rejects request bodies that contain fields belonging to groups
 * outside the caller's grant.write set.
 *
 * Wire up AFTER validateBody — the body is already typed. This helper is
 * opt-in; individual routes call it. WS5 will wire it for the pilot routes.
 *
 * @param grant   Resolved FieldGroupGrant for the caller.
 * @param groups  group name → DTO field names (from ResourceFieldGroups.groups).
 * @param body    The validated request body (plain object).
 * @throws ForbiddenError('FORBIDDEN_FIELD') when the body contains fields in
 *         groups the caller cannot write.
 */
export function assertWritableFields(
  grant: FieldGroupGrant,
  groups: Record<string, readonly string[]>,
  body: Record<string, unknown>
): void {
  const presentKeys = new Set(Object.keys(body));
  const forbidden: string[] = [];

  for (const [groupName, fields] of Object.entries(groups)) {
    if (!grant.write.has(groupName)) {
      for (const field of fields) {
        if (presentKeys.has(field)) forbidden.push(field);
      }
    }
  }

  if (forbidden.length > 0) {
    throw new ForbiddenError('FORBIDDEN_FIELD', { fields: forbidden });
  }
}
