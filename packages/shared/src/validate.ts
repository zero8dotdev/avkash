import { z } from 'zod';
import { ValidationError } from './errors';

// Parse untrusted input against a Zod schema at the transport boundary. On failure,
// throws a ValidationError whose params carry per-field issues — the edge then
// localizes the VALIDATION_FAILED code and returns a 400. Returning z.infer<S>
// preserves the inferred type, so callers get compile-time proof the validated
// shape matches the domain input it feeds (no drift between schema and contract).
export function validate<S extends z.ZodType>(
  schema: S,
  data: unknown
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('VALIDATION_FAILED', {
      issues: result.error.issues.map((i) => ({
        path: i.path.join('.') || '(root)',
        message: i.message,
      })),
    });
  }
  return result.data;
}
