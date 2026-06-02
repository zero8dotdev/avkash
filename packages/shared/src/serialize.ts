import type { z } from 'zod';

// The response-side mirror of validate(): project domain data onto a public schema
// (a drizzle-zod DTO with internal columns omitted) before it goes on the wire.
// z.object strips any field not in the schema, so the response is a deliberate
// contract — not whatever columns the table happens to have today.
export function serialize<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  return schema.parse(data);
}
