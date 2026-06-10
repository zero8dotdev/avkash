import type { z } from 'zod';
import type { FieldGroupGrant } from './field-groups';

// The response-side mirror of validate(): project domain data onto a public schema
// (a drizzle-zod DTO with internal columns omitted) before it goes on the wire.
// z.object strips any field not in the schema, so the response is a deliberate
// contract — not whatever columns the table happens to have today.
//
// Optional third arg `{ grant, groups }`: drops fields whose group the caller
// does not hold in grant.read. Hidden fields are OMITTED (never null, never masked)
// — plan 51 wire semantics. Backward-compatible: existing two-arg calls unchanged.
export function serialize<S extends z.ZodType>(
  schema: S,
  data: unknown,
  projection?: {
    grant: FieldGroupGrant;
    /** group name → the DTO field names it contains (from ResourceFieldGroups.groups) */
    groups: Record<string, readonly string[]>;
  }
): z.infer<S> {
  const parsed = schema.parse(data) as Record<string, unknown>;

  if (!projection) return parsed as z.infer<S>;

  const { grant, groups } = projection;

  // Collect all field names that belong to groups the caller CANNOT read.
  const hidden = new Set<string>();
  for (const [groupName, fields] of Object.entries(groups)) {
    if (!grant.read.has(groupName)) {
      for (const field of fields) hidden.add(field);
    }
  }

  if (hidden.size === 0) return parsed as z.infer<S>;

  // Build projected object: omit hidden keys entirely (do not set to null).
  const projected: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!hidden.has(key)) projected[key] = value;
  }
  return projected as z.infer<S>;
}
